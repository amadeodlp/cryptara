import { ethers } from 'ethers';
import { getProvider } from '../web3Service';

export interface Transaction {
  id: string;
  type: string;
  asset?: string;
  assetFrom?: string;
  assetTo?: string;
  amount?: string;
  amountFrom?: string;
  amountTo?: string;
  from?: string;
  to?: string;
  date: string;
  status: string;
  fee?: string;
  txHash?: string;
}

// Fetch transactions from backend API
export const fetchTransactions = async (walletAddress: string): Promise<Transaction[]> => {
  try {
    console.log(`Fetching transactions for ${walletAddress} from backend API...`);
    
    const response = await fetch(`/api/transaction/recent?address=${walletAddress}`);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully retrieved ${data.length} transactions from API`);
    return data;
  } catch (error) {
    console.error('Error fetching transactions from API:', error);
    
    // Try to fetch directly from Etherscan API (could be implemented)
    try {
      return await fetchTransactionsFromEtherscan(walletAddress);
    } catch (etherscanError) {
      console.error('Error fetching from Etherscan:', etherscanError);
      throw error; // Rethrow so the component can handle it
    }
  }
};

// Fetch transactions directly from Etherscan API
const fetchTransactionsFromEtherscan = async (walletAddress: string): Promise<Transaction[]> => {
  // This could be implemented using Etherscan's API if you have an API key
  // For now, just throw to let the component handle with fallback data
  throw new Error('Direct Etherscan fetching not implemented');
};

// Get basic transactions from wallet history
export const getWalletHistory = async (walletAddress: string): Promise<Transaction[]> => {
  try {
    console.log(`Getting wallet history for ${walletAddress} directly from blockchain...`);
    const provider = getProvider();
    
    // Get the recent transaction history
    const history = await provider.getHistory(walletAddress);
    
    if (!history || history.length === 0) {
      console.log('No transaction history found');
      return [];
    }
    
    console.log(`Found ${history.length} transactions in wallet history`);
    
    // Map blockchain transactions to our Transaction interface
    return await Promise.all(history.map(async (tx) => {
      // Get block to get timestamp
      const block = await provider.getBlock(tx.blockHash);
      const timestamp = block ? new Date(Number(block.timestamp) * 1000).toISOString() : new Date().toISOString();
      
      const fromAddress = tx.from.toLowerCase();
      const isReceived = walletAddress.toLowerCase() !== fromAddress;
      
      return {
        id: tx.hash,
        type: isReceived ? 'Received' : 'Sent',
        asset: 'ETH',
        amount: ethers.formatEther(tx.value),
        from: isReceived ? tx.from : undefined,
        to: !isReceived ? tx.to ?? undefined : undefined,
        date: timestamp,
        status: 'Completed',
        fee: tx.gasPrice ? ethers.formatEther(tx.gasPrice * tx.gasLimit) + ' ETH' : undefined,
        txHash: tx.hash
      };
    }));
  } catch (error) {
    console.error('Error getting wallet history:', error);
    throw error;
  }
};

// Mark clearly when using placeholder data
export const getPlaceholderTransactions = (showPlaceholderFlag = true): Transaction[] => {
  console.warn('Using placeholder transaction data!');
  const now = new Date();
  
  // Use the exact same structure as the real transactions
  return [
    {
      id: 't1',
      type: 'Received',
      asset: 'ETH',
      amount: '0.5',
      from: showPlaceholderFlag ? '0x7Be...1a2b (PLACEHOLDER)' : '0x7Be8e9611De3d0D85D5a29C6131c3131Cde1a2b',
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: showPlaceholderFlag ? 'PLACEHOLDER' : 'Completed',
      fee: '0.002 ETH',
      txHash: '0x3a1bda28a5cf9cb3268e52d781de0Nb38162Ge3f'
    },
    {
      id: 't2',
      type: 'Sent',
      asset: 'FIN',
      amount: '150',
      to: showPlaceholderFlag ? '0xAb3...9e (PLACEHOLDER)' : '0xAb3d5e87f1c2bf2c8D8f60e8aAc437f9e',
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: showPlaceholderFlag ? 'PLACEHOLDER' : 'Completed',
      fee: '0.001 ETH',
      txHash: '0x5c2e9a8b1f4d7e6a3b2c1d0e9f8e7d6c5b4a3f2e'
    },
    // You can include the other placeholder transactions here
  ];
};
