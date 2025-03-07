import { useState, useEffect, useCallback } from 'react';
import * as web3Service from '@/services/web3Service';
import { ethers } from 'ethers';

interface UseWalletReturn {
  isConnected: boolean;
  address: string;
  balance: string;
  walletBalance: string;
  tokenSymbol: string;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  approveAndDeposit: (amount: string) => Promise<void>;
  withdrawTokens: (amount: string) => Promise<void>;
}

export const useWallet = (): UseWalletReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userAddress = await web3Service.connectWallet();
      setAddress(userAddress);
      setIsConnected(true);
      await refreshBalance();
    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh balances
  const refreshBalance = useCallback(async () => {
    if (!isConnected || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get token symbol
      const symbol = await web3Service.getTokenSymbol();
      setTokenSymbol(symbol);

      // Get token balance
      const tokenBalance = await web3Service.getTokenBalance(address);
      setBalance(ethers.formatUnits(tokenBalance, 18));

      // Get wallet balance
      const wBalance = await web3Service.getWalletBalance(address);
      setWalletBalance(ethers.formatUnits(wBalance, 18));
    } catch (err) {
      setError('Failed to fetch balances');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  // Approve and deposit tokens
  const approveAndDeposit = useCallback(async (amount: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // First approve
      await web3Service.approveTokens(amount);
      
      // Then deposit
      await web3Service.depositTokens(amount);
      
      // Refresh balances
      await refreshBalance();
    } catch (err) {
      setError('Failed to deposit tokens');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalance]);

  // Withdraw tokens
  const withdrawTokens = useCallback(async (amount: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await web3Service.withdrawTokens(amount);
      await refreshBalance();
    } catch (err) {
      setError('Failed to withdraw tokens');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalance]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (web3Service.isMetaMaskInstalled() && window.ethereum.selectedAddress) {
          setAddress(window.ethereum.selectedAddress);
          setIsConnected(true);
          await refreshBalance();
        }
      } catch (err) {
        console.error('Error checking wallet connection', err);
      }
    };

    checkConnection();
  }, [refreshBalance]);

  return {
    isConnected,
    address,
    balance,
    walletBalance,
    tokenSymbol,
    isLoading,
    error,
    connectWallet,
    refreshBalance,
    approveAndDeposit,
    withdrawTokens,
  };
};
