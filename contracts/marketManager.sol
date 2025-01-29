// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SavingsMarketplace
 * @dev Contract for managing the marketplace interactions between users and partners
 */
contract SavingsMarketplace is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant MARKETPLACE_ADMIN = keccak256("MARKETPLACE_ADMIN");
    
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
    
    enum MatchStatus { PENDING, ACTIVE, COMPLETED, CANCELLED }
    
    // State variables
    mapping(uint256 => Match) public matches;
    mapping(address => uint256[]) public userMatches;
    mapping(address => uint256[]) public partnerMatches;
    mapping(address => bool) public blacklistedUsers;
    mapping(address => uint256) public userMatchLimit;
    
    uint256 public nextMatchId = 1;
    uint256 public platformFee = 25; // 0.25%
    uint256 public constant RATE_DENOMINATOR = 10000;
    uint256 public minMatchDuration = 7 days;
    uint256 public maxMatchDuration = 365 days;
    uint256 public defaultMatchLimit = 5;
    
    // Events
    event MatchCreated(
        uint256 indexed matchId,
        address indexed user,
        address indexed partner,
        uint256 amount,
        uint256 matchRate
    );
    event MatchUpdated(
        uint256 indexed matchId,
        MatchStatus newStatus
    );
    event MatchCompleted(
        uint256 indexed matchId,
        uint256 userReturn,
        uint256 partnerReturn
    );
    event PlatformFeeUpdated(uint256 newFee);
    event ContractsUpdated(address userContract, address partnerContract);
    event UserBlacklisted(address user, bool status);
    event MatchLimitUpdated(address user, uint256 newLimit);
    event DurationLimitsUpdated(uint256 minDuration, uint256 maxDuration);
    event EmergencyWithdrawal(address token, address recipient, uint256 amount);
    
    // Errors
    error InvalidMatch();
    error InvalidAmount();
    error InvalidStatus();
    error InvalidDuration();
    error Unauthorized();
    error ContractNotSet();
    error UserBlacklisted();
    error ExceededMatchLimit();
    error InvalidFeeAmount();
    error ZeroAddress();
    
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
    }
    
    // Match creation and management
    function createMatch(
        address _user,
        address _partner,
        uint256 _userAmount,
        uint256 _matchRate,
        uint256 _duration
    ) 
        external
        nonReentrant
        whenNotPaused
    {
        if (msg.sender != partnerContract) revert Unauthorized();
        if (blacklistedUsers[_user]) revert UserBlacklisted();
        if (_duration < minMatchDuration || _duration > maxMatchDuration) 
            revert InvalidDuration();
            
        uint256 userActiveMatches = getUserActiveMatchCount(_user);
        if (userActiveMatches >= userMatchLimit[_user]) 
            revert ExceededMatchLimit();
        
        uint256 matchId = nextMatchId++;
        uint256 partnerAmount = (_userAmount * _matchRate) / RATE_DENOMINATOR;
        
        Match memory newMatch = Match({
            id: matchId,
            user: _user,
            partner: _partner,
            userAmount: _userAmount,
            partnerAmount: partnerAmount,
            matchRate: _matchRate,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            status: MatchStatus.PENDING
        });
        
        matches[matchId] = newMatch;
        userMatches[_user].push(matchId);
        partnerMatches[_partner].push(matchId);
        
        emit MatchCreated(
            matchId,
            _user,
            _partner,
            _userAmount,
            _matchRate
        );
    }
    
    function acceptMatch(
        uint256 _matchId,
        address _user,
        address _partner
    )
        external
        nonReentrant
        whenNotPaused
    {
        if (msg.sender != userContract) revert Unauthorized();
        if (blacklistedUsers[_user]) revert UserBlacklisted();
        
        Match storage match = matches[_matchId];
        if (match.status != MatchStatus.PENDING) revert InvalidStatus();
        if (match.user != _user || match.partner != _partner) revert InvalidMatch();
        
        // Transfer funds from user and partner to this contract
        bool userSuccess = daiToken.transferFrom(
            _user,
            address(this),
            match.userAmount
        );
        bool partnerSuccess = daiToken.transferFrom(
            _partner,
            address(this),
            match.partnerAmount
        );
        
        if (!userSuccess || !partnerSuccess) revert("Transfer failed");
        
        match.status = MatchStatus.ACTIVE;
        
        emit MatchUpdated(_matchId, MatchStatus.ACTIVE);
    }
    
    function completeMatch(uint256 _matchId)
        external
        nonReentrant
        whenNotPaused
    {
        Match storage match = matches[_matchId];
        if (match.status != MatchStatus.ACTIVE) revert InvalidStatus();
        if (block.timestamp < match.endTime) revert("Match not yet complete");
        
        uint256 totalAmount = match.userAmount + match.partnerAmount;
        uint256 fee = (totalAmount * platformFee) / RATE_DENOMINATOR;
        uint256 returnAmount = totalAmount - fee;
        
        // Calculate returns proportionally
        uint256 userReturn = (returnAmount * match.userAmount) / totalAmount;
        uint256 partnerReturn = returnAmount - userReturn;
        
        // Transfer returns
        bool userSuccess = daiToken.transfer(match.user, userReturn);
        bool partnerSuccess = daiToken.transfer(match.partner, partnerReturn);
        
        if (!userSuccess || !partnerSuccess) revert("Transfer failed");
        
        match.status = MatchStatus.COMPLETED;
        
        emit MatchCompleted(_matchId, userReturn, partnerReturn);
    }
    
    function cancelMatch(uint256 _matchId)
        external
        whenNotPaused
    {
        Match storage match = matches[_matchId];
        if (msg.sender != match.user && msg.sender != match.partner && 
            !hasRole(MARKETPLACE_ADMIN, msg.sender)) revert Unauthorized();
        if (match.status != MatchStatus.PENDING) revert InvalidStatus();
        
        match.status = MatchStatus.CANCELLED;
        emit MatchUpdated(_matchId, MatchStatus.CANCELLED);
    }
    
    // View functions
    function getUserMatches(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userMatches[_user];
    }
    
    function getPartnerMatches(address _partner)
        external
        view
        returns (uint256[] memory)
    {
        return partnerMatches[_partner];
    }
    
    function getMatchDetails(uint256 _matchId)
        external
        view
        returns (Match memory)
    {
        return matches[_matchId];
    }
    
    function getUserActiveMatchCount(address _user) 
        public 
        view 
        returns (uint256)
    {
        uint256 count = 0;
        uint256[] memory userMatchIds = userMatches[_user];
        
        for (uint256 i = 0; i < userMatchIds.length; i++) {
            if (matches[userMatchIds[i]].status == MatchStatus.ACTIVE) {
                count++;
            }
        }
        
        return count;
    }
    
    // Admin functions
    function updatePlatformFee(uint256 _newFee) 
        external 
        onlyRole(MARKETPLACE_ADMIN) 
    {
        if (_newFee > 1000) revert InvalidFeeAmount(); // Max 10%
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }
    
    function updateContracts(address _newUserContract, address _newPartnerContract)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (_newUserContract == address(0) || _newPartnerContract == address(0))
            revert ZeroAddress();
            
        userContract = _newUserContract;
        partnerContract = _newPartnerContract;
        
        emit ContractsUpdated(_newUserContract, _newPartnerContract);
    }
    
    function updateUserBlacklist(address _user, bool _blacklisted)
        external
        onlyRole(MARKETPLACE_ADMIN)
    {
        blacklistedUsers[_user] = _blacklisted;
        emit UserBlacklisted(_user, _blacklisted);
    }
    
    function setUserMatchLimit(address _user, uint256 _newLimit)
        external
        onlyRole(MARKETPLACE_ADMIN)
    {
        userMatchLimit[_user] = _newLimit == 0 ? defaultMatchLimit : _newLimit;
        emit MatchLimitUpdated(_user, userMatchLimit[_user]);
    }
    
    function updateDurationLimits(uint256 _minDuration, uint256 _maxDuration)
        external
        onlyRole(MARKETPLACE_ADMIN)
    {
        if (_minDuration >= _maxDuration) revert InvalidDuration();
        
        minMatchDuration = _minDuration;
        maxMatchDuration = _maxDuration;
        
        emit DurationLimitsUpdated(_minDuration, _maxDuration);
    }
    
    // Emergency functions
    function emergencyWithdraw(address _token, address _recipient, uint256 _amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenPaused
    {
        if (_recipient == address(0)) revert ZeroAddress();
        
        IERC20 token = IERC20(_token);
        bool success = token.transfer(_recipient, _amount);
        if (!success) revert("Transfer failed");
        
        emit EmergencyWithdrawal(_token, _recipient, _amount);
    }
    
    function pause() external onlyRole(MARKETPLACE_ADMIN) {
        _pause();
    }
    
    function unpause() external onlyRole(MARKETPLACE_ADMIN) {
        _unpause();
    }
}