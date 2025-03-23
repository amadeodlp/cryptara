import { setContractAddresses } from '../services/web3Service';
export const API_CONFIG = {
    BASE_URL: `https://${import.meta.env.VITE_API_URL}/api`
};
// Initialize contract addresses from environment variables if available
export const initializeContracts = () => {
  const tokenContractAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;
  const walletContractAddress = import.meta.env.VITE_WALLET_CONTRACT_ADDRESS;
  const stakingContractAddress = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS;
  const tokenSaleContractAddress = import.meta.env.VITE_TOKEN_SALE_CONTRACT_ADDRESS;
  
  // Check if we have contract addresses from environment variables
  if (tokenContractAddress && walletContractAddress) {
    console.log('Using contract addresses from environment variables');
    setContractAddresses(tokenContractAddress, walletContractAddress, stakingContractAddress, tokenSaleContractAddress);
    
    // Log network info
    console.log('Connected to Sepolia network with contracts:');
    console.log('- Token:', tokenContractAddress);
    console.log('- Wallet:', walletContractAddress);
    console.log('- Staking:', stakingContractAddress);
    console.log('- Token Sale:', tokenSaleContractAddress);
  } else {
    console.log('No contract addresses found in environment variables, using localStorage if available');
  }
  
  // For development/testing, if no token sale contract address is set, use a placeholder
  if (!tokenSaleContractAddress && !localStorage.getItem('tokenSaleContractAddress')) {
    // Use a placeholder contract address for token sale
    const placeholderAddress = '0x0000000000000000000000000000000000000001';
    localStorage.setItem('tokenSaleContractAddress', placeholderAddress);
    console.log('Using placeholder token sale contract address for development:', placeholderAddress);
  }
};
