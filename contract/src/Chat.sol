//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.26;

import "./PriceConverter.sol";

contract Chat {
    using PriceConverter for uint256;

    uint256 public constant stakeAmount = 3; // $3 USD
    uint256 public constant compensationAmount = 5; // $5 USD
    uint256 public constant refundAmount = 2; // $2 USD
    
    mapping(address => uint256) public stakes;
    mapping(address => bool) public hasStaked;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function stake() public payable {
        require(!hasStaked[msg.sender], "Already staked");
        uint256 requiredEth = stakeAmount.convertUsdToEth();
        require(msg.value >= requiredEth, "Must send exact ether amount");
        
        stakes[msg.sender] = msg.value;
        hasStaked[msg.sender] = true;
    }

    function compensate(address payable recipient, address snubber) public onlyOwner {
        require(hasStaked[recipient], "Recipient must have staked");
        require(hasStaked[snubber], "Snubber must have staked");
        require(stakes[snubber] > 0, "Snubber has no stake");
        
        uint256 compensationEth = compensationAmount.convertUsdToEth();
        require(address(this).balance >= compensationEth, "Insufficient contract balance");
        
        // Reset snubber's stake (they lose it)
        stakes[snubber] = 0;
        hasStaked[snubber] = false;
        
        recipient.transfer(compensationEth);
    }

    function refund(address payable recipient) public onlyOwner {
        require(hasStaked[recipient], "Must have staked to get refund");
        require(stakes[recipient] > 0, "No stake to refund");
        
        uint256 refundEth = refundAmount.convertUsdToEth();
        require(address(this).balance >= refundEth, "Insufficient contract balance");
        
        // Reset user's stake
        stakes[recipient] = 0;
        hasStaked[recipient] = false;
        
        recipient.transfer(refundEth);
    }
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}