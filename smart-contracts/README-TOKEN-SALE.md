# TokenSale Contract Deployment Guide

This guide explains how to deploy the TokenSale contract for the Finance Simplified project.

## Prerequisites

Before deploying the TokenSale contract, ensure you have:

1. Node.js and npm installed
2. The Finance Token already deployed (its address should be in `deployment.json`)
3. A properly configured `.env` file in the `smart-contracts` folder with:
   - `PRIVATE_KEY`: Your Ethereum wallet private key
   - `SEPOLIA_URL`: Your Infura or other provider URL for Sepolia testnet
   - `ETHERSCAN_API_KEY`: Your Etherscan API key (for verification)

## Option 1: Using the Automated Script

For convenience, an automated bash script has been provided:

1. Navigate to the smart-contracts directory:
   ```
   cd D:/projects/finance-simplified/smart-contracts
   ```

2. Make the script executable (if using Linux/Mac):
   ```
   chmod +x deploy-token-sale.sh
   ```

3. Run the script:
   ```
   # On Windows:
   .\deploy-token-sale.sh

   # On Linux/Mac:
   ./deploy-token-sale.sh
   ```

4. Follow the prompts in the script to select the network, deploy the contract, and optionally transfer tokens and verify the contract.

## Option 2: Manual Deployment

### Step 1: Setup Environment

1. Navigate to the smart-contracts directory:
   ```
   cd D:/projects/finance-simplified/smart-contracts
   ```

2. If you haven't done so already, create a `.env` file based on the `.env.example`:
   ```
   cp .env.example .env
   ```

3. Edit the `.env` file with your actual values.

### Step 2: Deploy the TokenSale Contract

1. Deploy the TokenSale contract to the Sepolia testnet:
   ```
   npx hardhat run scripts/deploy-token-sale.js --network sepolia
   ```

2. The script will:
   - Deploy the TokenSale contract
   - Update `deployment.json` with the new contract address
   - Update frontend and backend configurations if possible

### Step 3: Transfer Tokens to the Sale Contract

After deploying the TokenSale contract, transfer some tokens to it so they can be sold:

```
npx hardhat run scripts/transfer-tokens-to-sale.js --network sepolia
```

### Step 4: Verify the Contract on Etherscan (Optional)

For better transparency and interaction through Etherscan, verify your contract:

```
npx hardhat verify --network sepolia <tokenSaleAddress> <financeTokenAddress> <initialPrice>
```

Where:
- `<tokenSaleAddress>` is the deployed TokenSale contract address (from `deployment.json`)
- `<financeTokenAddress>` is the Finance Token address (from `deployment.json`)
- `<initialPrice>` is the initial token price (0.0001 ether in wei)

## Interacting with the Contract

After deployment, users can:
1. Buy tokens by sending ETH to the contract's `buyTokens()` function
2. The contract owner can:
   - Change the token price using `setTokenPrice()`
   - Withdraw accumulated ETH using `withdrawETH()`
   - Withdraw unsold tokens using `withdrawUnsoldTokens()`

## Troubleshooting

- **Error: Finance Token address not found** - Make sure you've deployed the Finance Token first and its address is correctly saved in `deployment.json`.
- **Transaction fails** - Ensure you have enough ETH for gas fees.
- **Not enough tokens for transfer** - Make sure the deployer has enough FIT tokens to transfer to the TokenSale contract.
- **Verification fails** - Double-check your Etherscan API key in the `.env` file.

## Contract Details

The TokenSale contract allows users to purchase FIT tokens using ETH at a configurable price. Key features:

- Owner can set and update the token price
- Owner can withdraw ETH received from sales
- Owner can withdraw unsold tokens
- Uses secure OpenZeppelin contracts for token interactions and access control