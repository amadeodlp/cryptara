# Finance Simplified - Setup Guide

This document explains how to set up and run the Finance Simplified application.

## Project Structure

The monorepo contains three main components:

1. `frontend/` - React application with TypeScript and Tailwind CSS
2. `backend/` - C# API using ASP.NET Core
3. `smart-contracts/` - Solidity smart contracts using Hardhat

## Prerequisites

- Node.js 16+ and npm
- .NET 8 SDK
- MetaMask wallet browser extension

## Setup Steps

### 1. Smart Contracts

1. Create a `.env` file in the `smart-contracts/` directory:

```
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_URL=https://sepolia.infura.io/v3/your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
```

2. Install dependencies and compile contracts:

```bash
cd smart-contracts
npm install
npm run compile
```

3. Deploy contracts to local Hardhat network (for development):

```bash
# Start local Hardhat node in a separate terminal
npm run node

# Deploy contracts
npm run deploy:local
```

4. Once deployed, note the contract addresses from the console output.

### 2. Backend Configuration

1. Update the `appsettings.json` file in the `backend/` directory:

```json
{
  "Jwt": {
    "Key": "your_secure_jwt_key_at_least_32_characters_long",
    "Issuer": "FinanceSimplifiedBackend",
    "Audience": "FinanceSimplifiedFrontend",
    "ExpiryInMinutes": 60
  },
  "Blockchain": {
    "InfuraUrl": "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    "ContractAddress": "YOUR_CONTRACT_ADDRESS_FROM_DEPLOYMENT"
  }
}
```

2. Start the backend:

```bash
cd backend
dotnet run
```

The API will be available at `http://localhost:5000`.

### 3. Frontend Configuration

1. Update the contract addresses in `frontend/src/config/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  TOKEN_ADDRESS: 'your_token_contract_address_from_deployment',
  WALLET_ADDRESS: 'your_wallet_contract_address_from_deployment',
};
```

2. Install dependencies and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Test User Credentials

For development, you can use these test credentials:

- Email: test@example.com
- Password: password123

## Connecting MetaMask

1. Install the MetaMask browser extension if you haven't already.
2. If using a local Hardhat network:
   - Add a new network to MetaMask with:
     - Network Name: Hardhat Local
     - RPC URL: http://127.0.0.1:8545
     - Chain ID: 1337
     - Currency Symbol: ETH
3. Import a test account using private keys printed by Hardhat when running the local node.

## Deploying to a Testnet

To deploy to the Sepolia testnet:

1. Ensure your `.env` file has the correct configuration.
2. Run:

```bash
cd smart-contracts
npm run deploy:sepolia
```

3. Update the contract addresses in the frontend and backend configurations.

## Next Steps for Enhancement

1. Add more features to the smart contracts (staking, rewards, etc.)
2. Implement proper user registration in the backend
3. Add more pages to the frontend (transaction history, detailed portfolio view)
4. Implement error handling and notifications
5. Add proper database integration for the backend
