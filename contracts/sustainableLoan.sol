// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./SavingsUser.sol";
import "./SavingsPartner.sol";
import "./GuarantorManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SustainableLoan is ReentrancyGuard, AccessControl, Pausable {
    bytes32 public constant LOAN_MANAGER = keccak256("LOAN_MANAGER");
    bytes32 public constant LIQUIDATOR = keccak256("LIQUIDATOR");

    SavingsUser public immutable savingsUser;
    SavingsPartner public immutable savingsPartner;
    GuarantorManager public immutable guarantorManager;
    IERC20 public immutable daiToken;

    // Flattened Loan structure for simplicity and to reduce stack usage.
    struct Loan {
        address borrower;
        uint256 amount;
        uint256 collateral;
        uint256 interestRate;
        uint256 dueDate;
        uint256 lastBorrowTime;
        address guarantor;
        LoanStatus status;
    }

    enum LoanStatus { PENDING, ACTIVE, REPAID, DEFAULTED }

    // Mapping from borrower to an array of their loans.
    mapping(address => Loan[]) public userLoans;
    // To enforce a cooldown period per user.
    mapping(address => uint256) public lastBorrowTime;
    
    // Configuration parameters.
    uint256 public baseInterestRate = 500; // 5% base in basis points.
    uint256 public maxLoanMultiplier = 3; 
    uint256 public cooldownPeriod = 30 days;
    uint256 public collateralDiscountFactor = 200; // 2% reduction per 1% collateral.
    uint256 public streakBonus = 50; // 0.5% reduction per streak month.

    // --- Events ---
    event LoanRequested(address indexed user, uint256 amount);
    event LoanApproved(address indexed user, uint256 loanId, address partner);
    event RepaymentMade(address indexed user, uint256 amount);
    event CollateralLiquidated(address indexed user, uint256 loanId, uint256 amount);

    // --- Constructor ---
    constructor(
        address _savingsUser, 
        address _savingsPartner, 
        address _daiToken, 
        address _guarantorManager
    ) {
        require(_savingsUser != address(0), "Invalid SavingsUser address");
        require(_savingsPartner != address(0), "Invalid SavingsPartner address");
        require(_daiToken != address(0), "Invalid DAI token address");
        require(_guarantorManager != address(0), "Invalid GuarantorManager address");

        savingsUser = SavingsUser(_savingsUser);
        savingsPartner = SavingsPartner(_savingsPartner);
        daiToken = IERC20(_daiToken);
        guarantorManager = GuarantorManager(_guarantorManager);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- Helper Function: Check Partner Funds ---
    function _hasSufficientPartnerFunds(address fundingPartner, uint256 loanAmount) internal view returns (bool) {
        // Retrieve only the available balance to minimize local variables.
        (uint256 availableBalance, , , , , ) = savingsPartner.partnerFinancials(fundingPartner);
        return availableBalance >= loanAmount;
    }

    // --- Loan Request Flow ---
    /**
     * @notice Allows a user to request a loan.
     * @param amount The principal amount requested.
     * @param collateral The collateral amount provided (if any).
     * @param guarantor The designated guarantor address.
     */
    function requestLoan(
        uint256 amount,
        uint256 collateral,
        address guarantor
    ) external nonReentrant whenNotPaused {
        // Checks
        require(savingsUser.isUserKYCVerified(msg.sender), "KYC verification required");
        require(meetsEligibility(msg.sender, amount), "Not eligible");
        require(block.timestamp > lastBorrowTime[msg.sender] + cooldownPeriod, "Cooldown active");

        if (collateral > 0) {
            require(daiToken.transferFrom(msg.sender, address(this), collateral), "Collateral transfer failed");
        }

        // Effects: Record the new loan request.
        userLoans[msg.sender].push(Loan({
            borrower: msg.sender,
            amount: amount,
            collateral: collateral,
            interestRate: calculateDynamicRate(msg.sender, collateral),
            dueDate: 0, // will be set upon approval
            lastBorrowTime: block.timestamp,
            guarantor: guarantor,
            status: LoanStatus.PENDING
        }));
        lastBorrowTime[msg.sender] = block.timestamp;
        emit LoanRequested(msg.sender, amount);
    }

    // --- Loan Approval Process ---
    /**
     * @notice Approves a pending loan request.
     * @param user The borrower address.
     * @param loanId The index of the loan in the borrower's loan array.
     * @param fundingPartner The partner address providing funds.
     * @param poolId The loan pool ID to use in SavingsPartner.
     */
    function approveLoan(
        address user,
        uint256 loanId,
        address fundingPartner,
        uint256 poolId
    ) external onlyRole(LOAN_MANAGER) nonReentrant {
        Loan storage loan = userLoans[user][loanId];
        // Checks
        require(loan.status == LoanStatus.PENDING, "Loan not pending");
        require(guarantorManager.isApproved(loanId, loan.guarantor), "Guarantor has not approved");
        require(_hasSufficientPartnerFunds(fundingPartner, loan.amount), "Insufficient partner funds");

        // Effects: Update loan state before any external calls.
        loan.dueDate = block.timestamp + 30 days;
        loan.status = LoanStatus.ACTIVE;

        // Interactions:
        // 1. Create a loan proposal in SavingsPartner.
        savingsPartner.createLoanProposal(user, loan.amount, loan.collateral, block.timestamp + 1 days, poolId);
        // 2. Transfer loan funds to the borrower.
        require(daiToken.transfer(user, loan.amount), "Loan transfer failed");

        emit LoanApproved(user, loanId, fundingPartner);
    }

    // --- Loan Repayment Process ---
    /**
     * @notice Allows a borrower to repay an active loan.
     * Follows the Checks–Effects–Interactions pattern.
     * @param loanId The index of the loan in the borrower's loan array.
     */
    function repayLoan(uint256 loanId) external nonReentrant whenNotPaused {
        // Checks
        Loan storage loan = userLoans[msg.sender][loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(block.timestamp <= loan.dueDate, "Loan expired");
        uint256 totalOwed = loan.amount + ((loan.amount * loan.interestRate) / 10000);

        // Effects: Update loan state.
        loan.status = LoanStatus.REPAID;

        // Interactions: Perform external calls.
        require(daiToken.transferFrom(msg.sender, address(this), totalOwed), "Repayment transfer failed");
        if (loan.collateral > 0) {
            require(daiToken.transfer(msg.sender, loan.collateral), "Collateral return failed");
        }
        savingsUser.updateCreditScore(msg.sender, 1);
        emit RepaymentMade(msg.sender, totalOwed);
    }

    // --- Collateral Liquidation & Guarantee Claim ---
    /**
     * @notice Liquidates collateral for a defaulted loan and claims the guarantee stake.
     * @param user The borrower address.
     * @param loanId The index of the loan to liquidate.
     */
    function liquidateCollateral(address user, uint256 loanId) external onlyRole(LIQUIDATOR) nonReentrant whenNotPaused {
        Loan storage loan = userLoans[user][loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        require(block.timestamp > loan.dueDate, "Loan not expired");
        require(loan.guarantor != address(0), "No guarantor specified");

        uint256 collateralAmount = loan.collateral;
        loan.collateral = 0;
        loan.status = LoanStatus.DEFAULTED;
        
        uint256 claimAmount = collateralAmount / 2;
        // Interaction: Claim guarantee stake from GuarantorManager.
        guarantorManager.claimGuarantee(loanId, loan.guarantor, loan.guarantor, claimAmount);
        // Interaction: Handle any remaining collateral (e.g., transfer to an insurance pool or keep in contract).
        require(daiToken.transfer(address(this), collateralAmount - claimAmount), "Collateral transfer failed");
        
        emit CollateralLiquidated(user, loanId, collateralAmount);
    }

    // --- Dynamic Interest Rate Calculation ---
    /**
     * @notice Dynamically calculates the interest rate based on credit score, collateral, and savings streak.
     * @param user The borrower address.
     * @param collateral The collateral amount provided.
     * @return The calculated interest rate in basis points.
     */
    function calculateDynamicRate(address user, uint256 collateral) public view returns (uint256) {
        uint256 rate = baseInterestRate;
        uint256 creditScore = savingsUser.getCreditScore(user);
        rate -= creditScore * 2;
        uint256 savings = savingsUser.getTotalSavings(user);
        if (savings > 0) {
            uint256 collateralRatio = (collateral * 10000) / savings;
            rate -= (collateralRatio * collateralDiscountFactor) / 10000;
        }
        uint256 streak = savingsUser.currentStreak(user);
        rate -= streak * streakBonus;
        return rate < 100 ? 100 : rate;
    }

    // --- Eligibility Check ---
    /**
     * @notice Checks if a user meets the eligibility criteria for a new loan.
     * @param user The borrower address.
     * @param amount The requested loan amount.
     * @return True if eligible, false otherwise.
     */
    function meetsEligibility(address user, uint256 amount) public view returns (bool) {
        uint256 maxLoan = savingsUser.getMonthlyAverage(user) * maxLoanMultiplier;
        return (savingsUser.currentStreak(user) >= 3 &&
                savingsUser.getTotalSavings(user) > 100 ether &&
                amount <= maxLoan &&
                savingsUser.activeLoanCount(user) == 0);
    }

    // --- Administrative Functions ---
    /**
     * @notice Allows the admin to pause loan operations.
     */
    function emergencyRepaymentPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Extends the term of an active loan.
     * @param user The borrower address.
     * @param loanId The index of the loan.
     * @param extraDays The number of additional days.
     */
    function extendLoanTerm(address user, uint256 loanId, uint256 extraDays) external onlyRole(LOAN_MANAGER) nonReentrant {
        Loan storage loan = userLoans[user][loanId];
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");
        loan.dueDate += extraDays * 1 days;
    }
}
