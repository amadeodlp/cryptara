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

// Get assets directly from blockchain
export const getWalletAssets = async (walletAddress: string): Promise<AssetData[]> => {
  const assets: AssetData[] = [];

  try {
    const provider = getProvider();
    const ethBalance = await provider.getBalance(walletAddress);
    const formattedEth = ethers.formatEther(ethBalance);
    const ethValue = parseFloat(formattedEth) * 1800;
    if (parseFloat(formattedEth) > 0) {
      assets.push({ name: 'Ethereum', symbol: 'ETH', value: ethValue, amount: formattedEth, color: '#627EEA' });
    }
  } catch (e) {
    console.error('ETH balance error:', e);
  }

  try {
    const finBalance = await getTokenBalance(walletAddress);
    const formattedFin = ethers.formatEther(finBalance);
    const finValue = parseFloat(formattedFin) * 1.65;
    if (parseFloat(formattedFin) > 0) {
      const symbol = await getTokenSymbol();
      assets.push({ name: 'Finance Token', symbol: symbol || 'FIN', value: finValue, amount: formattedFin, color: '#1E88E5' });
    }
  } catch (e) {
    console.error('FIN balance error:', e);
  }

  try {
    const staked = await getTotalStaked(walletAddress);
    const formattedStaked = ethers.formatEther(staked);
    const stakedValue = parseFloat(formattedStaked) * 1.65;
    if (parseFloat(formattedStaked) > 0) {
      assets.push({ name: 'Staked Finance Token', symbol: 'sFIN', value: stakedValue, amount: formattedStaked, color: '#64B5F6' });
    }
  } catch (e) {
    console.error('Staked balance error:', e);
  }

  return assets;
};

// Get historical portfolio data — generated client-side (no backend needed)
export const getHistoricalValues = async (_walletAddress: string, timeframe: string): Promise<HistoricalValue[]> => {
  return generateHistoricalData(timeframe);
};

// Get performance data for assets
export const getPerformanceData = async (_walletAddress: string, assets: AssetData[]): Promise<PerformanceData[]> => {
  return assets.map(asset => ({
    name: asset.name,
    return: asset.symbol === 'FIN' ? 12.5 :
            asset.symbol === 'sFIN' ? 20.3 :
            asset.symbol === 'ETH' ? 8.7 :
            asset.symbol === 'BTC' ? 5.2 :
            asset.symbol === 'SOL' ? -2.1 : 0,
  }));
};

function generateHistoricalData(timeframe: string): HistoricalValue[] {
  const now = new Date();
  const daysMap: Record<string, number> = { '1d': 1, '1w': 7, '1m': 30, '3m': 90, '1y': 365, 'all': 730 };
  const days = daysMap[timeframe] ?? 30;
  const data: HistoricalValue[] = [];
  let baseValue = 25000;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const randomFactor = 0.98 + (Math.random() * 0.04);
    baseValue *= randomFactor * 1.001;
    data.push({ date: date.toISOString().split('T')[0], value: Math.round(baseValue * 100) / 100 });
  }

  return data;
}

export const getPortfolioData = async (walletAddress: string, timeframe: string): Promise<PortfolioData> => {
  try {
    const assets = await getWalletAssets(walletAddress);
    const historicalValue = await getHistoricalValues(walletAddress, timeframe);
    const performance = await getPerformanceData(walletAddress, assets);
    return { assets, historicalValue, performance };
  } catch (error) {
    console.error('Error getting portfolio data:', error);
    return { assets: [], historicalValue: [], performance: [] };
  }
};
