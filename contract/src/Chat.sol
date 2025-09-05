//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.26;

import {PriceConverter} from "./PriceConverter.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Chat is ReentrancyGuard{
    event Staked(address indexed user, uint256 ethAmount, uint256 activeChats);
    event Compensated(address indexed recipient, address indexed snubber, uint256 compensationAmount, uint256 contractFee);
    event Refunded(address indexed recipient, uint256 refundAmount);
    event ProfitWithdrawn(address indexed owner, uint256 amount);

    using PriceConverter for uint256;

    uint256 public constant stakeAmount = 3; // $3 USD
    uint256 public constant contractFee = 1; // $1 USD
    uint256 public constant refundAmount = 3; // $3 USD
    uint256 public contractProfit;
    
    // Use EITHER single-chat OR multi-chat mappings, not both
    mapping(address => uint256) public totalStakes;  // For multi-chat
    mapping(address => uint256) public activeChats; // For multi-chat
    
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function stake() public payable nonReentrant{
        uint256 requiredEth = stakeAmount.convertUsdToEth();
        require(msg.value >= requiredEth, "Must send exact ether amount");
        // Allow multiple stakes for multiple chats
        totalStakes[msg.sender] += msg.value;
        activeChats[msg.sender] += 1;

         emit Staked(msg.sender, msg.value, activeChats[msg.sender]);
    }

    // Victim gets $5, contract keeps $1 profit
    function compensate(address payable recipient, address snubber) public onlyOwner nonReentrant{
        require(activeChats[recipient] > 0, "Recipient has no active chats");
        require(activeChats[snubber] > 0, "Snubber has no active chats");
        
        uint256 stakeEth = stakeAmount.convertUsdToEth();
        require(totalStakes[recipient] >= stakeEth, "Recipient insufficient stake");
        require(totalStakes[snubber] >= stakeEth, "Snubber insufficient stake");
        
        // Calculate compensation: $6 total stakes - $1 contract fee = $5 for victim
        uint256 feeEth = contractFee.convertUsdToEth();
        uint256 compensationEth = (stakeEth * 2) - feeEth;
        
        // Deduct stakes from both parties
        totalStakes[recipient] -= stakeEth;
        totalStakes[snubber] -= stakeEth;
        activeChats[recipient] -= 1;
        activeChats[snubber] -= 1;
        
         contractProfit += feeEth;

        // Victim gets $5 compensation, contract automatically keeps $1
         emit Compensated(recipient, snubber, compensationEth, feeEth);
        recipient.transfer(compensationEth);

    }

    function refund(address payable recipient) public onlyOwner nonReentrant{
        require(activeChats[recipient] > 0, "No active chats to refund");
        
        uint256 stakeEth = stakeAmount.convertUsdToEth();
        require(totalStakes[recipient] >= stakeEth, "Insufficient stake");
        
        uint256 refundEth = refundAmount.convertUsdToEth();
        
        // Deduct stake and reduce active chats
        totalStakes[recipient] -= stakeEth;
        activeChats[recipient] -= 1;
        
        // Give partial refund ($2), contract keeps $1
          emit Refunded(recipient, refundEth);
        recipient.transfer(refundEth);
    }
    
    function getContractBalance() public view returns (uint256) {
        uint256 balance = address(this).balance;
        return balance.convertEthToUsd();
    }

    function withdrawContractProfit() public onlyOwner {
        require(contractProfit > 0, "No profits to withdraw");
        uint256 amount = contractProfit;
        contractProfit = 0;
        payable(owner).transfer(amount);
        emit ProfitWithdrawn(owner, amount);
    }
}