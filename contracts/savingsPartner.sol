// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// interface ISustainableLoan {
//     // Interface for the SustainableLoan contract (if needed)
// }

contract SavingsPartner is ReentrancyGuard, Pausable, AccessControl {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KYC_VERIFIER_ROLE = keccak256("KYC_VERIFIER_ROLE");
    bytes32 public constant REPAYMENT_RECORDER = keccak256("REPAYMENT_RECORDER");
    bytes32 public constant LOAN_MANAGER_ROLE = keccak256("LOAN_MANAGER_ROLE");
    // bytes32 public sustainableLoan;

    // External dependencies
    IERC20 public immutable daiToken;
    address public sustainableLoan;

    // --- Data Structures ---

    struct PartnerFinancials {
        uint256 availableBalance;
        uint256 lockedBalance;
        uint256 totalCommitted;
        uint256 totalReturns;
        uint256 lastMonthCommitted;
        uint256 riskExposure;
    }

    struct PartnerMetrics {
        uint256 activeBorrowers;
        uint256 successfulRepayments;
        uint256 totalRepayments;
        uint256 investmentLimit;
        uint256 interestRate; // Interest rate (e.g., in basis points)
    }

    struct PartnerStatus {
        bool isRegistered;
        bool isKYCVerified;
        uint256 lastVerificationTime;
    }

    struct Transaction {
        uint256 id;
        address partner;
        uint256 amount;
        uint256 timestamp;
        TransactionType txType;
        TransactionStatus status;
        string destination;
    }

    // Loan proposal for a specific user (initiated by a partner)
    struct LoanProposal {
        uint256 id;
        address partner;
        address user;
        uint256 amount;
        uint256 collateral;
        uint256 interestRate;
        uint256 deadline;
        bool isApproved;
    }
    
    // Loan pool structure — partners can create a pool with defined terms
    struct LoanPool {
        uint256 poolId;
        address partner;
        uint256 totalFunds;
        uint256 availableFunds;
        uint256 maxLoanAmount;
        uint256 interestRate;    // Interest rate for loans from this pool
        uint256 repaymentPeriod; // Duration in seconds
        bool isActive;
    }

    // --- Enums ---
    enum TransactionType { DEPOSIT, WITHDRAWAL, LOAN_DISBURSEMENT }
    enum TransactionStatus { PENDING, PROCESSING, COMPLETED, FAILED }

    // --- Mappings ---
    mapping(address => PartnerFinancials) public partnerFinancials;
    mapping(address => PartnerMetrics) public partnerMetrics;
    mapping(address => PartnerStatus) public partnerStatus;
    mapping(address => Transaction[]) private _partnerTransactions;
    mapping(uint256 => LoanProposal) public loanProposals;
    mapping(address => uint256[]) private _partnerLoanIds;
    mapping(uint256 => LoanPool) public loanPools;
    mapping(address => uint256[]) private _partnerPoolIds;
    mapping(address => bool) public blacklistedPartners;

    // --- State Variables ---
    uint256 public minimumInvestmentLimit = 10 ;
    uint256 public maximumInvestmentLimit = 1000000 ;
    uint256 public kycThreshold = 5000 ether;
    uint256 public totalLockedFunds;  // For bookkeeping (if needed)

    uint256 private _nextTransactionId = 1;
    uint256 private _nextLoanId = 1;
    uint256 private _nextPoolId = 1;

    // --- Events ---
    event PartnerRegistered(address indexed partner);
    event KYCVerified(address indexed partner);
    event KYCReverted(address indexed partner);
    event TransactionCreated(uint256 indexed id, address indexed partner, TransactionType txType, TransactionStatus status);
    event RepaymentRecorded(address indexed partner, uint256 amount, bool successful);
    event MonthlyStatsUpdated(address indexed partner);
    event LoanProposalCreated(uint256 indexed proposalId, address indexed partner, address indexed user);
    event LoanApproved(address indexed partner, address indexed user, uint256 amount);
    event LoanRepaid(uint256 indexed proposalId, uint256 amount);
    event LoanPoolCreated(uint256 indexed poolId, address indexed partner, uint256 totalFunds, uint256 interestRate, uint256 repaymentPeriod);
    event LoanPoolUpdated(uint256 indexed poolId, uint256 availableFunds);
    event SettingsUpdated(address indexed partner);

    // --- Errors ---
    error InvalidAmount();
    error InsufficientBalance();
    error Unauthorized();
    error InvalidKYCStatus();
    error ExceededInvestmentLimit();
    error Blacklisted();
    error InvalidLoanProposal();
    error LoanAlreadyProcessed();
    error TransferFailed();

    // --- Constructor ---
    constructor(address _daiToken) {
        require(_daiToken != address(0), "Invalid DAI token address");
        // require(_sustainableLoan != address(0), "Invalid sustainableLoan address");

        daiToken = IERC20(_daiToken);
        // sustainableLoan = ISustainableLoan(_sustainableLoan);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(LOAN_MANAGER_ROLE, msg.sender);
    }

    // --- Modifiers ---
    modifier onlyPartner() {
        if (!partnerStatus[msg.sender].isRegistered) revert Unauthorized();
        _;
    }

    // --- Partner Registration & KYC ---
    function registerPartner(uint256 _initialInvestmentLimit, uint256 _interestRate) external {
        if (partnerStatus[msg.sender].isRegistered) revert Unauthorized();
        if (_initialInvestmentLimit < minimumInvestmentLimit || _initialInvestmentLimit > maximumInvestmentLimit) revert InvalidAmount();

        partnerStatus[msg.sender] = PartnerStatus({
            isRegistered: true,
            isKYCVerified: false,
            lastVerificationTime: 0
        });

        partnerFinancials[msg.sender] = PartnerFinancials({
            availableBalance: 0,
            lockedBalance: 0,
            totalCommitted: 0,
            totalReturns: 0,
            lastMonthCommitted: 0,
            riskExposure: 0
        });

        partnerMetrics[msg.sender] = PartnerMetrics({
            activeBorrowers: 0,
            successfulRepayments: 0,
            totalRepayments: 0,
            investmentLimit: _initialInvestmentLimit,
            interestRate: _interestRate
        });

        emit PartnerRegistered(msg.sender);
    }

    function verifyKYC(address _partner) external onlyRole(KYC_VERIFIER_ROLE) {
        PartnerStatus storage status = partnerStatus[_partner];
        if (!status.isRegistered) revert Unauthorized();
        if (status.isKYCVerified) revert InvalidKYCStatus();

        status.isKYCVerified = true;
        status.lastVerificationTime = block.timestamp;
        emit KYCVerified(_partner);
    }

    function revokeKYC(address _partner) external onlyRole(KYC_VERIFIER_ROLE) {
        PartnerStatus storage status = partnerStatus[_partner];
        if (!status.isRegistered || !status.isKYCVerified) revert InvalidKYCStatus();

        status.isKYCVerified = false;
        emit KYCReverted(_partner);
    }

    // --- Funds Management: Deposit & Withdraw ---
    function deposit(uint256 _amount) external onlyPartner nonReentrant whenNotPaused {
        PartnerFinancials storage finances = partnerFinancials[msg.sender];
        PartnerMetrics storage metrics = partnerMetrics[msg.sender];

        if (blacklistedPartners[msg.sender]) revert Blacklisted();
        if (_amount == 0 || finances.totalCommitted + _amount > metrics.investmentLimit) revert InvalidAmount();

        uint256 txId = _nextTransactionId++;
        _partnerTransactions[msg.sender].push(Transaction({
            id: txId,
            partner: msg.sender,
            amount: _amount,
            timestamp: block.timestamp,
            txType: TransactionType.DEPOSIT,
            status: TransactionStatus.PENDING,
            destination: "Platform"
        }));

        uint256 balanceBefore = daiToken.balanceOf(address(this));
        
        if (!daiToken.transferFrom(msg.sender, address(this), _amount)) revert TransferFailed();
        uint256 received = daiToken.balanceOf(address(this)) - balanceBefore;

        finances.availableBalance += received;
        finances.totalCommitted += received;

        _partnerTransactions[msg.sender][_partnerTransactions[msg.sender].length - 1].status = TransactionStatus.COMPLETED;
        emit TransactionCreated(txId, msg.sender, TransactionType.DEPOSIT, TransactionStatus.COMPLETED);
    }

    function withdraw(uint256 _amount) external onlyPartner nonReentrant whenNotPaused {
        PartnerFinancials storage finances = partnerFinancials[msg.sender];
        if (_amount == 0 || _amount > finances.availableBalance) revert InsufficientBalance();

        uint256 txId = _nextTransactionId++;
        _partnerTransactions[msg.sender].push(Transaction({
            id: txId,
            partner: msg.sender,
            amount: _amount,
            timestamp: block.timestamp,
            txType: TransactionType.WITHDRAWAL,
            status: TransactionStatus.PROCESSING,
            destination: "Partner"
        }));

        finances.availableBalance -= _amount;
        if (!daiToken.transfer(msg.sender, _amount)) {
            finances.availableBalance += _amount;
            revert TransferFailed();
        }
        _partnerTransactions[msg.sender][_partnerTransactions[msg.sender].length - 1].status = TransactionStatus.COMPLETED;
        emit TransactionCreated(txId, msg.sender, TransactionType.WITHDRAWAL, TransactionStatus.COMPLETED);
    }

    // --- Loan Pool Functionality ---

    // Partners create a loan pool with specific conditions
    function createLoanPool(
        uint256 totalFunds,
        uint256 maxLoanAmount,
        uint256 interestRate,
        uint256 repaymentPeriod
    ) external onlyPartner nonReentrant whenNotPaused returns (uint256 poolId) {
        if (totalFunds == 0 || maxLoanAmount == 0 || interestRate == 0 || repaymentPeriod == 0) revert InvalidAmount();
        uint256 balanceBefore = daiToken.balanceOf(address(this));
        if (!daiToken.transferFrom(msg.sender, address(this), totalFunds)) revert TransferFailed();
        uint256 received = daiToken.balanceOf(address(this)) - balanceBefore;

        poolId = _nextPoolId++;
        loanPools[poolId] = LoanPool({
            poolId: poolId,
            partner: msg.sender,
            totalFunds: received,
            availableFunds: received,
            maxLoanAmount: maxLoanAmount,
            interestRate: interestRate,
            repaymentPeriod: repaymentPeriod,
            isActive: true
        });
        _partnerPoolIds[msg.sender].push(poolId);
        emit LoanPoolCreated(poolId, msg.sender, received, interestRate, repaymentPeriod);
    }

    // Called by the SustainableLoan contract to update a pool after a loan is approved
    function updateLoanPoolFunds(uint256 poolId, uint256 deductedAmount) external {
        require(msg.sender == address(sustainableLoan), "Unauthorized");
        LoanPool storage pool = loanPools[poolId];
        if (deductedAmount > pool.availableFunds) revert InsufficientBalance();
        pool.availableFunds -= deductedAmount;
        emit LoanPoolUpdated(poolId, pool.availableFunds);
    }

    // --- Loan Proposals ---

    // Partners create a loan proposal for a specific user, using a designated loan pool
    function createLoanProposal(
        address _user,
        uint256 _amount,
        uint256 _collateral,
        uint256 _deadline,
        uint256 _poolId
    ) external onlyPartner whenNotPaused {
        PartnerStatus storage status = partnerStatus[msg.sender];
        PartnerFinancials storage finances = partnerFinancials[msg.sender];
        if (!status.isKYCVerified) revert InvalidKYCStatus();
        if (_amount > finances.availableBalance) revert InsufficientBalance();

        // Ensure the chosen loan pool is active and the amount is within limits
        LoanPool storage pool = loanPools[_poolId];
        require(pool.isActive, "Loan pool inactive");
        if (_amount > pool.maxLoanAmount || _amount > pool.availableFunds) revert InvalidAmount();

        uint256 proposalId = _nextLoanId++;
        loanProposals[proposalId] = LoanProposal({
            id: proposalId,
            partner: msg.sender,
            user: _user,
            amount: _amount,
            collateral: _collateral,
            interestRate: partnerMetrics[msg.sender].interestRate,
            deadline: _deadline,
            isApproved: false
        });
        _partnerLoanIds[msg.sender].push(proposalId);
        emit LoanProposalCreated(proposalId, msg.sender, _user);
    }

    // Approve a loan proposal. Only callable by LOAN_MANAGER_ROLE.
    function approveLoan(uint256 _proposalId) external onlyRole(LOAN_MANAGER_ROLE) nonReentrant {
        LoanProposal storage proposal = loanProposals[_proposalId];
        if (proposal.isApproved) revert LoanAlreadyProcessed();

        PartnerFinancials storage financials = partnerFinancials[proposal.partner];
        if (proposal.amount > financials.availableBalance) revert InsufficientBalance();

        // Deduct funds from the partner's available balance and update risk exposure.
        financials.availableBalance -= proposal.amount;
        financials.riskExposure += proposal.amount;
        partnerMetrics[proposal.partner].activeBorrowers++;

        // Mark proposal as approved.
        proposal.isApproved = true;
        emit LoanApproved(proposal.partner, proposal.user, proposal.amount);
    }

    // --- Settings, Repayments, and Administration ---

    function updateSettings(uint256 _newLimit, uint256 _newRate) external onlyPartner {
        PartnerStatus storage status = partnerStatus[msg.sender];
        PartnerFinancials storage finances = partnerFinancials[msg.sender];
        PartnerMetrics storage metrics = partnerMetrics[msg.sender];

        if (_newLimit < minimumInvestmentLimit || _newLimit > maximumInvestmentLimit) revert InvalidAmount();
        if (_newLimit < finances.totalCommitted) revert InvalidAmount();
        if (_newLimit > kycThreshold && !status.isKYCVerified) revert InvalidKYCStatus();

        metrics.investmentLimit = _newLimit;
        metrics.interestRate = _newRate;
        emit SettingsUpdated(msg.sender);
    }

    function recordRepayment(address _partner, uint256 _amount, bool _success) external onlyRole(REPAYMENT_RECORDER) {
        PartnerFinancials storage finances = partnerFinancials[_partner];
        PartnerMetrics storage metrics = partnerMetrics[_partner];

        metrics.totalRepayments++;
        if (_success) {
            metrics.successfulRepayments++;
            finances.availableBalance += _amount;
        }
        emit RepaymentRecorded(_partner, _amount, _success);
    }

    function updateMonthlyStats(address _partner) external onlyRole(ADMIN_ROLE) {
        PartnerFinancials storage finances = partnerFinancials[_partner];
        finances.lastMonthCommitted = finances.totalCommitted;
        emit MonthlyStatsUpdated(_partner);
    }

    // --- Administration ---

    function setInvestmentLimits(uint256 _min, uint256 _max) external onlyRole(ADMIN_ROLE) {
        minimumInvestmentLimit = _min;
        maximumInvestmentLimit = _max;
    }

    function setKYCThreshold(uint256 _threshold) external onlyRole(ADMIN_ROLE) {
        kycThreshold = _threshold;
    }

    function blacklistPartner(address _partner, bool _status) external onlyRole(ADMIN_ROLE) {
        blacklistedPartners[_partner] = _status;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // --- View Functions ---

    function getPartnerAvailableBalance(address _partner) external view returns (uint256) {
        return partnerFinancials[_partner].availableBalance;
    }

    function getPartnerFinancials(address _partner) external view returns (
        uint256 availableBalance,
        uint256 lockedBalance,
        uint256 totalCommitted,
        uint256 totalReturns,
        uint256 lastMonthCommitted,
        uint256 riskExposure
    ) {
        PartnerFinancials storage finances = partnerFinancials[_partner];
        return (
            finances.availableBalance,
            finances.lockedBalance,
            finances.totalCommitted,
            finances.totalReturns,
            finances.lastMonthCommitted,
            finances.riskExposure
        );
    }

    function getPartnerMetrics(address _partner) external view returns (
        uint256 activeBorrowers,
        uint256 successfulRepayments,
        uint256 totalRepayments,
        uint256 investmentLimit,
        uint256 interestRate
    ) {
        PartnerMetrics storage metrics = partnerMetrics[_partner];
        return (
            metrics.activeBorrowers,
            metrics.successfulRepayments,
            metrics.totalRepayments,
            metrics.investmentLimit,
            metrics.interestRate
        );
    }

    function getPartnerStatus(address _partner) external view returns (
        bool isRegistered,
        bool isKYCVerified,
        uint256 lastVerificationTime
    ) {
        PartnerStatus storage status = partnerStatus[_partner];
        return (
            status.isRegistered,
            status.isKYCVerified,
            status.lastVerificationTime
        );
    }
    function _updateSustainableLoan(address _sustainableLoan)  external onlyRole(ADMIN_ROLE){
        sustainableLoan = _sustainableLoan;
    }

    function getLoanProposalDetails(uint256 _proposalId) external view returns (
        uint256 id,
        address partner,
        address user,
        uint256 amount,
        uint256 collateral,
        uint256 interestRate,
        uint256 deadline,
        bool isApproved
    ) {
        LoanProposal storage proposal = loanProposals[_proposalId];
        return (
            proposal.id,
            proposal.partner,
            proposal.user,
            proposal.amount,
            proposal.collateral,
            proposal.interestRate,
            proposal.deadline,
            proposal.isApproved
        );
    }

    function getTotalLockedFunds() external view returns (uint256) {
        return totalLockedFunds;
    }

    function getInvestmentLimits() external view returns (uint256 min, uint256 max) {
        return (minimumInvestmentLimit, maximumInvestmentLimit);
    }

    function getKYCThreshold() external view returns (uint256) {
        return kycThreshold;
    }

    function isPartnerBlacklisted(address _partner) external view returns (bool) {
        return blacklistedPartners[_partner];
    }

    function getPartnerTransactions(address _partner) external view returns (Transaction[] memory) {
        return _partnerTransactions[_partner];
    }

    function getPartnerLoans(address _partner) external view returns (uint256[] memory) {
        return _partnerLoanIds[_partner];
    }

    function getNextTransactionId() external view returns (uint256) {
        return _nextTransactionId;
    }

    function getNextLoanId() external view returns (uint256) {
        return _nextLoanId;
    }

    function getNextPoolId() external view returns (uint256) {
        return _nextPoolId;
    }

    function getDaiTokenAddress() external view returns (address) {
        return address(daiToken);
    }
}
