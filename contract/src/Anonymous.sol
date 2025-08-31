//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.26;

contract Anonymous{
    event message_added_to_pool(address user);
    event gift_message_added_to_pool(address user);

    address owner;
    string[]  allMessages; // Array to store all messages
    string[]  allGiftMessages; // Array to store all messages
    uint256  allMessagesCount; // Counter for messages
    uint256  allGiftMessagesCount; // Counter for messages
    mapping(address => string[]) userMessages; // Mapping for user-specific messages
    mapping(address => string[]) GiftMessages; // Mapping for user-specific messages

        constructor() {
        owner = msg.sender;
    }
    

    function addToPool(address user, string memory message) external {
        allMessages.push(message);
        userMessages[user].push(message);
        allMessagesCount++;
        emit message_added_to_pool(user);
    }
    function addToPoolWithGift(address user, string memory message) external {
        allMessages.push(message);
        userMessages[user].push(message);
        allMessagesCount++;
        emit message_added_to_pool(user);


        allGiftMessages.push(message);
        allGiftMessagesCount++
        emit gift_message_added_to_pool(user);
    }

    function getUserMessages(address user) external view returns (string[] memory) {
        return userMessages[user];
    }

    function getNumberOfMessagesForUser(address user) external view returns (uint256 ){
        userMessages[user].length;
    }

    function getAllMessages() external view returns (string[] memory) {
        return allMessages;
    }
    function getTOtalNumberOfMessage() external view returns (uint256 ) {
        return allMessagesCount;
    }
}