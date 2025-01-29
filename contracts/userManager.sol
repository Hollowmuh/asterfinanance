// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface ISavingsPartner {
    struct MatchProposal {
        uint256 id;
        address partner;
        address saver;
        uint256 amount;
        uint256 matchRate;
        uint256 deadline;
        bool isActive;
    }
    
    function getProposal(uint256 _proposalId) external view returns (MatchProposal memory);
    function finalizeMatch(uint256 _proposalId) external;
}

contract SavingsUser is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant USER_MANAGER_ROLE = keccak256("USER_MANAGER_ROLE");
    uint256 public constant STREAK_DURATION = 30 days;
    
    IERC20 public immutable daiToken;
    ISavingsPartner public savingsPartner;
    
    struct User {
        bool isRegistered;
        bool isKYCVerified;
        uint256 savingsGoal;
        uint256 minimumBalance;
        uint256 availableBalance;
        uint256 lockedInMatches;
        uint256 totalSaved;
        uint256 lastDepositTime;
        uint256 streakCount;
        uint256 bestStreak;
        bool notificationsEnabled;
    }
    
    struct SavingsTransaction {
        uint256 id;
        uint256 amount;
        uint256 timestamp;
        TransactionType txType;
        string notes;
    }
    
    enum TransactionType { DEPOSIT, WITHDRAWAL, MATCH_LOCK, MATCH_RELEASE }

    mapping(address => User) public users;
    mapping(address => SavingsTransaction[]) private _userTransactions;
    mapping(address => mapping(uint256 => bool)) private _respondedProposals;
    
    uint256 private _nextTransactionId = 1;
    uint256 public minimumDeposit = 10 ether; // 10 DAI (18 decimals)
    uint256 public minimumWithdrawalBalance = 100 ether; // 100 DAI

    event UserRegistered(address indexed user);
    event KYCSatusUpdated(address indexed user, bool status);
    event DepositMade(address indexed user, uint256 amount);
    event WithdrawalMade(address indexed user, uint256 amount);
    event MatchLocked(address indexed user, uint256 proposalId, uint256 amount);
    event MatchReleased(uint256 proposalId, bool success);
    event SettingsUpdated(address indexed user);

    error InvalidAmount();
    error InsufficientBalance();
    error NotRegistered();
    error AlreadyRegistered();
    error Unauthorized();
    error InvalidOperation();
    error ProposalAlreadyProcessed();
    error BelowMinimumBalance();

    constructor(address _daiToken, address _savingsPartner) {
        daiToken = IERC20(_daiToken);
        savingsPartner = ISavingsPartner(_savingsPartner);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(USER_MANAGER_ROLE, _savingsPartner);
    }

    modifier onlyRegistered() {
        if (!users[msg.sender].isRegistered) revert NotRegistered();
        _;
    }

    function registerUser(uint256 _initialGoal) external {
        if (users[msg.sender].isRegistered) revert AlreadyRegistered();
        if (_initialGoal < minimumDeposit) revert InvalidAmount();
        
        users[msg.sender] = User({
            isRegistered: true,
            isKYCVerified: false,
            savingsGoal: _initialGoal,
            minimumBalance: 0,
            availableBalance: 0,
            lockedInMatches: 0,
            totalSaved: 0,
            lastDepositTime: 0,
            streakCount: 0,
            bestStreak: 0,
            notificationsEnabled: true
        });
        
        emit UserRegistered(msg.sender);
    }

    function deposit(uint256 _amount) external onlyRegistered nonReentrant whenNotPaused {
        User storage user = users[msg.sender];
        if (_amount < minimumDeposit) revert InvalidAmount();
        
        uint256 balanceBefore = daiToken.balanceOf(address(this));
        if (!daiToken.transferFrom(msg.sender, address(this), _amount)) revert("Transfer failed");
        uint256 received = daiToken.balanceOf(address(this)) - balanceBefore;
        
        user.availableBalance += received;
        user.totalSaved += received;
        
        _updateStreak(user);
        _recordTransaction(TransactionType.DEPOSIT, received, "Deposit");
        
        emit DepositMade(msg.sender, received);
    }

    function withdraw(uint256 _amount) external onlyRegistered nonReentrant whenNotPaused {
        User storage user = users[msg.sender];
        if (_amount > user.availableBalance) revert InsufficientBalance();
        if (user.availableBalance - _amount < user.minimumBalance) revert BelowMinimumBalance();
        
        user.availableBalance -= _amount;
        if (!daiToken.transfer(msg.sender, _amount)) revert("Transfer failed");
        
        _recordTransaction(TransactionType.WITHDRAWAL, _amount, "Withdrawal");
        emit WithdrawalMade(msg.sender, _amount);
    }

    function acceptMatch(uint256 _proposalId) external onlyRegistered nonReentrant whenNotPaused {
        if (_respondedProposals[msg.sender][_proposalId]) revert ProposalAlreadyProcessed();
        
        ISavingsPartner.MatchProposal memory proposal = savingsPartner.getProposal(_proposalId);
        if (proposal.saver != msg.sender || !proposal.isActive) revert InvalidOperation();
        
        User storage user = users[msg.sender];
        if (user.availableBalance < proposal.amount) revert InsufficientBalance();
        
        user.availableBalance -= proposal.amount;
        user.lockedInMatches += proposal.amount;
        _respondedProposals[msg.sender][_proposalId] = true;
        
        _recordTransaction(TransactionType.MATCH_LOCK, proposal.amount, "Match locked");
        savingsPartner.finalizeMatch(_proposalId);
        
        emit MatchLocked(msg.sender, _proposalId, proposal.amount);
    }

    // Admin functions
    function releaseMatchFunds(uint256 _proposalId, bool _success) external onlyRole(USER_MANAGER_ROLE) {
        ISavingsPartner.MatchProposal memory proposal = savingsPartner.getProposal(_proposalId);
        User storage user = users[proposal.saver];
        
        user.lockedInMatches -= proposal.amount;
        if (_success) {
            user.totalSaved += (proposal.amount * proposal.matchRate) / 10000;
        } else {
            user.availableBalance += proposal.amount;
        }
        
        _recordTransactionFor(
            proposal.saver,
            TransactionType.MATCH_RELEASE,
            proposal.amount,
            _success ? "Match completed" : "Match failed"
        );
        
        emit MatchReleased(_proposalId, _success);
    }

    function updateKYCStatus(address _user, bool _status) external onlyRole(USER_MANAGER_ROLE) {
        users[_user].isKYCVerified = _status;
        emit KYCSatusUpdated(_user, _status);
    }

    function _updateStreak(User storage user) private {
        uint256 currentStreak = block.timestamp <= user.lastDepositTime + STREAK_DURATION 
            ? user.streakCount + 1 
            : 1;
        
        user.streakCount = currentStreak;
        if (currentStreak > user.bestStreak) {
            user.bestStreak = currentStreak;
        }
        user.lastDepositTime = block.timestamp;
    }

    function _recordTransaction(TransactionType _type, uint256 _amount, string memory _notes) private {
        _userTransactions[msg.sender].push(SavingsTransaction({
            id: _nextTransactionId++,
            amount: _amount,
            timestamp: block.timestamp,
            txType: _type,
            notes: _notes
        }));
    }

    function _recordTransactionFor(address _user, TransactionType _type, uint256 _amount, string memory _notes) private {
        _userTransactions[_user].push(SavingsTransaction({
            id: _nextTransactionId++,
            amount: _amount,
            timestamp: block.timestamp,
            txType: _type,
            notes: _notes
        }));
    }

    // View functions
    function getUserTransactions(address _user) external view returns (SavingsTransaction[] memory) {
        return _userTransactions[_user];
    }

    function getStreakInfo(address _user) external view returns (uint256 current, uint256 best) {
        User memory user = users[_user];
        return (user.streakCount, user.bestStreak);
    }

    function setMinimumDeposit(uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minimumDeposit = _amount;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}