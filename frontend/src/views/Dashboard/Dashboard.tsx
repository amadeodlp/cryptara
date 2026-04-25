import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/redux/store';
import PortfolioAnalytics from '@/components/PortfolioAnalytics';
import { isMetaMaskInstalled, connectWallet as connectMetaMask, getTokenBalance, getWalletBalance } from '@/services/web3Service';
import { ethers } from 'ethers';
import './styles.css';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [totalBalance, setTotalBalance] = useState<string>('0.00');
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [assets, setAssets] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [marketOverview, setMarketOverview] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        const connected = isMetaMaskInstalled() && localStorage.getItem('walletConnected') === 'true';
        const address = localStorage.getItem('walletAddress') || '';
        setIsWalletConnected(connected);
        setWalletAddress(address);
        
        if (connected && address) {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const ethBalance = await provider.getBalance(address);
            const formattedEthBalance = ethers.formatEther(ethBalance);
            const ethUsdValue = parseFloat(formattedEthBalance) * 1800;
            
            let finUsdValue = 0;
            let formattedFinBalance = "0";
            try {
              const finBalance = await getTokenBalance(address);
              formattedFinBalance = ethers.formatEther(finBalance);
              finUsdValue = parseFloat(formattedFinBalance) * 1.65;
            } catch (finError) {
              console.error('Error getting FIN token balance:', finError);
            }
            
            let stakedUsdValue = 0;
            let formattedStakedAmount = "0";
            try {
              const stakedAmount = await getWalletBalance(address);
              formattedStakedAmount = ethers.formatEther(stakedAmount);
              stakedUsdValue = parseFloat(formattedStakedAmount) * 1.65;
            } catch (stakingError) {
              console.error('Error getting staked token balance:', stakingError);
            }
            
            const totalUsdValue = ethUsdValue + finUsdValue + stakedUsdValue;
            setTotalBalance(totalUsdValue.toLocaleString('en-US', { maximumFractionDigits: 2 }));
            setDataSource('Sepolia Network');
            
            const userAssets = [];
            
            if (parseFloat(formattedEthBalance) > 0) {
              userAssets.push({ 
                id: 'eth', 
                name: 'Ethereum', 
                symbol: 'ETH', 
                amount: parseFloat(formattedEthBalance).toLocaleString('en-US', { maximumFractionDigits: 6 }), 
                value: ethUsdValue.toLocaleString('en-US', { maximumFractionDigits: 2 }), 
                change: '+5.2', 
                logo: '🔷' 
              });
            }
            
            if (parseFloat(formattedFinBalance) > 0) {
              userAssets.push({ 
                id: 'fin', 
                name: 'Finance Token', 
                symbol: 'FIN', 
                amount: parseFloat(formattedFinBalance).toLocaleString('en-US', { maximumFractionDigits: 6 }),
                value: finUsdValue.toLocaleString('en-US', { maximumFractionDigits: 2 }),
                change: '+12.5', 
                logo: '🪙' 
              });
            }
            
            if (parseFloat(formattedStakedAmount) > 0) {
              userAssets.push({ 
                id: 'staked-fin', 
                name: 'Staked Finance Token', 
                symbol: 'sFIN', 
                amount: parseFloat(formattedStakedAmount).toLocaleString('en-US', { maximumFractionDigits: 6 }),
                value: stakedUsdValue.toLocaleString('en-US', { maximumFractionDigits: 2 }),
                change: '+20.3', 
                logo: '💹' 
              });
            }
            
            if (userAssets.length > 0) {
              setAssets(userAssets);
            } else {
              try {
                const response = await fetch(`/api/wallet/assets?address=${address}`);
                if (response.ok) {
                  const assetsData = await response.json();
                  setAssets(assetsData);
                }
              } catch (error) {
                console.error('Error fetching assets from API:', error);
              }
            }
            
            try {
              const txResponse = await fetch(`/api/transaction/recent?address=${address}`);
              if (txResponse.ok) {
                const txData = await txResponse.json();
                setRecentTransactions(txData);
              } else {
                setRecentTransactions([]);
              }
            } catch (error) {
              console.error('Error fetching transactions:', error);
              setRecentTransactions([]);
            }
          } catch (error) {
            console.error('Error loading blockchain data:', error);
            setTotalBalance('0.00');
            setAssets([]);
          }
        } else {
          setTotalBalance('0.00');
          setAssets([]);
          setRecentTransactions([]);
        }
        
        try {
          const marketResponse = await fetch('/api/pricefeed/bulk?symbols=BTC,ETH,BNB,SOL,ADA');
          if (marketResponse.ok) {
            const marketData = await marketResponse.json();
            setMarketOverview(marketData.map((token: any) => ({
              id: token.symbol.toLowerCase(),
              name: token.name,
              symbol: token.symbol,
              price: token.price.toLocaleString('en-US', { maximumFractionDigits: 2 }),
              change: token.percentChange24h >= 0 ? `+${token.percentChange24h.toFixed(1)}` : token.percentChange24h.toFixed(1)
            })));
          } else {
            setMarketOverview([
              { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: '62,485.20', change: '+2.8' },
              { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: '3,805.62', change: '+5.2' },
              { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', price: '705.38', change: '+1.5' },
              { id: 'sol', name: 'Solana', symbol: 'SOL', price: '107.52', change: '-1.3' },
              { id: 'ada', name: 'Cardano', symbol: 'ADA', price: '0.92', change: '-0.7' }
            ]);
          }
        } catch (error) {
          console.error('Error fetching market data:', error);
          setMarketOverview([
            { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: '62,485.20', change: '+2.8' },
            { id: 'eth', name: 'Ethereum', symbol: 'ETH', price: '3,805.62', change: '+5.2' },
            { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', price: '705.38', change: '+1.5' },
            { id: 'sol', name: 'Solana', symbol: 'SOL', price: '107.52', change: '-1.3' },
            { id: 'ada', name: 'Cardano', symbol: 'ADA', price: '0.92', change: '-0.7' }
          ]);
        }
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const connectWallet = async () => {
    try {
      const address = await connectMetaMask();
      setWalletAddress(address);
      setIsWalletConnected(true);
      window.location.reload();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Could not connect to wallet. Please make sure MetaMask is installed and try again.');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard">
      {isLoading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner-large"></div>
          <p>Loading your financial data...</p>
        </div>
      ) : (
        <>
          <div className="dashboard-header">
            <h1 className="dashboard-title">Welcome, {user?.name || 'User'}</h1>
            <p className="dashboard-subtitle">Here's your financial overview for today</p>
          </div>
          
          <div className="dashboard-wallet-status">
            {isWalletConnected ? (
              <div className="wallet-connected glass-card">
                <div className="wallet-info">
                  <div className="wallet-status-icon connected"></div>
                  <div className="wallet-address">
                    <span>Wallet Connected:</span> 
                    <span className="address">{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</span>
                    {dataSource && (
                      <span className="data-source">Data from: {dataSource}</span>
                    )}
                  </div>
                </div>
                <div className="wallet-balance">
                  <span className="balance-label">Total Balance</span>
                  <span className="balance-amount">${totalBalance}</span>
                </div>
              </div>
            ) : (
              <div className="wallet-not-connected glass-card">
                <div className="wallet-message">
                  <div className="wallet-status-icon not-connected"></div>
                  <h3>Wallet Not Connected</h3>
                  <p>Connect your wallet to access all features</p>
                </div>
                <button className="btn-gradient" onClick={connectWallet}>Connect Wallet</button>
              </div>
            )}
          </div>
          
          <div className="dashboard-grid">
            <div className="portfolio-section glass-card">
              <div className="section-header">
                <h2>Your Portfolio</h2>
                <button className="btn-secondary" onClick={() => navigate('/portfolio')}>View All</button>
              </div>
              
              <div className="assets-list">
                {assets.length > 0 ? (
                  assets.map(asset => (
                    <div key={asset.id} className="asset-item">
                      <div className="asset-logo">{asset.logo}</div>
                      <div className="asset-details">
                        <div className="asset-name">{asset.name}</div>
                        <div className="asset-amount">{asset.amount} {asset.symbol}</div>
                      </div>
                      <div className="asset-value">
                        <div className="value-usd">${asset.value}</div>
                        <div className={`value-change ${parseFloat(asset.change) >= 0 ? 'positive' : 'negative'}`}>
                          {asset.change}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-assets-message">
                    <p>No assets found in your wallet</p>
                  </div>
                )}
              </div>
              
              <div className="portfolio-actions">
                <button className="action-button" onClick={() => navigate('/transactions')}>
                  <span className="action-icon">↑</span>
                  <span>Send</span>
                </button>
                <button className="action-button" onClick={() => navigate('/transactions')}>
                  <span className="action-icon">↓</span>
                  <span>Receive</span>
                </button>
                <button className="action-button" onClick={() => navigate('/exchange')}>
                  <span className="action-icon">⇄</span>
                  <span>Swap</span>
                </button>
                <button className="action-button" onClick={() => navigate('/exchange')}>
                  <span className="action-icon">+</span>
                  <span>Buy</span>
                </button>
              </div>
            </div>
            
            <div className="transactions-section glass-card">
              <div className="section-header">
                <h2>Recent Transactions</h2>
                <button className="btn-secondary" onClick={() => navigate('/transactions')}>View All</button>
              </div>
              
              <div className="transactions-list">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map(tx => (
                    <div key={tx.id} className="transaction-item">
                      <div className={`transaction-icon ${tx.type.toLowerCase()}`}></div>
                      <div className="transaction-details">
                        <div className="transaction-title">
                          {tx.type === 'Swap' 
                            ? `Swap ${tx.amountFrom} ${tx.assetFrom} for ${tx.amountTo} ${tx.assetTo}`
                            : `${tx.type} ${tx.amount} ${tx.asset}`
                          }
                        </div>
                        <div className="transaction-subtitle">
                          {tx.type === 'Received' && `From: ${tx.from}`}
                          {tx.type === 'Sent' && `To: ${tx.to}`}
                          {tx.type === 'Deposit' && `From: ${tx.from}`}
                          {tx.type === 'Swap' && 'Decentralized Exchange'}
                        </div>
                      </div>
                      <div className="transaction-meta">
                        <div className="transaction-date">{formatDate(tx.date)}</div>
                        <div className={`transaction-status ${tx.status.toLowerCase()}`}>{tx.status}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-transactions-message">
                    <p>No recent transactions found</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="market-section glass-card">
              <div className="section-header">
                <h2>Market Overview</h2>
                <button className="btn-secondary" onClick={() => navigate('/exchange')}>View Market</button>
              </div>
              
              <div className="market-list">
                {marketOverview.map(coin => (
                  <div key={coin.id} className="market-item">
                    <div className="market-name">
                      <span className="market-symbol">{coin.symbol}</span>
                      <span>{coin.name}</span>
                    </div>
                    <div className="market-price">
                      <div className="price-usd">${coin.price}</div>
                      <div className={`price-change ${parseFloat(coin.change) >= 0 ? 'positive' : 'negative'}`}>
                        {coin.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <PortfolioAnalytics timeframe="1m" />
            
            <div className="quick-actions-section glass-card">
              <h2>Quick Actions</h2>
              <div className="quick-actions-grid">
                <div className="quick-action-card" onClick={() => navigate('/exchange')}>
                  <div className="action-icon deposit">💰</div>
                  <div className="action-label">Deposit</div>
                </div>
                <div className="quick-action-card" onClick={() => navigate('/exchange')}>
                  <div className="action-icon withdraw">💸</div>
                  <div className="action-label">Withdraw</div>
                </div>
                <div className="quick-action-card" onClick={() => navigate('/staking')}>
                  <div className="action-icon stake">🔒</div>
                  <div className="action-label">Stake</div>
                </div>
                <div className="quick-action-card" onClick={() => navigate('/exchange')}>
                  <div className="action-icon borrow">🏦</div>
                  <div className="action-label">Borrow</div>
                </div>
                <div className="quick-action-card" onClick={() => navigate('/staking')}>
                  <div className="action-icon earn">💎</div>
                  <div className="action-label">Earn</div>
                </div>
                <div className="quick-action-card" onClick={() => navigate('/transactions')}>
                  <div className="action-icon history">📜</div>
                  <div className="action-label">History</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
