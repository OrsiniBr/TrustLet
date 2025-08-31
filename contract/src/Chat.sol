//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.26;

contract Chat{

   uint256 public constant etherAmount = 333333333333333 wei; // 0.000333... ether
    
    function deposit() public payable {
        require(msg.value == etherAmount, "Must send exact ether amount");
    }
}

