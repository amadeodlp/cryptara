# Environment Setup Guide

This document provides instructions for setting up the necessary environment variables for the Finance Simplified project.

## Smart Contracts (.env)

Create a `.env` file in the `smart-contracts` directory with the following variables:

```
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_URL=https://sepolia.infura.io/v3/your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Backend (ASP.NET Core)

### Option 1: User Secrets (Development)

For development, use the .NET User Secrets feature:

```bash
cd backend
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "your_secure_jwt_key_at_least_32_characters_long"
dotnet user-secrets set "Blockchain:InfuraUrl" "https://sepolia.infura.io/v3/your_infura_project_id"
dotnet user-secrets set "Blockchain:TokenContractAddress" "your_token_contract_address"
dotnet user-secrets set "Blockchain:WalletContractAddress" "your_wallet_contract_address"
dotnet user-secrets set "Blockchain:StakingContractAddress" "your_staking_contract_address"
```

### Option 2: Environment Variables (Production)

For production deployment, set these environment variables:

- `JWT__KEY` - Your secure JWT key (at least 32 characters)
- `BLOCKCHAIN__INFURAURL` - Your Infura URL with API key
- `BLOCKCHAIN__TOKENCONTRACTADDRESS` - Token contract address
- `BLOCKCHAIN__WALLETCONTRACTADDRESS` - Wallet contract address
- `BLOCKCHAIN__STAKINGCONTRACTADDRESS` - Staking contract address

Note: In .NET, double underscores (`__`) in environment variable names correspond to the colon (`:`) in configuration.

## Frontend (.env.local)

Create a `.env.local` file in the `frontend` directory with the following variables:

```
VITE_TOKEN_CONTRACT_ADDRESS=your_token_contract_address
VITE_WALLET_CONTRACT_ADDRESS=your_wallet_contract_address
VITE_STAKING_CONTRACT_ADDRESS=your_staking_contract_address
```

## Important Security Notes

- Never commit actual private keys, API keys, or secrets to version control
- Rotate any keys that may have been exposed in the repository history
- Use different keys for development and production environments
- Regularly rotate all your keys and secrets
