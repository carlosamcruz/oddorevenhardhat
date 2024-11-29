# Three-Phase On-Chain Odd or Even Game

An **on-chain Odd or Even game** implemented in Solidity, offering a provably fair and secure gameplay experience powered by cryptographic hashing.

## Overview

This project allows two players to participate in a fair "Odd or Even" game directly on the blockchain. The game's mechanics leverage **hashing and cryptographic verification** to ensure integrity and prevent cheating.

### How It Works

1. **Phase 1: Game Initialization**:
   - Player 1 starts the game by:
     - Selecting a number and an **Odd/Even** choice.
     - Generating a **hash** of their chosen number, salted with a unique game key.
     - Submitting the hash and their Odd/Even choice to the contract.

2. **Phase 2: Player 2 Joins**:
   - Player 2 accepts the game by:
     - Choosing a number.
     - Automatically accepting the opposite Odd/Even status.

3. **Phase 3 - option 1 - part 1: Result Submission**:
   - Player 1 reveals their chosen number and game key.
   - The contract verifies that the hash matches the original submission.
   - If Player 1 fails to provide valid information or mismatches the hash, Player 2 wins automatically.

4. **Phase 3 - option 1 - part 2: Winner Determination**:
   - If the hash matches, the game's winner is determined based on the oddness of the combined numbers.

5. **Phase 3 - option 2: Timeout Handling**:
   - Player 1 has a time limit to reveal their result. If they fail to do so, Player 2 can claim victory after the timeout.

---

## Features

- **Provably Fair Gameplay**: Cryptographic hashing ensures that Player 1 cannot alter their choice after the game starts.
- **On-Chain Verification**: All game logic is executed on-chain, ensuring transparency and trust.
- **Timeout Mechanism**: Protects Player 2 from indefinite waiting if Player 1 fails to reveal their result.

---

## Contract Details

- **Language**: Solidity
- **Blockchain**: Ethereum-compatible networks
- **Features**:
  - Secure hash-based commitment scheme
  - Automated winner determination
  - Timeout for unresponsive players

---

## How to Use

1. **Clone the Repository**:
   
To clone and install dependences, use the following commands:

(Make sure to have the extension Solidity from Nomic Foundation installed in your enviroment)

```shell
git clone https://github.com/carlosamcruz/oddorevenhardhat.git
cd oddorevenhardhat
npm install
```

2. **Run Tests**:
   
For tests, run the following commands:

```shell
npx hardhat node
npm test
npx hardhat coverage
```

3. **Deploy with Ignition in Local Network**:
   
To deploy with ignition in Local Network, run the following commands:

```shell
npx hardhat node
npm run deploy:ign
```

4. **Deploy in TestNet**

```shell
npm run deploy:bsc
npx hardhat verify --network bsctest 0x3f91FB5dAf7D1C6d4b5efe370dBd1e3e86DB44d4
Successfully verified contract OddOrEven on the block explorer.
https://testnet.bscscan.com/address/0x3f91FB5dAf7D1C6d4b5efe370dBd1e3e86DB44d4#code
```