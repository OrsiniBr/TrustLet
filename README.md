# Chat Smart Contract

## What is This Contract?
The `Chat` smart contract is a blockchain-based system built on Ethereum to manage a staking mechanism for a chat application. It ensures users commit to fair participation by staking a small amount of money (in cryptocurrency) and allows the contract owner to reward or penalize users based on their behavior in the chat.

- **Purpose**: Encourage good behavior in a chat platform by requiring users to stake $3 USD (paid in ETH). If a user misbehaves, they can lose their stake, and the owner can compensate affected users or issue refunds.
- **License**: UNLICENSED
- **Solidity Version**: 0.8.26
- **Dependency**: Relies on a `PriceConverter` library to convert USD amounts to ETH based on real-time exchange rates.

## How Does It Work?
The contract operates like a deposit system for a chat app. Users "stake" money to join, and the contract owner (the platform admin) can use these stakes to handle disputes or reward users. Here's a breakdown:

1. **Staking**:
   - Users deposit $3 USD in ETH to participate in the chat.
   - This stake acts as a commitment to follow the chat's rules.
   - The contract converts Guillermo's the ETH equivalent of $3 USD using a price feed (like Chainlink).

2. **Compensation**:
   - If a user (a "snubber") breaks the rules, the owner can penalize them by taking their stake.
   - The owner can then send $5 USD in ETH to another user (the "recipient") as compensation for the misbehavior.
   - The snubber's stake is reset to zero.

3. **Refunds**:
   - The owner can refund $2 USD in ETH to a user, ending their stake.
   - This might happen if a user leaves the chat or is eligible for a partial refund.

4. **Balance Check**:
   - Anyone can check the contract's ETH balance to see how much money is available for compensation or refunds.

5. **Owner Control**:
   - Only the contract owner (the person who deploys the contract) can issue compensations or refunds.
   - This ensures that only the platform admin can manage disputes.

## Key Features
- **Stake System**: Users must stake $3 USD in ETH to join the chat, ensuring accountability.
- **Compensation Mechanism**: Misbehaving users lose their stake, and victims can receive $5 USD in ETH.
- **Refund Option**: Users can be refunded $2 USD in ETH, with their stake reset.
- **Transparency**: The contract's ETH balance is publicly viewable.
- **Price Conversion**: Uses a `PriceConverter` library to convert USD to ETH, ensuring accurate payments despite ETH price changes.

## Contract Details
### Key Values
- `stakeAmount`: $3 USD (converted to ETH).
- `compensationAmount`: $5 USD (converted to ETH).
- `refundAmount`: $2 USD (converted to ETH).

### Main Functions
- **`stake()`**: Users send ETH equivalent to $3 USD to join. They can't stake again until their stake is reset.
- **`compensate(recipient, snubber)`**: The owner transfers $5 USD in ETH to the recipient and clears the snubber's stake.
- **`refund(recipient)`**: The owner refunds $2 USD in ETH to a user and clears their stake.
- **`getContractBalance()`**: Shows the contract's current ETH balance.

### Access Control
- Only the owner can call `compensate` and `refund` to manage funds.
- The owner is set as the person who deploys the contract.

## How to Use It
1. **Join the Chat (Stake)**:
   - Call `stake()` and send the ETH equivalent of $3 USD (check the amount using the `PriceConverter`).
   - Your stake is recorded, and you're marked as a participant.
2. **Handle Disputes (Compensation)**:
   - If someone misbehaves, the owner can call `compensate(recipient, snubber)` to reward the victim and penalize the offender.
3. **Request a Refund**:
   - The owner can call `refund(recipient)` to return $2 USD in ETH to a user.
4. **Check Funds**:
   - Use `getContractBalance()` to see how much ETH the contract holds.

