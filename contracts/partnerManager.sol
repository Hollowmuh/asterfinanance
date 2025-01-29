// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SavingsPartner
 * @dev Contract for managing partner operations in the savings platform
 */
contract SavingsPartner is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KYC_VERIFIER_ROLE = keccak256("KYC_VERIFIER_ROLE");
    bytes32 public constant REPAYMENT_RECORDER = keccak256("REPAYMENT_RECORDER");

    IERC20 public immutable daiToken;
    
    struct Partner {
        bool isRegistered;
        bool isKYCVerified;
        uint256 investmentLimit;
        uint256 matchRate;
        uint256 availableBalance;
        uint256 lockedBalance;
        uint256 lastVerificationTime;
        uint256 totalCommitted;
        uint256 totalReturns;
        uint256 lastMonthCommitted;
        uint256 activeBorrowers;
        uint256 successfulRepayments;
        uint256 totalRepayments;
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

    struct MatchProposal {
        uint256 id;
        address partner;
        address saver;
        uint256 amount;
        uint256 matchRate;
        uint256 deadline;
        ProposalStatus status;
    }

    enum TransactionType { DEPOSIT, WITHDRAWAL }
    enum TransactionStatus { PENDING, PROCESSING, COMPLETED, FAILED }
    enum ProposalStatus { PENDING, ACCEPTED, REJECTED, EXPIRED }

    mapping(address => Partner) public partners;
    mapping(address => Transaction[]) private _partnerTransactions;
    mapping(uint256 => MatchProposal) public proposals;
    mapping(address => bool) public blacklistedPartners;
    mapping(address => uint256[]) private _partnerProposalIds;
    
    uint256 public minimumInvestmentLimit = 100 ether; // 100 DAI (18 decimals)
    uint256 public maximumInvestmentLimit = 1000000 ether; // 1M DAI
    uint256 public constant MAX_MATCH_RATE = 10000; // 100%
    uint256 public totalLockedFunds;
    uint256 private _nextTransactionId = 1;
    uint256 private _nextProposalId = 1;
    uint256 public kycThreshold = 5000 ether;

    event PartnerRegistered(address indexed partner);
    event KYCVerified(address indexed partner);
    event KYCReverted(address indexed partner);
    event TransactionCreated(
        uint256 indexed id,
        address indexed partner,
        TransactionType txType,
        TransactionStatus status
    );
    event RepaymentRecorded(address indexed partner, uint256 amount, bool successful);
    event MonthlyStatsUpdated(address indexed partner);
    event MatchProposalCreated(uint256 indexed proposalId, address indexed partner);
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExpired(uint256 indexed proposalId);
    event SettingsUpdated(address indexed partner);

    error InvalidAmount();
    error InsufficientBalance();
    error InvalidMatchRate();
    error Unauthorized();
    error InvalidKYCStatus();
    error ExceededInvestmentLimit();
    error Blacklisted();
    error InvalidProposalState();
    error ProposalDeadlinePassed();

    constructor(address _daiToken) {
        daiToken = IERC20(_daiToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyPartner() {
        if (!partners[msg.sender].isRegistered) revert Unauthorized();
        _;
    }

    function registerPartner(uint256 _initialInvestmentLimit, uint256 _matchRate) external {
        if (partners[msg.sender].isRegistered) revert Unauthorized();
        if (_matchRate > MAX_MATCH_RATE) revert InvalidMatchRate();
        if (_initialInvestmentLimit < minimumInvestmentLimit || _initialInvestmentLimit > maximumInvestmentLimit) {
            revert InvalidAmount();
        }

        partners[msg.sender] = Partner({
            isRegistered: true,
            isKYCVerified: false,
            investmentLimit: _initialInvestmentLimit,
            matchRate: _matchRate,
            availableBalance: 0,
            lockedBalance: 0,
            lastVerificationTime: 0,
            totalCommitted: 0,
            totalReturns: 0,
            lastMonthCommitted: 0,
            activeBorrowers: 0,
            successfulRepayments: 0,
            totalRepayments: 0
        });

        emit PartnerRegistered(msg.sender);
    }

    function verifyKYC(address _partner) external onlyRole(KYC_VERIFIER_ROLE) {
        Partner storage p = partners[_partner];
        if (!p.isRegistered) revert Unauthorized();
        if (p.isKYCVerified) revert InvalidKYCStatus();
        
        p.isKYCVerified = true;
        p.lastVerificationTime = block.timestamp;
        emit KYCVerified(_partner);
    }

    function revokeKYC(address _partner) external onlyRole(KYC_VERIFIER_ROLE) {
        Partner storage p = partners[_partner];
        if (!p.isRegistered || !p.isKYCVerified) revert InvalidKYCStatus();
        
        p.isKYCVerified = false;
        emit KYCReverted(_partner);
    }

    function deposit(uint256 _amount) external onlyPartner nonReentrant whenNotPaused {
        Partner storage p = partners[msg.sender];
        if (blacklistedPartners[msg.sender]) revert Blacklisted();
        if (_amount == 0 || p.totalCommitted + _amount > p.investmentLimit) revert InvalidAmount();

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
        if (!daiToken.transferFrom(msg.sender, address(this), _amount)) revert("Transfer failed");
        uint256 received = daiToken.balanceOf(address(this)) - balanceBefore;
        
        p.availableBalance += received;
        p.totalCommitted += received;
        
        _partnerTransactions[msg.sender][_partnerTransactions[msg.sender].length - 1].status = TransactionStatus.COMPLETED;
        emit TransactionCreated(txId, msg.sender, TransactionType.DEPOSIT, TransactionStatus.COMPLETED);
    }

    function withdraw(uint256 _amount) external onlyPartner nonReentrant whenNotPaused {
        Partner storage p = partners[msg.sender];
        if (_amount == 0 || _amount > p.availableBalance) revert InsufficientBalance();

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

        p.availableBalance -= _amount;
        
        if (!daiToken.transfer(msg.sender, _amount)) {
            p.availableBalance += _amount; // Revert balance change on failure
            revert("Transfer failed");
        }
        
        _partnerTransactions[msg.sender][_partnerTransactions[msg.sender].length - 1].status = TransactionStatus.COMPLETED;
        emit TransactionCreated(txId, msg.sender, TransactionType.WITHDRAWAL, TransactionStatus.COMPLETED);
    }

    function createMatchProposal(
        address _saver,
        uint256 _amount,
        uint256 _matchRate,
        uint256 _deadline
    ) external onlyPartner whenNotPaused {
        Partner storage p = partners[msg.sender];
        if (!p.isKYCVerified) revert InvalidKYCStatus();
        if (_amount > p.availableBalance) revert InsufficientBalance();
        if (_matchRate > p.matchRate || _deadline <= block.timestamp) revert InvalidAmount();

        uint256 proposalId = _nextProposalId++;
        proposals[proposalId] = MatchProposal({
            id: proposalId,
            partner: msg.sender,
            saver: _saver,
            amount: _amount,
            matchRate: _matchRate,
            deadline: _deadline,
            status: ProposalStatus.PENDING
        });

        _partnerProposalIds[msg.sender].push(proposalId);
        p.availableBalance -= _amount;
        p.lockedBalance += _amount;
        totalLockedFunds += _amount;

        emit MatchProposalCreated(proposalId, msg.sender);
    }

    function cancelProposal(uint256 _proposalId) external onlyPartner {
        MatchProposal storage proposal = proposals[_proposalId];
        if (proposal.partner != msg.sender) revert Unauthorized();
        if (proposal.status != ProposalStatus.PENDING) revert InvalidProposalState();

        proposal.status = ProposalStatus.REJECTED;
        Partner storage p = partners[msg.sender];
        p.availableBalance += proposal.amount;
        p.lockedBalance -= proposal.amount;
        totalLockedFunds -= proposal.amount;

        emit ProposalCanceled(_proposalId);
    }

    function updateSettings(uint256 _newLimit, uint256 _newRate) external onlyPartner {
        Partner storage p = partners[msg.sender];
        if (_newLimit < minimumInvestmentLimit || _newLimit > maximumInvestmentLimit) revert InvalidAmount();
        if (_newLimit < p.totalCommitted) revert InvalidAmount();
        if (_newRate > MAX_MATCH_RATE) revert InvalidMatchRate();
        if (_newLimit > kycThreshold && !p.isKYCVerified) revert InvalidKYCStatus();

        p.investmentLimit = _newLimit;
        p.matchRate = _newRate;
        emit SettingsUpdated(msg.sender);
    }

    function recordRepayment(address _partner, uint256 _amount, bool _success) external onlyRole(REPAYMENT_RECORDER) {
        Partner storage p = partners[_partner];
        p.totalRepayments++;
        if (_success) {
            p.successfulRepayments++;
            p.availableBalance += _amount;
        }
        emit RepaymentRecorded(_partner, _amount, _success);
    }

    function updateMonthlyStats(address _partner) external onlyRole(ADMIN_ROLE) {
        Partner storage p = partners[_partner];
        p.lastMonthCommitted = p.totalCommitted;
        emit MonthlyStatsUpdated(_partner);
    }

    // Additional view functions
    function getPartnerTransactions(address _partner) external view returns (Transaction[] memory) {
        return _partnerTransactions[_partner];
    }

    function getPartnerProposals(address _partner) external view returns (uint256[] memory) {
        return _partnerProposalIds[_partner];
    }

    // Admin functions
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
}