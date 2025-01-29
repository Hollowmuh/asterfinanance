// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface ISavingsUser {
    function lockFunds(address user, uint256 amount) external;
    function releaseFunds(address user, uint256 amount, bool success) external;
    function recordMatchCompletion(address user, uint256 returnsAmount) external;
}

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
    
    function lockPartnerFunds(address partner, uint256 amount) external;
    function releasePartnerFunds(address partner, uint256 amount, bool success) external;
    function getProposal(uint256 id) external view returns (MatchProposal memory);
    function markProposalCompleted(uint256 id) external;
}

contract SavingsMarketplace is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant MARKET_ADMIN = keccak256("MARKET_ADMIN");
    
    IERC20 public immutable daiToken;
    ISavingsUser public savingsUser;
    ISavingsPartner public savingsPartner;
    
    struct SavingsMatch {
        uint256 id;
        uint256 proposalId;
        address user;
        address partner;
        uint256 userAmount;
        uint256 partnerAmount;
        uint256 totalValue;
        uint256 startTime;
        uint256 endTime;
        MatchStatus status;
    }
    
    enum MatchStatus { PENDING, ACTIVE, COMPLETED, CANCELLED, DEFAULTED }
    
    mapping(uint256 => SavingsMatch) public matches;
    mapping(address => uint256[]) public userMatches;
    mapping(address => uint256[]) public partnerMatches;
    mapping(uint256 => bool) public processedProposals;
    
    uint256 public nextMatchId = 1;
    uint256 public platformFee = 25; // 0.25%
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public minDuration = 7 days;
    uint256 public maxDuration = 365 days;
    
    event MatchCreated(uint256 indexed matchId, uint256 proposalId, address user, address partner);
    MatchStatusUpdated(uint256 indexed matchId, MatchStatus status);
    event MatchSettled(uint256 indexed matchId, uint256 userShare, uint256 partnerShare, uint256 fee);
    event SystemPaused(bool status);
    
    error UnauthorizedAccess();
    error InvalidProposal();
    error InvalidDuration();
    error ExistingActiveMatch();
    error TransferFailed();
    error InvalidState();
    error ZeroAddress();
    error AlreadyProcessed();

    constructor(
        address _daiToken,
        address _userContract,
        address _partnerContract
    ) {
        if (_daiToken == address(0) || _userContract == address(0) || _partnerContract == address(0)) 
            revert ZeroAddress();
            
        daiToken = IERC20(_daiToken);
        savingsUser = ISavingsUser(_userContract);
        savingsPartner = ISavingsPartner(_partnerContract);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MARKET_ADMIN, msg.sender);
    }

    modifier onlyPartners() {
        if (msg.sender != address(savingsPartner)) revert UnauthorizedAccess();
        _;
    }

    function createMatch(uint256 proposalId) external onlyPartners nonReentrant {
        if (processedProposals[proposalId]) revert AlreadyProcessed();
        
        ISavingsPartner.MatchProposal memory proposal = savingsPartner.getProposal(proposalId);
        if (!proposal.isActive) revert InvalidProposal();
        
        SavingsMatch memory newMatch = SavingsMatch({
            id: nextMatchId++,
            proposalId: proposalId,
            user: proposal.saver,
            partner: proposal.partner,
            userAmount: proposal.amount,
            partnerAmount: (proposal.amount * proposal.matchRate) / FEE_DENOMINATOR,
            totalValue: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + proposal.deadline,
            status: MatchStatus.PENDING
        });
        
        matches[newMatch.id] = newMatch;
        userMatches[newMatch.user].push(newMatch.id);
        partnerMatches[newMatch.partner].push(newMatch.id);
        processedProposals[proposalId] = true;
        
        savingsUser.lockFunds(newMatch.user, newMatch.userAmount);
        savingsPartner.lockPartnerFunds(newMatch.partner, newMatch.partnerAmount);
        
        emit MatchCreated(newMatch.id, proposalId, newMatch.user, newMatch.partner);
    }

    function activateMatch(uint256 matchId) external onlyRole(MARKET_ADMIN) {
        SavingsMatch storage match = matches[matchId];
        if (match.status != MatchStatus.PENDING) revert InvalidState();
        
        match.status = MatchStatus.ACTIVE;
        match.totalValue = match.userAmount + match.partnerAmount;
        match.startTime = block.timestamp;
        
        emit MatchStatusUpdated(matchId, MatchStatus.ACTIVE);
    }

    function settleMatch(uint256 matchId) external nonReentrant {
        SavingsMatch storage match = matches[matchId];
        if (match.status != MatchStatus.ACTIVE) revert InvalidState();
        if (block.timestamp < match.endTime) revert InvalidState();
        
        uint256 fee = (match.totalValue * platformFee) / FEE_DENOMINATOR;
        uint256 distributed = match.totalValue - fee;
        
        uint256 userShare = (distributed * match.userAmount) / match.totalValue;
        uint256 partnerShare = distributed - userShare;
        
        _safeTransfer(match.user, userShare);
        _safeTransfer(match.partner, partnerShare);
        _safeTransfer(address(this), fee);
        
        match.status = MatchStatus.COMPLETED;
        
        savingsUser.releaseFunds(match.user, match.userAmount, true);
        savingsPartner.releasePartnerFunds(match.partner, match.partnerAmount, true);
        savingsUser.recordMatchCompletion(match.user, userShare);
        
        emit MatchSettled(matchId, userShare, partnerShare, fee);
        emit MatchStatusUpdated(matchId, MatchStatus.COMPLETED);
    }

    function cancelMatch(uint256 matchId, bool penalty) external onlyRole(MARKET_ADMIN) {
        SavingsMatch storage match = matches[matchId];
        if (match.status != MatchStatus.PENDING && match.status != MatchStatus.ACTIVE) 
            revert InvalidState();
        
        match.status = MatchStatus.CANCELLED;
        
        savingsUser.releaseFunds(match.user, match.userAmount, !penalty);
        savingsPartner.releasePartnerFunds(match.partner, match.partnerAmount, !penalty);
        
        emit MatchStatusUpdated(matchId, MatchStatus.CANCELLED);
    }

    function _safeTransfer(address to, uint256 amount) private {
        bool success = daiToken.transfer(to, amount);
        if (!success) revert TransferFailed();
    }

    // Admin functions
    function updatePlatformFee(uint256 newFee) external onlyRole(MARKET_ADMIN) {
        if (newFee > 1000) revert InvalidState(); // Max 10%
        platformFee = newFee;
    }

    function updateContracts(address userContract, address partnerContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (userContract == address(0) || partnerContract == address(0)) revert ZeroAddress();
        savingsUser = ISavingsUser(userContract);
        savingsPartner = ISavingsPartner(partnerContract);
    }

    function emergencyPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
        emit SystemPaused(true);
    }

    function emergencyUnpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
        emit SystemPaused(false);
    }

    function getActiveMatches(address user) external view returns (uint256[] memory) {
        return userMatches[user];
    }
}