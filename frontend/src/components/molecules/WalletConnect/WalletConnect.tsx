import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { setWallet, disconnectWallet } from '../../../redux/slices/walletSlice';
import { connectWallet, isMetaMaskInstalled, getProvider } from '../../../services/web3Service';
import './styles.css';

const WalletConnect: React.FC = () => {
  const dispatch = useDispatch();
  const { address, isConnected } = useSelector((state: RootState) => state.wallet);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (isConnected && address) {
        // Already connected based on localStorage, verify connection
        try {
          // Check if MetaMask is still connected
          if (isMetaMaskInstalled()) {
            const provider = getProvider();
            const accounts = await provider.listAccounts();
            
            if (accounts.length === 0) {
              // MetaMask is disconnected, update state
              dispatch(disconnectWallet());
            } else if (accounts[0].toLowerCase() !== address.toLowerCase()) {
              // Account changed, update state
              const network = await provider.getNetwork();
              dispatch(setWallet({ 
                address: accounts[0], 
                chainId: network.chainId.toString() 
              }));
            }
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          dispatch(disconnectWallet());
        } else {
          handleConnect();
        }
      });

      window.ethereum.on('chainChanged', () => {
        // Refresh when chain changes
        handleConnect();
      });
    }

    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [dispatch, isConnected, address]);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isMetaMaskInstalled()) {
        setError('MetaMask is not installed. Please install MetaMask to connect your wallet.');
        return;
      }

      const address = await connectWallet();
      const provider = getProvider();
      const network = await provider.getNetwork();
      
      dispatch(setWallet({ 
        address, 
        chainId: network.chainId.toString() 
      }));
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    dispatch(disconnectWallet());
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="wallet-connect">
      {isConnected && address ? (
        <div className="wallet-connected">
          <span className="wallet-address" title={address}>
            {formatAddress(address)}
          </span>
          <button 
            className="disconnect-button"
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          className="connect-button"
          onClick={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      
      {error && <div className="wallet-error">{error}</div>}
    </div>
  );
};

export default WalletConnect;