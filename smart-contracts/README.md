# Finance Simplified - Smart Contracts

Solidity smart contracts for the Finance Simplified application.

## Technologies Used

- Solidity 0.8.20
- Hardhat
- OpenZeppelin Contracts
- Ethers.js

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test
```

## Deployment

```bash
# Deploy to local Hardhat network
npm run deploy:local

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

## Contracts

### FinanceToken.sol

An ERC20 token implementation with:
- Minting: Owner can mint new tokens
- Burning: Users can burn their tokens, and owner can burn any tokens

### Wallet.sol

A simple wallet contract that allows users to:
- Deposit ERC20 tokens
- Withdraw ERC20 tokens
- Transfer tokens between users without leaving the contract

## Testing

Tests are written using Hardhat's testing framework with Chai assertions.

```bash
# Run all tests
npm test

# Run a specific test file
npx hardhat test test/FinanceToken.test.js
```

## Configuration

Create a `.env` file based on `.env.example` with your:
- Ethereum private key
- Infura API key (or other provider)
- Etherscan API key for verification
