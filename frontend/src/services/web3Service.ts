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

// Contract addresses - these will need to be updated after deployment
let TOKEN_CONTRACT_ADDRESS = '';
let WALLET_CONTRACT_ADDRESS = '';

export const setContractAddresses = (tokenAddress: string, walletAddress: string) => {
  TOKEN_CONTRACT_ADDRESS = tokenAddress;
  WALLET_CONTRACT_ADDRESS = walletAddress;
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
  const contract = await getTokenContract();
  const balance = await contract.balanceOf(address);
  return balance;
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
