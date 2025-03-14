import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Button from '@/components/atoms/Button';
import './styles.css';

const Home: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [balance, setBalance] = useState<string>('0.00');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  
  useEffect(() => {
    // Simulate fetching balance from the backend
    const timer = setTimeout(() => {
      setBalance('1,234.56');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const connectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setIsConnected(true);
      } else {
        alert('Please install MetaMask to use this feature!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  return (
    <div className="home">
      <div className="home__header">
        <h1 className="home__title">Welcome, {user?.name || 'User'}</h1>
        <p className="home__subtitle">Your financial dashboard</p>
      </div>

      <div className="home__card">
        <div className="home__card-header">
          <h2 className="home__card-title">Account Balance</h2>
        </div>
        <div className="home__card-content">
          <div className="home__balance-box">
            <span className="home__balance-label">Current Balance</span>
            <span className="home__balance-amount">${balance}</span>
          </div>
        </div>
      </div>

      <div className="home__card">
        <div className="home__card-header">
          <h2 className="home__card-title">Blockchain Connection</h2>
        </div>
        <div className="home__card-content">
          {isConnected ? (
            <div className="home__wallet-info">
              <p className="home__wallet-status home__wallet-status--connected">
                Connected to Ethereum
              </p>
              <p className="home__wallet-address">
                Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </p>
            </div>
          ) : (
            <div className="home__wallet-connect">
              <p className="home__wallet-text">Connect your wallet to interact with smart contracts</p>
              <Button onClick={connectWallet} variant="primary" className="btn-gradient">
                Connect Wallet
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
