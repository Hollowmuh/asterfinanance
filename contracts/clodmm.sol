// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SavingsMarketplace
 * @dev Enhanced contract managing marketplace interactions and loan operations
 */
contract SavingsMarketplace is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant MARKETPLACE_ADMIN = keccak256("MARKETPLACE_ADMIN");
    bytes32 public constant LOAN_MANAGER = keccak256("LOAN_MANAGER");
    bytes32 public constant RISK_ASSESSOR = keccak256("RISK_ASSESSOR");
    
    IERC20 public daiToken;
    address public userContract;
    address public partnerContract;
    
    struct Match {
        uint256 id;
        address user;
        address partner;
        uint256 userAmount;
        uint256 partnerAmount;
        uint256 matchRate;
        uint256 startTime;
        uint256 endTime;
        MatchStatus status;
    }

    struct Loan {
        uint256 id;
        address borrower;
        address primaryGuarantor;
        address secondaryGuarantor;
        uint256 principal;
        uint256 collateralAmount;
        uint256 interestRate;
        uint256 termLength;
        uint256 startTime;
        uint256 lastPaymentTime;
        RepaymentSchedule schedule;
        LoanStatus status;
        uint256 creditScore;
    }

    struct Guarantor {
        bool isVerified;
        uint256 lockedStake;
        uint256 guaranteeLimit;
        uint256 activeGuarantees;
        uint256 successfulGuarantees;
    }

    enum MatchStatus { PENDING, ACTIVE, COMPLETED, CANCELLED }
    enum LoanStatus { PENDING, ACTIVE, DEFAULTED, COMPLETED }
    enum RepaymentSchedule { WEEKLY, MONTHLY, INCOME_BASED }
    
    // State variables for existing match functionality
    mapping(uint256 => Match) public matches;
    mapping(address => uint256[]) public userMatches;
    mapping(address => uint256[]) public partnerMatches;
    
    // New state variables for loan functionality
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoans;
    mapping(address => Guarantor) public guarantors;
    mapping(address => uint256) public creditScores;
    
    uint256 public nextMatchId = 1;
    uint256 public nextLoanId = 1;
    uint256 public platformFee = 25; // 0.25%
    uint256 public constant RATE_DENOMINATOR = 10000;
    
    // Loan specific constants
    uint256 public constant MIN_CREDIT_SCORE = 50;
    uint256 public constant MIN_SAVINGS_STREAK = 180 days; // 6 months
    uint256 public constant MIN_SUCCESSFUL_MATCHES = 3;
    uint256 public constant BASE_INTEREST_RATE = 500; // 5%
    uint256 public constant MAX_LOAN_DURATION = 365 days;
    
    // New events for loan functionality
    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 creditScore
    );
    event LoanApproved(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRate
    );
    event GuarantorAdded(
        uint256 indexed loanId,
        address indexed guarantor,
        uint256 stake
    );
    event LoanRepayment(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount
    );
    event LoanCompleted(uint256 indexed loanId);
    event LoanDefaulted(uint256 indexed loanId);
    
    // Additional errors for loan functionality
    error InsufficientCreditScore();
    error InsufficientSavingsHistory();
    error InvalidGuarantor();
    error LoanLimitExceeded();
    error InvalidRepaymentAmount();
    
    constructor(
        address _daiToken,
        address _userContract,
        address _partnerContract
    ) {
        if (_daiToken == address(0) || _userContract == address(0) || _partnerContract == address(0)) 
            revert ZeroAddress();
            
        daiToken = IERC20(_daiToken);
        userContract = _userContract;
        partnerContract = _partnerContract;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MARKETPLACE_ADMIN, msg.sender);
        _grantRole(LOAN_MANAGER, msg.sender);
        _grantRole(RISK_ASSESSOR, msg.sender);
    }
    
    // New loan management functions
    function requestLoan(
        address _borrower,
        uint256 _amount,
        uint256 _collateralAmount,
        uint256 _termLength,
        RepaymentSchedule _schedule
    )
        external
        nonReentrant
        whenNotPaused
        returns (uint256 loanId)
    {
        // Verify caller is user contract
        if (msg.sender != userContract) revert Unauthorized();
        
        // Calculate credit score
        uint256 creditScore = calculateCreditScore(_borrower);
        if (creditScore < MIN_CREDIT_SCORE) revert InsufficientCreditScore();
        
        // Verify savings history
        if (!hasSufficientSavingsHistory(_borrower)) revert InsufficientSavingsHistory();
        
        // Create loan
        loanId = nextLoanId++;
        loans[loanId] = Loan({
            id: loanId,
            borrower: _borrower,
            primaryGuarantor: address(0),
            secondaryGuarantor: address(0),
            principal: _amount,
            collateralAmount: _collateralAmount,
            interestRate: calculateInterestRate(creditScore, _collateralAmount, _amount),
            termLength: _termLength,
            startTime: 0,
            lastPaymentTime: 0,
            schedule: _schedule,
            status: LoanStatus.PENDING,
            creditScore: creditScore
        });
        
        userLoans[_borrower].push(loanId);
        
        emit LoanRequested(loanId, _borrower, _amount, creditScore);
        return loanId;
    }
    
    function addGuarantor(
        uint256 _loanId,
        address _guarantor,
        bool _isPrimary,
        uint256 _stake
    )
        external
        nonReentrant
        whenNotPaused
    {
        Loan storage loan = loans[_loanId];
        if (loan.status != LoanStatus.PENDING) revert InvalidStatus();
        
        // Verify guarantor eligibility
        if (!isEligibleGuarantor(_guarantor, loan.principal)) revert InvalidGuarantor();
        
        // Transfer stake
        bool success = daiToken.transferFrom(_guarantor, address(this), _stake);
        if (!success) revert("Stake transfer failed");
        
        // Update guarantor info
        if (_isPrimary) {
            loan.primaryGuarantor = _guarantor;
        } else {
            loan.secondaryGuarantor = _guarantor;
            // Reduce interest rate for secondary guarantor
            loan.interestRate = loan.interestRate - 200; // Reduce by 2%
        }
        
        // Update guarantor stats
        Guarantor storage guarantor = guarantors[_guarantor];
        guarantor.lockedStake += _stake;
        guarantor.activeGuarantees++;
        
        emit GuarantorAdded(_loanId, _guarantor, _stake);
    }
    
    function approveLoan(uint256 _loanId)
        external
        onlyRole(LOAN_MANAGER)
        nonReentrant
        whenNotPaused
    {
        Loan storage loan = loans[_loanId];
        if (loan.status != LoanStatus.PENDING) revert InvalidStatus();
        if (loan.primaryGuarantor == address(0)) revert InvalidGuarantor();
        
        // Transfer loan amount
        bool success = daiToken.transfer(loan.borrower, loan.principal);
        if (!success) revert("Loan transfer failed");
        
        loan.status = LoanStatus.ACTIVE;
        loan.startTime = block.timestamp;
        loan.lastPaymentTime = block.timestamp;
        
        emit LoanApproved(_loanId, loan.borrower, loan.principal, loan.interestRate);
    }
    
    function makeRepayment(uint256 _loanId)
        external
        nonReentrant
        whenNotPaused
    {
        Loan storage loan = loans[_loanId];
        if (loan.status != LoanStatus.ACTIVE) revert InvalidStatus();
        
        uint256 paymentAmount = calculateRepaymentAmount(loan);
        bool success = daiToken.transferFrom(msg.sender, address(this), paymentAmount);
        if (!success) revert("Repayment transfer failed");
        
        loan.lastPaymentTime = block.timestamp;
        
        // Check if loan is fully repaid
        if (isLoanCompleted(loan)) {
            completeLoan(_loanId);
        }
        
        emit LoanRepayment(_loanId, msg.sender, paymentAmount);
    }
    
    // Internal helper functions
    function calculateCreditScore(address _user) internal view returns (uint256) {
        // Implementation would calculate based on:
        // - Savings streak
        // - Match participation
        // - Deposit consistency
        // - Withdrawal behavior
        // - Goal achievement
        return 75; // Placeholder implementation
    }
    
    function hasSufficientSavingsHistory(address _user) internal view returns (bool) {
        // Implementation would check:
        // - Minimum 6-month streak
        // - At least 3 successful matches
        // - KYC verification
        // - Withdrawal history
        return true; // Placeholder implementation
    }
    
    function calculateInterestRate(
        uint256 _creditScore,
        uint256 _collateral,
        uint256 _principal
    ) 
        internal 
        pure 
        returns (uint256) 
    {
        uint256 baseRate = BASE_INTEREST_RATE;
        uint256 collateralRatio = (_collateral * RATE_DENOMINATOR) / _principal;
        
        // Adjust rate based on collateral
        if (collateralRatio == 0) {
            baseRate += 500; // +5% for no collateral
        } else if (collateralRatio <= 2500) { // 25%
            baseRate += 300; // +3% for partial collateral
        } else if (collateralRatio <= 5000) { // 50%
            baseRate += 100; // +1% for significant collateral
        }
        
        // Adjust for credit score
        if (_creditScore >= 80) {
            baseRate -= 100; // -1% for excellent credit
        } else if (_creditScore < 60) {
            baseRate += 200; // +2% for poor credit
        }
        
        return baseRate;
    }
    
    function calculateRepaymentAmount(Loan memory _loan) 
        internal 
        pure 
        returns (uint256) 
    {
        // Implementation would calculate based on:
        // - Principal
        // - Interest rate
        // - Term length
        // - Repayment schedule
        return 100; // Placeholder implementation
    }
    
    function isLoanCompleted(Loan memory _loan) internal pure returns (bool) {
        // Implementation would check if all payments are made
        return false; // Placeholder implementation
    }
    
    function completeLoan(uint256 _loanId) internal {
        Loan storage loan = loans[_loanId];
        loan.status = LoanStatus.COMPLETED;
        
        // Release guarantor stakes
        releaseGuarantorStake(loan.primaryGuarantor);
        if (loan.secondaryGuarantor != address(0)) {
            releaseGuarantorStake(loan.secondaryGuarantor);
        }
        
        emit LoanCompleted(_loanId);
    }
    
    function releaseGuarantorStake(address _guarantor) internal {
        Guarantor storage guarantor = guarantors[_guarantor];
        uint256 stakeToRelease = guarantor.lockedStake;
        guarantor.lockedStake = 0;
        guarantor.successfulGuarantees++;
        guarantor.activeGuarantees--;
        
        bool success = daiToken.transfer(_guarantor, stakeToRelease);
        if (!success) revert("Stake release failed");
    }
    
    // View functions for loan information
    function getUserLoans(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userLoans[_user];
    }
    
    function getLoanDetails(uint256 _loanId)
        external
        view
        returns (Loan memory)
    {
        return loans[_loanId];
    }
    
    // Existing marketplace functions remain unchanged...
    // (Previous match-related functions would stay the same)
}