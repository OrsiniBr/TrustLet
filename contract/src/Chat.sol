//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Chat is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public constant chatToken = IERC20(0x69d217D74dA1Ac1f05485BB2729025f693527081);

    event Staked(address indexed user, uint256 tokenAmount);
    event Compensated(
        address indexed recipient, uint256 compensationAmount, uint256 contractFee
    );
    event Refunded(address indexed recipient, uint256 refundAmount);
    event ProfitWithdrawn(address indexed owner, uint256 amount);

    uint256 public constant stakeAmount = 3 * 1e18; // $3 worth of tokens
    uint256 public constant compensateAmount = 5 * 1e18; // $5 worth of tokens
    uint256 public constant contractFee = 1 * 1e18; // $1 worth of tokens
    uint256 public contractProfit;

    // Multi-chat mappings
    // mapping(address => uint256) public totalStakes;
    // mapping(address => uint256) public activeChats;

    constructor() Ownable(msg.sender) {}

    function stake() public nonReentrant whenNotPaused {
        // Transfer tokens FROM user TO contract
        chatToken.safeTransferFrom(msg.sender, address(this), stakeAmount);

        emit Staked(msg.sender, stakeAmount);
    }

    function compensate(address recipient) public onlyOwner nonReentrant {
     
        // Add to contract profit
        contractProfit += contractFee;

        // Transfer compensation to recipient (from contract balance)
        chatToken.safeTransfer(recipient, compensateAmount);

        emit Compensated(recipient,compensateAmount, contractFee);
    }

    function refund(address recipient) public onlyOwner nonReentrant {
      
        // Refund to recipient
        chatToken.safeTransfer(recipient, stakeAmount);

        emit Refunded(recipient, stakeAmount);
    }

    function getContractBalance() public view returns (uint256) {
        return chatToken.balanceOf(address(this));
    }

    function withdrawContractProfit() public onlyOwner nonReentrant {
        require(contractProfit > 0, "No profits to withdraw");
        uint256 amount = contractProfit;
        contractProfit = 0;
        
        // Transfer FROM contract TO owner
        chatToken.safeTransfer(msg.sender, amount);
        
        emit ProfitWithdrawn(msg.sender, amount);
    }

    // Admin functions
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Emergency withdrawal function
    function emergencyWithdraw(uint256 amount) public onlyOwner {
        require(amount <= chatToken.balanceOf(address(this)), "Insufficient balance");
        chatToken.safeTransfer(msg.sender, amount);
    }
}