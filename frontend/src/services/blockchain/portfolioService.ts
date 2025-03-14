import { ethers } from 'ethers';
import { getProvider, getTokenBalance, getTokenSymbol, getTotalStaked } from '../web3Service';

export interface AssetData {
  name: string;
  symbol: string;
  value: number;
  amount: string;
  color: string;
}

export interface HistoricalValue {
  date: string;
  value: number;
}

export interface PerformanceData {
  name: string;
  return: number;
}

export interface PortfolioData {
  assets: AssetData[];
  historicalValue: HistoricalValue[];
  performance: PerformanceData[];
}

// Get assets for a wallet
export const getWalletAssets = async (walletAddress: string): Promise<AssetData[]> => {
  try {
    console.log(`Fetching assets for ${walletAddress}...`);
    
    // Try the API first
    try {
      const response = await fetch(`/api/wallet/assets?address=${walletAddress}`);
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Transform API response to asset data
        return responseData.map((asset: any) => ({
          name: asset.name,
          symbol: asset.symbol,
          value: parseFloat(asset.value.replace(/,/g, '')),
          amount: asset.amount,
          color: asset.symbol === 'BTC' ? '#F7931A' : 
                 asset.symbol === 'ETH' ? '#627EEA' : 
                 asset.symbol === 'SOL' ? '#00FFA3' : 
                 asset.symbol === 'FIN' ? '#1E88E5' : '#CCCCCC'
        }));
      }
    } catch (error) {
      console.warn('API not available for assets:', error);
    }
    
    // If API fails, get data directly from the blockchain
    console.log('Fetching assets directly from blockchain...');
    const assets: AssetData[] = [];
    
    // 1. Get ETH balance
    try {
      const provider = getProvider();
      const ethBalance = await provider.getBalance(walletAddress);
      const formattedEthBalance = ethers.formatEther(ethBalance);
      const ethValue = parseFloat(formattedEthBalance) * 1800; // Approximate ETH price in USD
      
      if (parseFloat(formattedEthBalance) > 0) {
        assets.push({
          name: 'Ethereum',
          symbol: 'ETH',
          value: ethValue,
          amount: formattedEthBalance,
          color: '#627EEA'
        });
      }
    } catch (error) {
      console.error('Error getting ETH balance:', error);
    }
    
    // 2. Get FIN token balance if available
    try {
      const finBalance = await getTokenBalance(walletAddress);
      const formattedFinBalance = ethers.formatEther(finBalance);
      const finValue = parseFloat(formattedFinBalance) * 1.65; // Approximate FIN price in USD
      
      if (parseFloat(formattedFinBalance) > 0) {
        const symbol = await getTokenSymbol();
        assets.push({
          name: 'Finance Token',
          symbol: symbol || 'FIN',
          value: finValue,
          amount: formattedFinBalance,
          color: '#1E88E5'
        });
      }
    } catch (error) {
      console.error('Error getting FIN balance:', error);
    }
    
    // 3. Get staked tokens if available
    try {
      const stakedAmount = await getTotalStaked(walletAddress);
      const formattedStakedAmount = ethers.formatEther(stakedAmount);
      const stakedValue = parseFloat(formattedStakedAmount) * 1.65; // Approximate FIN price in USD
      
      if (parseFloat(formattedStakedAmount) > 0) {
        assets.push({
          name: 'Staked Finance Token',
          symbol: 'sFIN',
          value: stakedValue,
          amount: formattedStakedAmount,
          color: '#64B5F6'
        });
      }
    } catch (error) {
      console.error('Error getting staked token balance:', error);
    }
    
    return assets;
  } catch (error) {
    console.error('Error getting wallet assets:', error);
    return [];
  }
};

// Get historical portfolio data for a timeframe (1d, 1w, 1m, 3m, 1y, all)
export const getHistoricalValues = async (walletAddress: string, timeframe: string): Promise<HistoricalValue[]> => {
  try {
    // Try to get from API first
    try {
      const historyResponse = await fetch(`/api/portfolio/history?address=${walletAddress}&timeframe=${timeframe}`);
      
      if (historyResponse.ok) {
        return await historyResponse.json();
      }
    } catch (error) {
      console.warn('API not available for historical data:', error);
    }
    
    // Fall back to generating simulated data
    console.log('Generating simulated historical data...');
    return generateHistoricalData(timeframe);
  } catch (error) {
    console.error('Error getting historical values:', error);
    return generateHistoricalData(timeframe);
  }
};

// Get performance data for assets
export const getPerformanceData = async (walletAddress: string, assets: AssetData[]): Promise<PerformanceData[]> => {
  try {
    // Try to get from API first
    try {
      const performanceResponse = await fetch(`/api/portfolio/performance?address=${walletAddress}`);
      
      if (performanceResponse.ok) {
        return await performanceResponse.json();
      }
    } catch (error) {
      console.warn('API not available for performance data:', error);
    }
    
    // Generate performance data based on assets
    return assets.map(asset => ({
      name: asset.name,
      return: asset.symbol === 'FIN' ? 12.5 :
             asset.symbol === 'sFIN' ? 20.3 :
             asset.symbol === 'ETH' ? 8.7 :
             asset.symbol === 'BTC' ? 5.2 :
             asset.symbol === 'SOL' ? -2.1 : 0
    }));
  } catch (error) {
    console.error('Error getting performance data:', error);
    return [];
  }
};

// Helper function to generate mock historical data based on timeframe
function generateHistoricalData(timeframe: string): HistoricalValue[] {
  const now = new Date();
  const data: HistoricalValue[] = [];
  let days: number;
  
  switch (timeframe) {
    case '1d':
      days = 1;
      break;
    case '1w':
      days = 7;
      break;
    case '1m':
      days = 30;
      break;
    case '3m':
      days = 90;
      break;
    case '1y':
      days = 365;
      break;
    case 'all':
      days = 730; // 2 years
      break;
    default:
      days = 30;
  }
  
  let baseValue = 25000;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some randomness to the value
    const randomFactor = 0.98 + (Math.random() * 0.04); // ±2%
    baseValue *= randomFactor;
    
    // Add a slight upward trend
    baseValue *= 1.001;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(baseValue * 100) / 100
    });
  }
  
  return data;
}

// Get complete portfolio data
export const getPortfolioData = async (walletAddress: string, timeframe: string): Promise<PortfolioData> => {
  try {
    console.log(`Getting portfolio data for ${walletAddress} with timeframe ${timeframe}...`);
    
    // 1. Get assets
    const assets = await getWalletAssets(walletAddress);
    console.log(`Found ${assets.length} assets`);
    
    // 2. Get historical data
    const historicalData = await getHistoricalValues(walletAddress, timeframe);
    console.log(`Generated ${historicalData.length} historical data points`);
    
    // 3. Get performance data
    const performanceData = await getPerformanceData(walletAddress, assets);
    console.log(`Generated ${performanceData.length} performance metrics`);
    
    return {
      assets,
      historicalValue: historicalData,
      performance: performanceData
    };
  } catch (error) {
    console.error('Error getting portfolio data:', error);
    
    // Return empty data if all else fails
    return {
      assets: [],
      historicalValue: [],
      performance: []
    };
  }
};
