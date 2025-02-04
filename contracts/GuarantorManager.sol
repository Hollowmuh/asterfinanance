// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GuarantorManager is EIP712, AccessControl, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    
    bytes32 public constant LOAN_MANAGER = keccak256("LOAN_MANAGER");
    IERC20 public immutable daiToken;
    
    // Minimum stake ratio relative to guaranteed amount (in basis points)
    uint256 public minimumStakeRatio = 2500; // 25%
    
    bytes32 private constant LOAN_GUARANTEE_TYPEHASH = keccak256(
        "LoanGuarantee(uint256 loanId,address borrower,uint256 amount,uint256 stakeAmount,uint256 deadline)"
    );

    struct LoanGuarantee {
        uint256 loanId;
        address borrower;
        uint256 amount;
        uint256 stakeAmount;
        uint256 deadline;
        bool isApproved;
        bool isLocked;  // New: prevents revocation after loan approval
        bytes signature;
    }

    // Mapping from loanId to guarantor address to guarantee details
    mapping(uint256 => mapping(address => LoanGuarantee)) public guarantees;
    // Track active guarantees per guarantor
    mapping(address => uint256) public activeGuaranteeCount;
    // Track total staked amount per guarantor
    mapping(address => uint256) public totalStakedAmount;
    
    uint256 public maxGuaranteesPerUser = 3;

    event GuaranteeApproved(
        uint256 indexed loanId, 
        address indexed guarantor, 
        address indexed borrower, 
        uint256 stakeAmount
    );
    event GuaranteeRevoked(uint256 indexed loanId, address indexed guarantor);
    event GuaranteeLocked(uint256 indexed loanId, address indexed guarantor);
    event GuaranteeClaimed(uint256 indexed loanId, address indexed guarantor, uint256 amount);
    event StakeRatioUpdated(uint256 newRatio);

    constructor(address _daiToken) EIP712("GuarantorManager", "1.0.0") {
        daiToken = IERC20(_daiToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LOAN_MANAGER, msg.sender);
    }

    function submitGuarantee(
        uint256 loanId,
        address borrower,
        uint256 amount,
        uint256 stakeAmount,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        require(block.timestamp <= deadline, "Guarantee expired");
        require(activeGuaranteeCount[msg.sender] < maxGuaranteesPerUser, "Too many active guarantees");
        
        // Validate stake amount meets minimum requirement
        uint256 requiredStake = (amount * minimumStakeRatio) / 10000;
        require(stakeAmount >= requiredStake, "Insufficient stake amount");
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            LOAN_GUARANTEE_TYPEHASH,
            loanId,
            borrower,
            amount,
            stakeAmount,
            deadline
        ));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        require(signer == msg.sender, "Invalid signature");

        // Transfer stake to contract
        require(daiToken.transferFrom(msg.sender, address(this), stakeAmount), "Stake transfer failed");
        
        // Update state
        guarantees[loanId][msg.sender] = LoanGuarantee({
            loanId: loanId,
            borrower: borrower,
            amount: amount,
            stakeAmount: stakeAmount,
            deadline: deadline,
            isApproved: true,
            isLocked: false,
            signature: signature
        });

        activeGuaranteeCount[msg.sender]++;
        totalStakedAmount[msg.sender] += stakeAmount;
        
        emit GuaranteeApproved(loanId, msg.sender, borrower, stakeAmount);
    }

    function revokeGuarantee(uint256 loanId) external nonReentrant {
        LoanGuarantee storage guarantee = guarantees[loanId][msg.sender];
        require(guarantee.isApproved, "No active guarantee");
        require(!guarantee.isLocked, "Guarantee locked");
        
        uint256 stakeToReturn = guarantee.stakeAmount;
        
        // Update state before transfer
        guarantee.isApproved = false;
        activeGuaranteeCount[msg.sender]--;
        totalStakedAmount[msg.sender] -= stakeToReturn;
        
        // Return stake to guarantor
        require(daiToken.transfer(msg.sender, stakeToReturn), "Stake return failed");
        
        emit GuaranteeRevoked(loanId, msg.sender);
    }

    function lockGuarantee(uint256 loanId, address guarantor) external onlyRole(LOAN_MANAGER) {
        LoanGuarantee storage guarantee = guarantees[loanId][guarantor];
        require(guarantee.isApproved && !guarantee.isLocked, "Invalid guarantee state");
        
        guarantee.isLocked = true;
        emit GuaranteeLocked(loanId, guarantor);
    }

    function claimGuarantee(
        uint256 loanId, 
        address guarantor, 
        address recipient,
        uint256 claimAmount
    ) external onlyRole(LOAN_MANAGER) {
        LoanGuarantee storage guarantee = guarantees[loanId][guarantor];
        require(guarantee.isApproved && guarantee.isLocked, "Invalid guarantee state");
        require(claimAmount <= guarantee.stakeAmount, "Claim exceeds stake");
        
        // Update state before transfer
        guarantee.isApproved = false;
        guarantee.stakeAmount -= claimAmount;
        activeGuaranteeCount[guarantor]--;
        totalStakedAmount[guarantor] -= claimAmount;
        
        // Transfer claimed amount to recipient
        require(daiToken.transfer(recipient, claimAmount), "Claim transfer failed");
        
        // Return remaining stake if any
        if (guarantee.stakeAmount > 0) {
            require(daiToken.transfer(guarantor, guarantee.stakeAmount), "Remaining stake return failed");
        }
        
        emit GuaranteeClaimed(loanId, guarantor, claimAmount);
    }

    function setMinimumStakeRatio(uint256 newRatio) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRatio <= 10000, "Invalid ratio");
        minimumStakeRatio = newRatio;
        emit StakeRatioUpdated(newRatio);
    }

    // Existing view functions
    function isApproved(uint256 loanId, address guarantor) external view returns (bool) {
        LoanGuarantee storage guarantee = guarantees[loanId][guarantor];
        return guarantee.isApproved && 
               block.timestamp <= guarantee.deadline &&
               activeGuaranteeCount[guarantor] <= maxGuaranteesPerUser;
    }

    // Existing admin functions remain unchanged
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}