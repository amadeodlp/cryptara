#!/bin/bash
# deploy-token-sale.sh - Script to deploy the TokenSale contract and transfer tokens

# Directory paths
PROJECT_DIR="D:/projects/finance-simplified"
CONTRACTS_DIR="$PROJECT_DIR/smart-contracts"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "$CONTRACTS_DIR" ]; then
    print_error "Smart contracts directory not found at $CONTRACTS_DIR"
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Go to the smart contracts directory
cd "$CONTRACTS_DIR" || { 
    print_error "Failed to change directory to $CONTRACTS_DIR"; 
    exit 1;
}

print_message "Current directory: $(pwd)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_message ".env file created. Please edit it with your actual values before continuing."
        print_message "Press any key to continue after editing the .env file..."
        read -n 1 -s
    else
        print_error ".env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Check network to deploy to
echo ""
print_message "Available networks:"
echo "1) localhost (Hardhat local node)"
echo "2) sepolia (Sepolia testnet)"
echo ""
read -p "Select network to deploy to (1-2): " network_choice

case $network_choice in
    1)
        NETWORK="localhost"
        ;;
    2)
        NETWORK="sepolia"
        ;;
    *)
        print_error "Invalid choice. Using sepolia as default."
        NETWORK="sepolia"
        ;;
esac

print_message "Selected network: $NETWORK"

# If using localhost, make sure to start the local node first
if [ "$NETWORK" = "localhost" ]; then
    print_message "Starting local Hardhat node in a new terminal..."
    start cmd /k "cd $CONTRACTS_DIR && npx hardhat node"
    sleep 5
    print_message "Waiting for local node to start..."
    sleep 5
fi

# Deploy TokenSale contract
print_message "Deploying TokenSale contract to $NETWORK network..."
npx hardhat run scripts/deploy-token-sale.js --network "$NETWORK"
if [ $? -ne 0 ]; then
    print_error "Failed to deploy TokenSale contract"
    exit 1
fi

# Ask if user wants to transfer tokens to the sale contract
echo ""
read -p "Do you want to transfer tokens to the sale contract? (y/n): " transfer_choice
if [[ $transfer_choice =~ ^[Yy]$ ]]; then
    print_message "Transferring tokens to TokenSale contract..."
    npx hardhat run scripts/transfer-tokens-to-sale.js --network "$NETWORK"
    if [ $? -ne 0 ]; then
        print_error "Failed to transfer tokens to TokenSale contract"
        exit 1
    fi
fi

# Ask if user wants to verify the contract on Etherscan (only for testnet/mainnet)
if [ "$NETWORK" != "localhost" ]; then
    echo ""
    read -p "Do you want to verify the contract on Etherscan? (y/n): " verify_choice
    if [[ $verify_choice =~ ^[Yy]$ ]]; then
        # Read deployment.json to get the addresses
        DEPLOYMENT_FILE="$CONTRACTS_DIR/deployment.json"
        if [ -f "$DEPLOYMENT_FILE" ]; then
            TOKEN_SALE_ADDRESS=$(grep -o '"tokenSaleAddress": *"[^"]*"' "$DEPLOYMENT_FILE" | grep -o '"[^"]*"$' | tr -d '"')
            TOKEN_ADDRESS=$(grep -o '"tokenAddress": *"[^"]*"' "$DEPLOYMENT_FILE" | grep -o '"[^"]*"$' | tr -d '"')
            
            if [ -n "$TOKEN_SALE_ADDRESS" ] && [ -n "$TOKEN_ADDRESS" ]; then
                INITIAL_PRICE="100000000000000" # 0.0001 ETH in wei
                
                print_message "Verifying TokenSale contract on Etherscan..."
                print_message "TokenSale address: $TOKEN_SALE_ADDRESS"
                print_message "Token address: $TOKEN_ADDRESS"
                print_message "Initial price: $INITIAL_PRICE wei"
                
                npx hardhat verify --network "$NETWORK" "$TOKEN_SALE_ADDRESS" "$TOKEN_ADDRESS" "$INITIAL_PRICE"
                if [ $? -ne 0 ]; then
                    print_error "Failed to verify contract on Etherscan"
                fi
            else
                print_error "Could not find contract addresses in deployment.json"
            fi
        else
            print_error "deployment.json not found"
        fi
    fi
fi

print_message "Deployment process completed!"