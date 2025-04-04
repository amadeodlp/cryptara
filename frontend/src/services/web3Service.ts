import { ethers } from 'ethers';

// ABI for the token contract
const tokenAbi = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  // Authenticated functions
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// ABI for the wallet contract
const walletAbi = [
  // Read-only functions
  "function balanceOf(address token, address user) view returns (uint256)",
  // Authenticated functions
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function transfer(address token, address to, uint256 amount) external"
];

// ABI for the staking contract
const stakingAbi = [
  // Read-only functions
  "function getTotalStaked(address user) view returns (uint256)",
  "function getPoolInfo(uint256 poolId) view returns (tuple(uint256 totalStaked, uint256 rewardRate, uint256 lockPeriod, bool isActive))", 
  "function getUserStakeInfo(address user, uint256 poolId) view returns (tuple(uint256 amount, uint256 startTime, uint256 endTime, bool isActive))",
  // Authenticated functions
  "function stake(uint256 poolId, uint256 amount) external",
  "function unstake(uint256 poolId) external",
  "function claimRewards(uint256 poolId) external returns (uint256)"
];

// ABI for the token sale contract
const tokenSaleAbi = [
  // Read-only functions
  "function craToken() view returns (address)",
  "function tokenPrice() view returns (uint256)",
  // Authenticated functions
  "function buyTokens() payable",
  "function setTokenPrice(uint256 _newPrice)",
  "function withdrawETH()",
  "function withdrawUnsoldTokens()"
];

// Contract addresses - these will be updated based on environment variables or localStorage
let TOKEN_CONTRACT_ADDRESS = ''; 
let WALLET_CONTRACT_ADDRESS = ''; 
let STAKING_CONTRACT_ADDRESS = '';
let TOKEN_SALE_CONTRACT_ADDRESS = '';

export const setContractAddresses = (tokenAddress: string, walletAddress: string, stakingAddress?: string, tokenSaleAddress?: string) => {
  TOKEN_CONTRACT_ADDRESS = tokenAddress;
  WALLET_CONTRACT_ADDRESS = walletAddress;
  if (stakingAddress) {
    STAKING_CONTRACT_ADDRESS = stakingAddress;
    localStorage.setItem('stakingContractAddress', stakingAddress);
  }
  
  if (tokenSaleAddress) {
    TOKEN_SALE_CONTRACT_ADDRESS = tokenSaleAddress;
    localStorage.setItem('tokenSaleContractAddress', tokenSaleAddress);
  }
  // Save to localStorage for persistence
  localStorage.setItem('tokenContractAddress', tokenAddress);
  localStorage.setItem('walletContractAddress', walletAddress);
};

// Initialize contract addresses from localStorage if available
export const initContractAddresses = () => {
  // Try to get from environment variables first
  const envTokenAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;
  const envWalletAddress = import.meta.env.VITE_WALLET_CONTRACT_ADDRESS;
  const envStakingAddress = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS;
  const envTokenSaleAddress = import.meta.env.VITE_TOKEN_SALE_CONTRACT_ADDRESS;
  
  // Set from environment if available
  if (envTokenAddress) TOKEN_CONTRACT_ADDRESS = envTokenAddress;
  if (envWalletAddress) WALLET_CONTRACT_ADDRESS = envWalletAddress;
  if (envStakingAddress) STAKING_CONTRACT_ADDRESS = envStakingAddress;
  if (envTokenSaleAddress) TOKEN_SALE_CONTRACT_ADDRESS = envTokenSaleAddress;
  
  // Fall back to localStorage if needed
  const tokenAddress = localStorage.getItem('tokenContractAddress');
  const walletAddress = localStorage.getItem('walletContractAddress');
  const stakingAddress = localStorage.getItem('stakingContractAddress');
  const tokenSaleAddress = localStorage.getItem('tokenSaleContractAddress');
  
  if (tokenAddress && !TOKEN_CONTRACT_ADDRESS) TOKEN_CONTRACT_ADDRESS = tokenAddress;
  if (walletAddress && !WALLET_CONTRACT_ADDRESS) WALLET_CONTRACT_ADDRESS = walletAddress;
  if (stakingAddress && !STAKING_CONTRACT_ADDRESS) STAKING_CONTRACT_ADDRESS = stakingAddress;
  if (tokenSaleAddress && !TOKEN_SALE_CONTRACT_ADDRESS) TOKEN_SALE_CONTRACT_ADDRESS = tokenSaleAddress;
  
  // Log the loaded addresses
  console.log('Loaded contract addresses:', {
    token: TOKEN_CONTRACT_ADDRESS,
    wallet: WALLET_CONTRACT_ADDRESS,
    staking: STAKING_CONTRACT_ADDRESS,
    tokenSale: TOKEN_SALE_CONTRACT_ADDRESS
  });
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
};

// Connect to MetaMask
export const connectWallet = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Save to localStorage for persistence
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletAddress', accounts[0]);
    
    return accounts[0];
  } catch (error) {
    console.error('User denied account access', error);
    throw error;
  }
};

// Get Ethereum provider
export const getProvider = () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  return new ethers.BrowserProvider(window.ethereum);
};

// Get signer
export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

// Get token contract
export const getTokenContract = async (withSigner = false) => {
  if (!TOKEN_CONTRACT_ADDRESS) {
    throw new Error('Token contract address not set');
  }
  
  const provider = getProvider();
  
  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(TOKEN_CONTRACT_ADDRESS, tokenAbi, signer);
  }
  
  return new ethers.Contract(TOKEN_CONTRACT_ADDRESS, tokenAbi, provider);
};

// Get wallet contract
export const getWalletContract = async (withSigner = false) => {
  if (!WALLET_CONTRACT_ADDRESS) {
    throw new Error('Wallet contract address not set');
  }
  
  const provider = getProvider();
  
  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(WALLET_CONTRACT_ADDRESS, walletAbi, signer);
  }
  
  return new ethers.Contract(WALLET_CONTRACT_ADDRESS, walletAbi, provider);
};

// Get token balance
export const getTokenBalance = async (address: string) => {
  try {
    const contract = await getTokenContract();
    const balance = await contract.balanceOf(address);
    return balance;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return ethers.parseEther('0'); // Return 0 if there's an error
  }
};

// Get token symbol
export const getTokenSymbol = async () => {
  const contract = await getTokenContract();
  return await contract.symbol();
};

// Transfer tokens
export const transferTokens = async (to: string, amount: string) => {
  const contract = await getTokenContract(true);
  const parsedAmount = ethers.parseUnits(amount, 18);
  const tx = await contract.transfer(to, parsedAmount);
  return await tx.wait();
};

// Approve tokens for Wallet contract
export const approveTokens = async (amount: string) => {
  if (!WALLET_CONTRACT_ADDRESS) {
    throw new Error('Wallet contract address not set');
  }
  
  const contract = await getTokenContract(true);
  const parsedAmount = ethers.parseUnits(amount, 18);
  const tx = await contract.approve(WALLET_CONTRACT_ADDRESS, parsedAmount);
  return await tx.wait();
};

// Deposit tokens into Wallet
export const depositTokens = async (amount: string) => {
  if (!TOKEN_CONTRACT_ADDRESS) {
    throw new Error('Token contract address not set');
  }
  
  const contract = await getWalletContract(true);
  const parsedAmount = ethers.parseUnits(amount, 18);
  const tx = await contract.deposit(TOKEN_CONTRACT_ADDRESS, parsedAmount);
  return await tx.wait();
};

// Withdraw tokens from Wallet
export const withdrawTokens = async (amount: string) => {
  if (!TOKEN_CONTRACT_ADDRESS) {
    throw new Error('Token contract address not set');
  }
  
  const contract = await getWalletContract(true);
  const parsedAmount = ethers.parseUnits(amount, 18);
  const tx = await contract.withdraw(TOKEN_CONTRACT_ADDRESS, parsedAmount);
  return await tx.wait();
};

// Get Wallet balance
export const getWalletBalance = async (userAddress: string) => {
  if (!TOKEN_CONTRACT_ADDRESS) {
    throw new Error('Token contract address not set');
  }
  
  const contract = await getWalletContract();
  const balance = await contract.balanceOf(TOKEN_CONTRACT_ADDRESS, userAddress);
  return balance;
};

// Get staking contract
export const getStakingContract = async (withSigner = false) => {
  if (!STAKING_CONTRACT_ADDRESS) {
    throw new Error('Staking contract address not set');
  }
  
  const provider = getProvider();
  
  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, signer);
  }
  
  return new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, provider);
};

// Get total staked amount for a user
export const getTotalStaked = async (userAddress: string) => {
  try {
    const contract = await getStakingContract();
    const totalStaked = await contract.getTotalStaked(userAddress);
    return totalStaked;
  } catch (error) {
    console.error('Error getting total staked:', error);
    return ethers.parseEther('0');
  }
};

// Get token sale contract
export const getTokenSaleContract = async (withSigner = false) => {
  if (!TOKEN_SALE_CONTRACT_ADDRESS) {
    throw new Error('Token sale contract address not set');
  }
  
  const provider = getProvider();
  
  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(TOKEN_SALE_CONTRACT_ADDRESS, tokenSaleAbi, signer);
  }
  
  return new ethers.Contract(TOKEN_SALE_CONTRACT_ADDRESS, tokenSaleAbi, provider);
};

// Get token price from sale contract
export const getTokenPrice = async () => {
  try {
    const contract = await getTokenSaleContract();
    return await contract.tokenPrice();
  } catch (error) {
    console.error('Error getting token price:', error);
    // Return a default value if the contract is not yet deployed
    return ethers.parseEther('0.0001'); // Default price: 0.0001 ETH per token
  }
};

// Buy tokens with ETH
export const buyTokens = async (ethAmount: string) => {
  try {
    const contract = await getTokenSaleContract(true);
    const tx = await contract.buyTokens({ value: ethers.parseEther(ethAmount) });
    return await tx.wait();
  } catch (error: any) {
    console.error('Error buying tokens:', error);
    // Check if this is a contract not deployed error and give a meaningful message
    if (error.message && error.message.includes('contract not deployed')) {
      throw new Error('Token sale contract not deployed yet. Please deploy the contract first.');
    }
    throw error;
  }
};

// Initialize contract addresses when this module is loaded
initContractAddresses();
