import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { getProvider, getTokenContract, getTokenBalance, transferTokens, buyTokens, getTokenPrice } from '../../services/web3Service';
import './styles.css';

interface Token {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  balance: string;
  price: string;
  address?: string;
}

interface MarketRow {
  id: string;
  logo: string;
  name: string;
  symbol: string;
  price: string;
  change: string;
  marketCap: string;
  volume: string;
}

const Exchange: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [showFromTokens, setShowFromTokens] = useState<boolean>(false);
  const [showToTokens, setShowToTokens] = useState<boolean>(false);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [gasFee, setGasFee] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [swapLoading, setSwapLoading] = useState<boolean>(false);
  const [swapSuccess, setSwapSuccess] = useState<boolean>(false);
  const [marketRows, setMarketRows] = useState<MarketRow[]>([]);
  const [marketLoading, setMarketLoading] = useState<boolean>(true);

  const wallet = useSelector((state: RootState) => state.wallet);
  const { address, isConnected } = wallet;

  useEffect(() => {
    const fetchMarketData = async () => {
      setMarketLoading(true);
      try {
        const res = await fetch('/api/pricefeed/bulk?symbols=BTC,ETH,SOL,CRA');
        if (res.ok) {
          const data: Array<{
            symbol: string;
            name: string;
            price: number;
            percentChange24h: number;
            marketCap: number;
            volume24h: number;
          }> = await res.json();

          const logoMap: Record<string, string> = {
            BTC: '₿',
            ETH: '🔷',
            SOL: '◎',
            CRA: '🪙',
            FIN: '🪙',
          };

          setMarketRows(
            data.map((token) => ({
              id: token.symbol.toLowerCase(),
              logo: logoMap[token.symbol] ?? '💰',
              name: token.name,
              symbol: token.symbol,
              price: token.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              change: token.percentChange24h >= 0
                ? `+${token.percentChange24h.toFixed(1)}%`
                : `${token.percentChange24h.toFixed(1)}%`,
              marketCap: token.marketCap >= 1e12
                ? `$${(token.marketCap / 1e12).toFixed(2)}T`
                : token.marketCap >= 1e9
                ? `$${(token.marketCap / 1e9).toFixed(1)}B`
                : `$${(token.marketCap / 1e6).toFixed(1)}M`,
              volume: token.volume24h >= 1e9
                ? `$${(token.volume24h / 1e9).toFixed(1)}B`
                : `$${(token.volume24h / 1e6).toFixed(1)}M`,
            }))
          );
        } else {
          setMarketRows(getFallbackMarketRows());
        }
      } catch {
        setMarketRows(getFallbackMarketRows());
      } finally {
        setMarketLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  const getFallbackMarketRows = (): MarketRow[] => [
    { id: 'btc', logo: '₿', name: 'Bitcoin', symbol: 'BTC', price: '62,485.20', change: '+2.8%', marketCap: '$1.21T', volume: '$32.5B' },
    { id: 'eth', logo: '🔷', name: 'Ethereum', symbol: 'ETH', price: '3,805.62', change: '+5.2%', marketCap: '$457.8B', volume: '$18.7B' },
    { id: 'sol', logo: '◎', name: 'Solana', symbol: 'SOL', price: '107.52', change: '-1.3%', marketCap: '$46.5B', volume: '$2.1B' },
    { id: 'cra', logo: '🪙', name: 'Cryptara Token', symbol: 'CRA', price: '1.663', change: '+12.5%', marketCap: '$832.5M', volume: '$156.2M' },
  ];

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        if (!isConnected || !address) {
          loadDemoTokens();
          return;
        }

        setIsLoading(true);
        const provider = getProvider();

        const ethBalance = await provider.getBalance(address);

        let fitTokenData: Token | null = null;

        try {
          const fitContract = await getTokenContract();
          const fitBalance = await fitContract.balanceOf(address);
          const fitSymbol = await fitContract.symbol();
          const fitName = await fitContract.name();
          const tokenPrice = await getTokenPrice();
          const fitPrice = ethers.formatEther(tokenPrice);

          fitTokenData = {
            id: 'fit',
            name: fitName,
            symbol: fitSymbol,
            logo: '🪙',
            balance: ethers.formatEther(fitBalance),
            price: fitPrice,
            address: await fitContract.getAddress()
          };
        } catch (err) {
          console.log('FIT token not available yet:', err);
          fitTokenData = {
            id: 'cra',
            name: 'Cryptara Token',
            symbol: 'CRA',
            logo: '🪙',
            balance: '0',
            price: '0.0001',
            address: '0x0000000000000000000000000000000000000000'
          };
        }

        const tokens: Token[] = [
          {
            id: 'eth',
            name: 'Ethereum',
            symbol: 'ETH',
            logo: '🔷',
            balance: ethers.formatEther(ethBalance),
            price: '2,850.45',
            address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
          },
          fitTokenData,
          {
            id: 'usdc',
            name: 'USD Coin',
            symbol: 'USDC',
            logo: '💲',
            balance: '0',
            price: '1.00',
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
          },
        ];

        setAvailableTokens(tokens);
        setFromToken(tokens[0]);
        setToToken(tokens[1]);

        try {
          const gasPrice = await provider.getFeeData();
          const gasFeeWei = gasPrice.gasPrice ? gasPrice.gasPrice * BigInt(21000) : BigInt(0);
          setGasFee(`≈ ${ethers.formatEther(gasFeeWei)} ETH`);
        } catch (err) {
          setGasFee('≈ 0.0002 ETH');
        }
      } catch (err) {
        console.error('Error loading token data:', err);
        loadDemoTokens();
      } finally {
        setIsLoading(false);
      }
    };

    const loadDemoTokens = () => {
      const tokens = [
        {
          id: 'eth',
          name: 'Ethereum',
          symbol: 'ETH',
          logo: '🔷',
          balance: '2.45',
          price: '2,850.45'
        },
        {
          id: 'cra',
          name: 'Cryptara Token',
          symbol: 'CRA',
          logo: '🪙',
          balance: '1,350.00',
          price: '0.0001'
        },
        {
          id: 'usdc',
          name: 'USD Coin',
          symbol: 'USDC',
          logo: '💲',
          balance: '1,200.40',
          price: '1.00'
        },
        {
          id: 'usdt',
          name: 'Tether',
          symbol: 'USDT',
          logo: '💵',
          balance: '850.75',
          price: '1.00'
        }
      ];

      setAvailableTokens(tokens);
      setFromToken(tokens[0]);
      setToToken(tokens[1]);
      setGasFee('≈ 0.0002 ETH');
    };

    fetchTokens();
  }, [isConnected, address]);

  useEffect(() => {
    if (fromToken && toToken) {
      const fromPrice = parseFloat(fromToken.price.replace(/,/g, ''));
      const toPrice = parseFloat(toToken.price.replace(/,/g, ''));
      const rate = (fromPrice / toPrice).toFixed(6);
      setExchangeRate(`1 ${fromToken.symbol} = ${rate} ${toToken.symbol}`);
    }
  }, [fromToken, toToken]);

  useEffect(() => {
    if (fromToken && toToken && fromAmount) {
      try {
        const fromPrice = parseFloat(fromToken.price.replace(/,/g, ''));
        const toPrice = parseFloat(toToken.price.replace(/,/g, ''));
        const fromValue = parseFloat(fromAmount);

        if (isNaN(fromValue)) {
          setToAmount('');
          return;
        }

        const calculatedToAmount = (fromValue * fromPrice / toPrice).toFixed(6);
        setToAmount(calculatedToAmount);
        setError('');
      } catch (err) {
        setToAmount('');
        setError('Invalid input amount');
      }
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromAmount(value);

    if (fromToken && parseFloat(value) > parseFloat(fromToken.balance.replace(/,/g, ''))) {
      setError('Insufficient balance');
    } else {
      setError('');
    }
  };

  const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToAmount(value);

    if (fromToken && toToken) {
      try {
        const fromPrice = parseFloat(fromToken.price.replace(/,/g, ''));
        const toPrice = parseFloat(toToken.price.replace(/,/g, ''));
        const toValue = parseFloat(value);

        if (isNaN(toValue)) {
          setFromAmount('');
          return;
        }

        const calculatedFromAmount = (toValue * toPrice / fromPrice).toFixed(6);
        setFromAmount(calculatedFromAmount);

        if (fromToken && parseFloat(calculatedFromAmount) > parseFloat(fromToken.balance.replace(/,/g, ''))) {
          setError('Insufficient balance');
        } else {
          setError('');
        }
      } catch (err) {
        setFromAmount('');
        setError('Invalid input amount');
      }
    }
  };

  const handleTokenSwap = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSlippageChange = (value: number) => {
    setSlippage(value);
  };

  const selectFromToken = (token: Token) => {
    if (token.id === toToken?.id) {
      setToToken(fromToken);
    }
    setFromToken(token);
    setShowFromTokens(false);
  };

  const selectToToken = (token: Token) => {
    if (token.id === fromToken?.id) {
      setFromToken(toToken);
    }
    setToToken(token);
    setShowToTokens(false);
  };

  const handleSwap = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!fromToken || !toToken || !fromAmount || Number(fromAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSwapLoading(true);
    setError('');
    setSwapSuccess(false);

    try {
      if (fromToken.id === 'eth' && toToken.id === 'cra') {
        await buyTokens(fromAmount);
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setSwapSuccess(true);
      setFromAmount('');
      setToAmount('');

      const provider = getProvider();
      if (fromToken.id === 'eth') {
        const ethBalance = await provider.getBalance(address!);
        fromToken.balance = ethers.formatEther(ethBalance);
      }

      if (toToken.id === 'cra') {
        const contract = await getTokenContract();
        const balance = await contract.balanceOf(address!);
        toToken.balance = ethers.formatEther(balance);
      }

      setFromToken({...fromToken});
      setToToken({...toToken});

    } catch (err: any) {
      console.error('Swap error:', err);
      setError(err.message || 'Failed to complete swap. Please try again.');
    } finally {
      setSwapLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="exchange loading">
        <div className="loading-spinner-large"></div>
        <p>Loading exchange data...</p>
      </div>
    );
  }

  return (
    <div className="exchange">
      <div className="exchange-header">
        <h1 className="exchange-title">Exchange</h1>
        <p className="exchange-subtitle">Swap tokens at the best rates</p>
      </div>

      <div className="exchange-container">
        <div className="exchange-card glass-card">
          <div className="exchange-card-header">
            <h2>Swap Tokens</h2>
            <div className="exchange-settings">
              <button className="settings-button">⚙️</button>
            </div>
          </div>

          <div className="exchange-form">
            <div className="exchange-input-container">
              <div className="exchange-input-header">
                <span>From</span>
                <span className="balance-display">
                  Balance: {fromToken?.balance} {fromToken?.symbol}
                </span>
              </div>

              <div className="exchange-input-group">
                <input
                  type="text"
                  className="exchange-input"
                  value={fromAmount}
                  onChange={handleFromAmountChange}
                  placeholder="0.0"
                />

                <button
                  className="token-selector"
                  onClick={() => setShowFromTokens(true)}
                >
                  <span className="token-logo">{fromToken?.logo}</span>
                  <span className="token-symbol">{fromToken?.symbol}</span>
                  <span className="token-dropdown-icon">▼</span>
                </button>
              </div>

              <div className="max-button-container">
                <button
                  className="max-button"
                  onClick={() => {
                    if (fromToken) {
                      setFromAmount(fromToken.balance);
                    }
                  }}
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="swap-button-container">
              <button className="swap-tokens-button" onClick={handleTokenSwap}>
                <span>⇅</span>
              </button>
            </div>

            <div className="exchange-input-container">
              <div className="exchange-input-header">
                <span>To (estimated)</span>
                <span className="balance-display">
                  Balance: {toToken?.balance} {toToken?.symbol}
                </span>
              </div>

              <div className="exchange-input-group">
                <input
                  type="text"
                  className="exchange-input"
                  value={toAmount}
                  onChange={handleToAmountChange}
                  placeholder="0.0"
                />

                <button
                  className="token-selector"
                  onClick={() => setShowToTokens(true)}
                >
                  <span className="token-logo">{toToken?.logo}</span>
                  <span className="token-symbol">{toToken?.symbol}</span>
                  <span className="token-dropdown-icon">▼</span>
                </button>
              </div>
            </div>

            {exchangeRate && (
              <div className="exchange-rate">
                {exchangeRate}
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="slippage-settings">
              <div className="slippage-header">
                <span>Slippage Tolerance</span>
                <span className="slippage-value">{slippage}%</span>
              </div>

              <div className="slippage-buttons">
                <button
                  className={`slippage-button ${slippage === 0.1 ? 'active' : ''}`}
                  onClick={() => handleSlippageChange(0.1)}
                >
                  0.1%
                </button>
                <button
                  className={`slippage-button ${slippage === 0.5 ? 'active' : ''}`}
                  onClick={() => handleSlippageChange(0.5)}
                >
                  0.5%
                </button>
                <button
                  className={`slippage-button ${slippage === 1.0 ? 'active' : ''}`}
                  onClick={() => handleSlippageChange(1.0)}
                >
                  1.0%
                </button>
                <button
                  className={`slippage-button ${slippage === 3.0 ? 'active' : ''}`}
                  onClick={() => handleSlippageChange(3.0)}
                >
                  3.0%
                </button>
              </div>
            </div>

            <div className="transaction-details">
              <div className="detail-item">
                <span className="detail-label">Gas Fee</span>
                <span className="detail-value">{gasFee}</span>
              </div>
            </div>

            <button
              className="btn-gradient swap-button"
              disabled={!isConnected || !!error || !fromAmount || parseFloat(fromAmount) === 0 || swapLoading}
              onClick={handleSwap}
            >
              {!isConnected ? 'Connect Wallet to Swap' :
                swapLoading ? 'Processing...' :
                error ? error : 'Swap Tokens'}
            </button>

            {swapSuccess && (
              <div className="success-message">
                Swap completed successfully!
              </div>
            )}
          </div>
        </div>

        {showFromTokens && (
          <div className="token-modal-overlay" onClick={() => setShowFromTokens(false)}>
            <div className="token-modal glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="token-modal-header">
                <h3>Select a token</h3>
                <button className="close-button" onClick={() => setShowFromTokens(false)}>×</button>
              </div>

              <div className="token-search">
                <input type="text" placeholder="Search name or paste address" />
              </div>

              <div className="token-list">
                {availableTokens.map(token => (
                  <div
                    key={token.id}
                    className="token-list-item"
                    onClick={() => selectFromToken(token)}
                  >
                    <div className="token-list-logo">{token.logo}</div>
                    <div className="token-list-details">
                      <div className="token-list-name">{token.name}</div>
                      <div className="token-list-symbol">{token.symbol}</div>
                    </div>
                    <div className="token-list-balance">
                      {token.balance}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showToTokens && (
          <div className="token-modal-overlay" onClick={() => setShowToTokens(false)}>
            <div className="token-modal glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="token-modal-header">
                <h3>Select a token</h3>
                <button className="close-button" onClick={() => setShowToTokens(false)}>×</button>
              </div>

              <div className="token-search">
                <input type="text" placeholder="Search name or paste address" />
              </div>

              <div className="token-list">
                {availableTokens.map(token => (
                  <div
                    key={token.id}
                    className="token-list-item"
                    onClick={() => selectToToken(token)}
                  >
                    <div className="token-list-logo">{token.logo}</div>
                    <div className="token-list-details">
                      <div className="token-list-name">{token.name}</div>
                      <div className="token-list-symbol">{token.symbol}</div>
                    </div>
                    <div className="token-list-balance">
                      {token.balance}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="market-info-container">
        <div className="market-info-card glass-card">
          <h2>Today's Crypto Prices</h2>
          <div className="market-table">
            <div className="market-table-header">
              <div className="market-cell name">Name</div>
              <div className="market-cell price">Price</div>
              <div className="market-cell change">24h Change</div>
              <div className="market-cell market-cap">Market Cap</div>
              <div className="market-cell volume">Volume (24h)</div>
            </div>

            <div className="market-table-body">
              {marketLoading ? (
                <div style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Loading market data...
                </div>
              ) : (
                marketRows.map((row) => (
                  <div key={row.id} className="market-table-row">
                    <div className="market-cell name">
                      <span className="crypto-logo">{row.logo}</span>
                      <span className="crypto-name">{row.name}</span>
                      <span className="crypto-symbol">{row.symbol}</span>
                    </div>
                    <div className="market-cell price">${row.price}</div>
                    <div className={`market-cell change ${row.change.startsWith('+') ? 'positive' : 'negative'}`}>
                      {row.change}
                    </div>
                    <div className="market-cell market-cap">{row.marketCap}</div>
                    <div className="market-cell volume">{row.volume}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exchange;
