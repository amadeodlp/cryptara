import { setContractAddresses } from '../services/web3Service';
export const API_CONFIG = {
    BASE_URL: `https://${import.meta.env.VITE_API_URL}/api`
};
// Initialize contract addresses from environment variables if available
export const initializeContracts = () => {
  const tokenContractAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;
  const walletContractAddress = import.meta.env.VITE_WALLET_CONTRACT_ADDRESS;
  const stakingContractAddress = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS;
  if (tokenContractAddress && walletContractAddress) {
    console.log('Using contract addresses from environment variables');
    setContractAddresses(tokenContractAddress, walletContractAddress, stakingContractAddress);
    
    // Log network info
    console.log('Connected to Sepolia network with contracts:');
    console.log('- Token:', tokenContractAddress);
    console.log('- Wallet:', walletContractAddress);
    console.log('- Staking:', stakingContractAddress);
  } else {
    console.log('No contract addresses found in environment variables, using localStorage if available');
  }
};
