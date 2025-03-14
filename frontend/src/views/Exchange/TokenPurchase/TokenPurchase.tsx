import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getProvider, getTokenPrice, buyTokens, getTokenBalance } from '../../../services/web3Service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';

const TokenPurchase: React.FC = () => {
  const [ethAmount, setEthAmount] = useState<string>('');
  const [fitAmount, setFitAmount] = useState<string>('0');
  const [rate, setRate] = useState<ethers.BigNumber | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [fitBalance, setFitBalance] = useState<string>('0');

  const wallet = useSelector((state: RootState) => state.wallet);
  const { address, isConnected } = wallet;

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
      fetchExchangeRate();
    }
  }, [isConnected, address]);

  // Calculate FIT amount when ETH amount or rate changes
  useEffect(() => {
    if (ethAmount && rate) {
      // For ethers v6, we need to use different calculation
      const ethAmountBigNumber = ethers.parseEther(ethAmount);
      // Calculate tokens: ETH amount / token price
      const exchangeRate = Number(ethers.formatEther(rate));
      const calculatedTokens = Number(ethAmount) / exchangeRate;
      setFitAmount(calculatedTokens.toString());
    } else {
      setFitAmount('0');
    }
  }, [ethAmount, rate]);

  const fetchExchangeRate = async () => {
    try {
      const price = await getTokenPrice();
      setRate(price);
    } catch (err) {
      console.error("Error fetching exchange rate:", err);
      setError("Failed to fetch exchange rate");
    }
  };

  const fetchBalances = async () => {
    try {
      if (!address) return;
      
      // Get ETH balance
      const provider = getProvider();
      const ethBalance = await provider.getBalance(address);
      setWalletBalance(ethers.formatEther(ethBalance));
      
      // Get FIT balance
      const tokenBalance = await getTokenBalance(address);
      setFitBalance(ethers.formatEther(tokenBalance));
    } catch (err) {
      console.error("Error fetching balances:", err);
    }
  };

  const handlePurchase = async () => {
    if (!ethAmount || Number(ethAmount) <= 0) {
      setError("Please enter a valid ETH amount");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await buyTokens(ethAmount);
      setSuccess(true);
      fetchBalances();
      setEthAmount('');
    } catch (err: any) {
      console.error("Error purchasing tokens:", err);
      setError(err.message || "Failed to purchase tokens");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Purchase FIT Tokens</h2>
        <p className="text-gray-600">Please connect your wallet to purchase tokens.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Purchase FIT Tokens</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Wallet Balance</h3>
          <p className="text-lg font-medium">{parseFloat(walletBalance).toFixed(4)} ETH</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700">FIT Balance</h3>
          <p className="text-lg font-medium">{parseFloat(fitBalance).toFixed(2)} FIT</p>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="ethAmount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount to Spend (ETH)
        </label>
        <input
          id="ethAmount"
          type="number"
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          placeholder="0.00"
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="fitAmount" className="block text-sm font-medium text-gray-700 mb-1">
          FIT Tokens to Receive
        </label>
        <input
          id="fitAmount"
          type="text"
          value={parseFloat(fitAmount).toFixed(6)}
          readOnly
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Current rate: 1 ETH = {rate ? (1 / Number(ethers.formatEther(rate))).toFixed(2) : '...'} FIT
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          Successfully purchased FIT tokens!
        </div>
      )}
      
      <button
        onClick={handlePurchase}
        disabled={loading || !ethAmount}
        className={`w-full py-2 px-4 rounded-md font-medium text-white ${
          loading || !ethAmount ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {loading ? 'Processing...' : 'Purchase FIT Tokens'}
      </button>
    </div>
  );
};

export default TokenPurchase;