// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Minimal interface for SavingsPartner.
interface ISavingsPartner {
    // Interface remains unchanged
}

contract SavingsUser is ReentrancyGuard, Pausable, AccessControl {
    // Roles
    bytes32 public constant USER_MANAGER_ROLE = keccak256("USER_MANAGER_ROLE");
    bytes32 public constant LOAN_OFFICER_ROLE = keccak256("LOAN_OFFICER_ROLE");

    // Constants
    uint256 public constant STREAK_DURATION = 30 days;
    uint256 public constant BASE_INTEREST_RATE = 1000; // e.g. 10%
    uint256 public constant CREDIT_MULTIPLIER = 5;
    uint256 public constant COLLATERAL_DISCOUNT_FACTOR = 500;
    
    // External contracts
    IERC20 public immutable daiToken;
    ISavingsPartner public immutable savingsPartner;

    // Component structs
    struct SavingsData {
        uint256 savingsGoal;
        uint256 minimumBalance;
        uint256 availableBalance;
        uint256 totalSaved;
    }
    
    struct StreakData {
        uint256 lastDepositTime;
        uint32 streakCount;
        uint32 bestStreak;
    }

    struct CreditData {
        uint32 creditScore;
        uint256 guarantorScore;
    }

    struct VerificationData {
        bool isRegistered;
        bool isKYCVerified;
        bool notificationsEnabled;
        bool canBeGuarantor;
    }

    // Combined user profile
    struct UserData {
        SavingsData savings;
        StreakData streak;
        CreditData credit;
        VerificationData verification;
    }

    // Loan structures (unchanged from previous versions)
    struct LoanTerms {
        uint256 amount;
        uint256 collateral;
        uint256 startDate;
        uint256 dueDate;
    }

    struct LoanStatus {
        uint16 interestRate;
        bool isActive;
    }

    struct Loan {
        LoanTerms terms;
        LoanStatus status;
    }

    // Guarantor information is stored in a mapping.
    // (Internal mapping; we won’t expose the nested mapping directly.)
    struct GuarantorInfo {
        //  data
        bool isEligible;
        uint256 maxGuaranteeAmount;
        uint256 guaranteeLimit;
        // data
        uint256 totalAmountGuaranteed;
        uint256 activeGuarantees;
        uint256 successfulGuarantees;
        uint256 defaultedGuarantees;
        // Internal mapping tracking guaranteed loan IDs
        // (Not exposed externally)
        mapping(uint256 => bool) guaranteedLoans;
    }

    struct Transaction {
        uint256 amount;
        uint64 timestamp;
        uint8 txType;
        string notes;
    }

    // Storage mappings
    mapping(address => UserData) private _users;
    mapping(address => Loan[]) private _userLoans;
    mapping(address => GuarantorInfo) private _guarantors;
    mapping(address => address[]) private _userGuarantors;
    mapping(address => Transaction[]) private _userTransactions;

    // Configuration
    uint256 public minimumDeposit = 10;
    uint256 public minimumWithdrawalBalance = 100;

    // --- Events (existing ones) ---
    event UserRegistered(address indexed user);
    event KYCStatusUpdated(address indexed user, bool status);
    event DepositMade(address indexed user, uint256 amount);
    event WithdrawalMade(address indexed user, uint256 amount);
    event LoanRequested(address indexed user, uint256 amount, uint256 loanId);
    event LoanRepaid(address indexed user, uint256 loanId);
    event GuarantorAdded(address indexed user, address indexed guarantor);
    event GuarantorStatusUpdated(address indexed user, bool canBeGuarantor);
    event GuaranteeProvided(address indexed guarantor, address indexed borrower, uint256 loanId);
    event GuarantorScoreUpdated(address indexed guarantor, uint256 newScore);
    event GuaranteeDefaulted(address indexed guarantor, uint256 loanId);
    event GuaranteeCompleted(address indexed guarantor, uint256 loanId);
    event CreditScoreUpdated(address indexed user, uint32 newCreditScore);

    // --- Errors ---
    error Unauthorized();
    error InvalidAmount();
    error InsufficientBalance();
    error InvalidOperation();
    error KYCRequired();
    error LoanError();
    error TransferFailed();

    // --- Constructor ---
    constructor(address _daiToken, address _savingsPartner) {
        require(_daiToken != address(0), "Invalid DAI token");
        require(_savingsPartner != address(0), "Invalid savings partner");
        daiToken = IERC20(_daiToken);
        savingsPartner = ISavingsPartner(_savingsPartner);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // Granting USER_MANAGER_ROLE to the SavingsPartner ensures it can update KYC status if needed
        _grantRole(USER_MANAGER_ROLE, msg.sender);
    }

    // --- Modifier ---
    modifier onlyRegistered() {
        if (!_users[msg.sender].verification.isRegistered) revert Unauthorized();
        _;
    }

    // --- User Registration ---
    function registerUser(uint256 initialGoal) external {
        if (_users[msg.sender].verification.isRegistered) revert Unauthorized();
        if (initialGoal < minimumDeposit) revert InvalidAmount();
        
        _users[msg.sender].verification.isRegistered = true;
        _users[msg.sender].savings.savingsGoal = initialGoal;
        _users[msg.sender].verification.notificationsEnabled = true;
        
        emit UserRegistered(msg.sender);
    }

    // --- Deposit Funds ---
    function deposit(uint256 amount) external onlyRegistered nonReentrant whenNotPaused {
        _validateDeposit(amount);
        uint256 received = _performDepositTransfer(amount);
        _updateUserDeposit(msg.sender, received);
        _updateStreak(msg.sender);
        updateCreditScore(msg.sender, 2);
        _recordTransaction(msg.sender, 0, received, "Deposit");
        emit DepositMade(msg.sender, received);
    }
    
    function _validateDeposit(uint256 amount) internal view {
        if (amount < minimumDeposit) revert InvalidAmount();
    }
    
    function _performDepositTransfer(uint256 amount) internal returns (uint256 received) {
        uint256 balanceBefore = daiToken.balanceOf(address(this));
        if (!daiToken.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        received = daiToken.balanceOf(address(this)) - balanceBefore;
    }
    
    function _updateUserDeposit(address user, uint256 amount) internal {
        UserData storage data = _users[user];
        unchecked {
            data.savings.availableBalance += amount;
            data.savings.totalSaved += amount;
        }
    }

    // --- Withdraw Funds ---
    function withdraw(uint256 amount) external onlyRegistered nonReentrant whenNotPaused {
        _validateWithdrawal(msg.sender, amount);
        _users[msg.sender].savings.availableBalance -= amount;
        if (!daiToken.transfer(msg.sender, amount)) revert TransferFailed();
        _recordTransaction(msg.sender, 1, amount, "Withdrawal");
        updateCreditScore(msg.sender, 3);
        emit WithdrawalMade(msg.sender, amount);
    }
    
    function _validateWithdrawal(address user, uint256 amount) internal view {
        UserData storage data = _users[user];
        if (amount > data.savings.availableBalance) revert InsufficientBalance();
        if (data.savings.availableBalance - amount < data.savings.minimumBalance) revert InsufficientBalance();
    }

    // --- Update User Settings ---
    /**
     * @notice Allows a user to update their personal settings.
     * @param newSavingsGoal The new savings goal.
     * @param newMinimumBalance The new minimum balance required.
     * @param notificationsEnabled Whether notifications should be enabled.
     */
    function updateUserSettings(
        uint256 newSavingsGoal,
        uint256 newMinimumBalance,
        bool notificationsEnabled
    ) external onlyRegistered nonReentrant {
        UserData storage data = _users[msg.sender];
        // Update settings; add any additional validation as needed.
        data.savings.savingsGoal = newSavingsGoal;
        data.savings.minimumBalance = newMinimumBalance;
        data.verification.notificationsEnabled = notificationsEnabled;
        // Emit an event (you could add a new event for settings update if desired)
    }

    // --- Guarantor Functions ---
    function applyForGuarantorStatus() external onlyRegistered nonReentrant {
        UserData storage data = _users[msg.sender];
        if (data.verification.canBeGuarantor) revert InvalidOperation();
        if (data.credit.creditScore < 70) revert LoanError();
        if (data.savings.totalSaved < 1000 ether) revert LoanError();
        if (data.streak.streakCount < 6) revert LoanError();

        data.verification.canBeGuarantor = true;
        GuarantorInfo storage guarantor = _guarantors[msg.sender];
        guarantor.isEligible = true;
        guarantor.guaranteeLimit = 5;
        guarantor.maxGuaranteeAmount = data.savings.totalSaved / 2;

        emit GuarantorStatusUpdated(msg.sender, true);
    }
    
    function canGuaranteeLoan(address guarantor, uint256 amount) public view returns (bool) {
        GuarantorInfo storage info = _guarantors[guarantor];
        UserData storage user = _users[guarantor];
        return (
            info.isEligible &&
            user.verification.canBeGuarantor &&
            info.activeGuarantees < info.guaranteeLimit &&
            info.totalAmountGuaranteed + amount <= info.maxGuaranteeAmount
        );
    }
    
    function recordNewGuarantee(address guarantor, address borrower, uint256 loanId, uint256 amount) external {
        if (!canGuaranteeLoan(guarantor, amount)) revert LoanError();
        GuarantorInfo storage info = _guarantors[guarantor];
        info.totalAmountGuaranteed += amount;
        info.activeGuarantees++;
        info.guaranteedLoans[loanId] = true;
        emit GuaranteeProvided(guarantor, borrower, loanId);
    }
    
    function completeGuarantee(address guarantor, uint256 loanId, bool successful) external {
        GuarantorInfo storage info = _guarantors[guarantor];
        if (!info.guaranteedLoans[loanId]) revert InvalidOperation();
        info.activeGuarantees--;
        info.guaranteedLoans[loanId] = false;
        if (successful) {
            info.successfulGuarantees++;
            _updateGuarantorScore(guarantor, true);
            emit GuaranteeCompleted(guarantor, loanId);
        } else {
            info.defaultedGuarantees++;
            _updateGuarantorScore(guarantor, false);
            emit GuaranteeDefaulted(guarantor, loanId);
        }
    }
    
    function _updateGuarantorScore(address guarantor, bool successful) internal {
        GuarantorInfo storage info = _guarantors[guarantor];
        uint256 total = info.successfulGuarantees + info.defaultedGuarantees;
        if (total == 0) return;
        uint256 newScore;
        if (successful) {
            newScore = (info.successfulGuarantees * 100) / total;
        } else {
            newScore = info.defaultedGuarantees > 0 ? 
                      (info.successfulGuarantees * 80) / total : 
                      100;
        }
        _users[guarantor].credit.guarantorScore = newScore;
        emit GuarantorScoreUpdated(guarantor, newScore);
        if (newScore < 60) {
            _guarantors[guarantor].isEligible = false;
            emit GuarantorStatusUpdated(guarantor, false);
        }
    }
    
    // --- View Function: Simplified Guarantor Info ---
    struct SimpleGuarantorInfo {
        bool isEligible;
        uint256 maxGuaranteeAmount;
        uint256 guaranteeLimit;
        uint256 activeGuarantees;
        uint256 totalAmountGuaranteed;
        uint256 successfulGuarantees;
        uint256 defaultedGuarantees;
        uint256 guarantorScore;
    }
    
    function getSimpleGuarantorInfo(address guarantor) external view returns (SimpleGuarantorInfo memory infoOut) {
        GuarantorInfo storage info = _guarantors[guarantor];
        UserData storage user = _users[guarantor];
        infoOut = SimpleGuarantorInfo({
            isEligible: info.isEligible,
            maxGuaranteeAmount: info.maxGuaranteeAmount,
            guaranteeLimit: info.guaranteeLimit,
            activeGuarantees: info.activeGuarantees,
            totalAmountGuaranteed: info.totalAmountGuaranteed,
            successfulGuarantees: info.successfulGuarantees,
            defaultedGuarantees: info.defaultedGuarantees,
            guarantorScore: user.credit.guarantorScore
        });
    }
    
    // --- Loan Request ---
    function requestLoan(uint256 amount, uint256 collateral) external onlyRegistered nonReentrant whenNotPaused {
        UserData storage user = _users[msg.sender];
        if (!user.verification.isKYCVerified) revert KYCRequired();
        if (user.credit.creditScore < 50 || amount > _calculateMaxLoan(msg.sender)) revert LoanError();
        if (collateral > 0) {
            if (!daiToken.transferFrom(msg.sender, address(this), collateral)) revert TransferFailed();
        }
        uint256 loanId = _userLoans[msg.sender].length;
        _userLoans[msg.sender].push(Loan({
            terms: LoanTerms(amount, collateral, block.timestamp, block.timestamp + 30 days),
            status: LoanStatus(uint16(_calculateInterestRate(msg.sender, collateral)), true)
        }));
        unchecked { user.savings.availableBalance += amount; }
        _recordTransaction(msg.sender, 4, amount, "Loan");
        emit LoanRequested(msg.sender, amount, loanId);
    }
    
    // --- Internal Utility Functions ---
    function _calculateMaxLoan(address user) internal view returns (uint256) {
        return (_users[user].savings.totalSaved * 3) / 10;
    }
    
    function _calculateInterestRate(address user, uint256 collateral) internal view returns (uint256) {
        UserData storage data = _users[user];
        uint256 creditDiscount = (100 - data.credit.creditScore) * CREDIT_MULTIPLIER;
        uint256 collateralDiscount = data.savings.totalSaved > 0 ? (collateral * COLLATERAL_DISCOUNT_FACTOR) / data.savings.totalSaved : 0;
        uint256 rate = BASE_INTEREST_RATE;
        if (rate > creditDiscount + collateralDiscount) {
            rate -= (creditDiscount + collateralDiscount);
        } else {
            rate = 100;
        }
        return rate;
    }
    
    function _updateStreak(address user) internal {
        UserData storage data = _users[user];
        uint256 newStreak = block.timestamp <= data.streak.lastDepositTime + STREAK_DURATION ? data.streak.streakCount + 1 : 1;
        data.streak.streakCount = uint32(newStreak);
        if (newStreak > data.streak.bestStreak) {
            data.streak.bestStreak = uint32(newStreak);
        }
        if (newStreak > 4) {
            updateCreditScore(msg.sender, 5);
        }
        data.streak.lastDepositTime = block.timestamp;
    }
    
    function _recordTransaction(address user, uint8 txType, uint256 amount, string memory notes) internal {
        _userTransactions[user].push(Transaction({
            amount: amount,
            timestamp: uint64(block.timestamp),
            txType: txType,
            notes: notes
        }));
    }
    
    // --- Combined  Report ---
    struct Report {
        bool eligible;
        uint256 maxLoanAmount;
        uint32 creditScore;
        uint32 streakCount;
        uint32 bestStreak;
        uint256 totalSaved;
    }
    
    function getReport(address user) external view returns (Report memory report) {
        UserData storage data = _users[user];
        uint256 maxLoan = (_calculateMaxLoan(user));
        report = Report({
            eligible: (data.streak.streakCount >= 3 &&
                       data.savings.totalSaved > 100 ether &&
                       maxLoan > 0 &&
                       _userLoans[user].length == 0),
            maxLoanAmount: maxLoan,
            creditScore: data.credit.creditScore,
            streakCount: data.streak.streakCount,
            bestStreak: data.streak.bestStreak,
            totalSaved: data.savings.totalSaved
        });
    }
    function getCreditScore(address user) external view returns(uint256 cred) {
        UserData storage data = _users[user];
        cred = data.credit.creditScore;
        return cred;
    }
    function getTotalSavings(address user) external view returns(uint256 save) {
        UserData storage data = _users[user];
        save = data.savings.availableBalance;
        return  save;
    }
    function currentStreak(address user) external view returns(uint256 streak) {
        UserData storage data = _users[user];
        streak = data.streak.streakCount;
        return  streak;
    }
    
    // --- Credit Score Management ---
    function updateCreditScore(address user, uint8 eventType) public onlyRole(LOAN_OFFICER_ROLE) {
    UserData storage data = _users[user];
    uint32 newScore = data.credit.creditScore;

    // Event Type Definitions:
    // 1 = Repayment (+10)
    // 2 = Deposit (+5)
    // 3 = Withdrawal (-10)
    // 4 = Missed Payment (-20)
    // 5 = Consistent Savings Streak (+15)
    
    if (eventType == 1) {
        newScore += 10;  // Successful loan repayment
    } else if (eventType == 2) {
        newScore += 5;   // Deposit made
    } else if (eventType == 3) {
        newScore = newScore > 10 ? newScore - 10 : 0;  // Withdrawal penalty
    } else if (eventType == 4) {
        newScore = newScore > 20 ? newScore - 20 : 0;  // Missed loan repayment penalty
    } else if (eventType == 5) {
        newScore += 5;  // Consistent savings streak reward
    }

    // Ensure credit score stays within 0 - 100 range
    if (newScore > 100) newScore = 100;
    
    data.credit.creditScore = newScore;
    emit CreditScoreUpdated(user, newScore);
}

    
    // --- View Functions ---
    function getUserData(address user) external view returns (UserData memory) {
        return _users[user];
    }
    
    function getLoanDetails(address user, uint256 loanId) external view returns (
        uint256 amount,
        uint256 collateral,
        uint256 startDate,
        uint256 dueDate,
        uint16 interestRate,
        bool isActive
    ) {
        Loan storage loan = _userLoans[user][loanId];
        return (loan.terms.amount, loan.terms.collateral, loan.terms.startDate, loan.terms.dueDate, loan.status.interestRate, loan.status.isActive);
    }
    
    function getUserLoans(address user) external view returns (Loan[] memory) {
        return _userLoans[user];
    }
    
    function activeLoanCount(address user) external view returns (uint256 count) {
        Loan[] storage loans = _userLoans[user];
        uint256 len = loans.length;
        for (uint256 i = 0; i < len; ) {
            if (loans[i].status.isActive) { count++; }
            unchecked { i++; }
        }
    }
    
    function getUserTransactions(address user, uint256 offset, uint256 limit) external view returns (Transaction[] memory result) {
        Transaction[] storage txs = _userTransactions[user];
        uint256 len = txs.length;
        if (offset >= len) return new Transaction[](0);
        uint256 end = offset + limit > len ? len : offset + limit;
        uint256 size = end - offset;
        result = new Transaction[](size);
        for (uint256 i = 0; i < size; ) {
            result[i] = txs[offset + i];
            unchecked { i++; }
        }
    }
    
    function getMonthlyAverage(address user) external view returns (uint256 avgSavings) {
        Transaction[] storage txs = _userTransactions[user];
        uint256 total;
        uint256 count;
        uint256 cutoff = block.timestamp - (30 days * 12);
        uint256 len = txs.length;
        for (uint256 i = len; i > 0; ) {
            Transaction storage t = txs[i - 1];
            if (t.timestamp < cutoff) break;
            if (t.txType == 0) { total += t.amount; count++; }
            unchecked { i--; }
        }
        avgSavings = count > 0 ? total / count : 0;
    }
    
    function getMinimumDeposit() external view returns (uint256) {
        return minimumDeposit;
    }
    
    function getMinimumWithdrawalBalance() external view returns (uint256) {
        return minimumWithdrawalBalance;
    }
    
    function isPaused() external view returns (bool) {
        return paused();
    }
    
    function whoHasRole(bytes32 role, address account) external view returns (bool) {
        return hasRole(role, account);
    }
    
    function getDaiTokenAddress() external view returns (address) {
        return address(daiToken);
    }
    
    function getSavingsPartnerAddress() external view returns (address) {
        return address(savingsPartner);
    }
    
    function isUserKYCVerified(address user) external view returns (bool) {
        return _users[user].verification.isKYCVerified;
    }
    
    // --- Admin Functions ---
    function updateKYCStatus(address user, bool status) external onlyRole(USER_MANAGER_ROLE) {
        _users[user].verification.isKYCVerified = status;
        emit KYCStatusUpdated(user, status);
    }
    
    function setMinimumDeposit(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minimumDeposit = amount;
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
