import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useNavigate } from 'react-router-dom';
import PortfolioAnalytics from '@/components/PortfolioAnalytics';
import { isMetaMaskInstalled } from '@/services/web3Service';
import './styles.css';

type Timeframe = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

interface AssetRow {
  id: number;
  name: string;
  symbol: string;
  amount: string;
  value: string;
  costBasis: string;
  profit: string;
  profitPercentage: string;
  allocation: string;
  logo: string;
}

const Portfolio: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [portfolioData, setPortfolioData] = useState<AssetRow[]>([]);
  const [totalValue, setTotalValue] = useState<string>('0.00');
  const [totalProfit, setTotalProfit] = useState<string>('0.00');
  const [profitPercentage, setProfitPercentage] = useState<string>('0.00');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1m');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPortfolio = async () => {
      setIsLoading(true);
      try {
        const address = localStorage.getItem('walletAddress');
        const connected = isMetaMaskInstalled() && localStorage.getItem('walletConnected') === 'true';

        if (connected && address) {
          const res = await fetch(`/api/wallet/assets?address=${address}`);
          if (res.ok) {
            const assets: Array<{
              id: string;
              name: string;
              symbol: string;
              amount: string;
              value: string;
              change: string;
              logo: string;
            }> = await res.json();

            const totalVal = assets.reduce((sum, a) => sum + parseFloat(a.value.replace(/,/g, '') || '0'), 0);

            const rows: AssetRow[] = assets.map((a, idx) => {
              const val = parseFloat(a.value.replace(/,/g, '') || '0');
              const changeNum = parseFloat(a.change || '0');
              const costBasis = changeNum !== 0 ? val / (1 + changeNum / 100) : val;
              const profit = val - costBasis;
              const alloc = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : '0.0';
              return {
                id: idx + 1,
                name: a.name,
                symbol: a.symbol,
                amount: a.amount,
                value: parseFloat(a.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                costBasis: costBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                profit: (profit >= 0 ? '+' : '') + profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                profitPercentage: (changeNum >= 0 ? '+' : '') + changeNum.toFixed(2),
                allocation: alloc,
                logo: a.logo,
              };
            });

            const totalProfitNum = rows.reduce((s, r) => s + parseFloat(r.profit.replace(/,/g, '').replace('+', '')), 0);
            const profitPct = totalVal > 0 ? ((totalProfitNum / (totalVal - totalProfitNum)) * 100).toFixed(2) : '0.00';

            setPortfolioData(rows);
            setTotalValue(totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            setTotalProfit((totalProfitNum >= 0 ? '+' : '') + totalProfitNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            setProfitPercentage(profitPct);
            return;
          }
        }

        // fallback: empty state
        setPortfolioData([]);
        setTotalValue('0.00');
        setTotalProfit('0.00');
        setProfitPercentage('0.00');
      } catch {
        setPortfolioData([]);
        setTotalValue('0.00');
        setTotalProfit('0.00');
        setProfitPercentage('0.00');
      } finally {
        setIsLoading(false);
      }
    };

    loadPortfolio();
  }, []);

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
  };

  const allocationColors: Record<string, string> = {
    ETH: 'eth',
    BTC: 'btc',
    SOL: 'sol',
    FIN: 'fin',
    fin: 'fin',
    eth: 'eth',
    btc: 'btc',
    sol: 'sol',
  };

  return (
    <div className="portfolio-view">
      <div className="portfolio-view__header">
        <h1 className="page-title">Your Portfolio</h1>
        <p className="page-subtitle">Track and analyze your cryptocurrency investments</p>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading portfolio data...</p>
        </div>
      ) : (
        <>
          <div className="portfolio-summary glass-card">
            <div className="summary-item">
              <h3>Total Value</h3>
              <div className="value">${totalValue}</div>
            </div>
            <div className="summary-item">
              <h3>Total Profit/Loss</h3>
              <div className={`value ${parseFloat(totalProfit) >= 0 ? 'positive' : 'negative'}`}>
                ${totalProfit} ({profitPercentage}%)
              </div>
            </div>
            <div className="timeframe-selector">
              {(['1d', '1w', '1m', '3m', '1y', 'all'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  className={`timeframe-button ${selectedTimeframe === tf ? 'active' : ''}`}
                  onClick={() => handleTimeframeChange(tf)}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="portfolio-grid">
            <div className="portfolio-analytics-section glass-card">
              <h2>Performance Over Time</h2>
              <PortfolioAnalytics timeframe={selectedTimeframe} />
            </div>

            <div className="portfolio-distribution glass-card">
              <h2>Portfolio Distribution</h2>
              {portfolioData.length > 0 ? (
                <>
                  <div className="allocation-chart">
                    <div className="placeholder-chart">
                      {portfolioData.map((asset) => (
                        <div
                          key={asset.id}
                          className={`chart-segment ${allocationColors[asset.symbol] || 'fin'}`}
                          style={{ width: `${asset.allocation}%` }}
                          title={`${asset.symbol}: ${asset.allocation}%`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="allocation-legend">
                    {portfolioData.map((asset) => (
                      <div className="legend-item" key={asset.id}>
                        <div className={`legend-color ${allocationColors[asset.symbol] || 'fin'}`}></div>
                        <div className="legend-label">{asset.symbol}</div>
                        <div className="legend-value">{asset.allocation}%</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No assets found. Connect your wallet to view distribution.</p>
              )}
            </div>

            <div className="assets-table-section glass-card">
              <h2>Assets Breakdown</h2>
              {portfolioData.length > 0 ? (
                <div className="assets-table-wrapper">
                  <table className="assets-table">
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Price</th>
                        <th>Holdings</th>
                        <th>Value</th>
                        <th>Cost Basis</th>
                        <th>Profit/Loss</th>
                        <th>Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioData.map((asset) => (
                        <tr key={asset.id}>
                          <td className="asset-cell">
                            <div className="asset-logo">{asset.logo}</div>
                            <div className="asset-name">
                              <div>{asset.name}</div>
                              <div className="asset-symbol">{asset.symbol}</div>
                            </div>
                          </td>
                          <td>
                            ${(
                              parseFloat(asset.value.replace(/,/g, '')) /
                              Math.max(parseFloat(asset.amount.replace(/,/g, '')), 0.000001)
                            ).toFixed(2)}
                          </td>
                          <td>{asset.amount} {asset.symbol}</td>
                          <td>${asset.value}</td>
                          <td>${asset.costBasis}</td>
                          <td className={parseFloat(asset.profit) >= 0 ? 'positive' : 'negative'}>
                            ${asset.profit} ({asset.profitPercentage}%)
                          </td>
                          <td>{asset.allocation}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  No assets found. Connect your wallet to view your holdings.
                </p>
              )}
            </div>

            <div className="portfolio-actions-section glass-card">
              <h2>Portfolio Actions</h2>
              <div className="portfolio-action-buttons">
                <button className="action-button" onClick={() => navigate('/transactions')}>
                  <div className="action-icon">↑</div>
                  <div>Transfer Assets</div>
                </button>
                <button className="action-button" onClick={() => navigate('/exchange')}>
                  <div className="action-icon">📊</div>
                  <div>Rebalance Portfolio</div>
                </button>
                <button
                  className="action-button"
                  onClick={() => {
                    if (portfolioData.length === 0) return;
                    const rows = portfolioData.map(
                      (a) => `${a.name},${a.symbol},${a.amount},${a.value},${a.profit}`
                    );
                    const csv = ['Name,Symbol,Amount,Value,Profit', ...rows].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = 'portfolio.csv';
                    anchor.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <div className="action-icon">⬇️</div>
                  <div>Export History</div>
                </button>
                <button className="action-button" onClick={() => navigate('/transactions')}>
                  <div className="action-icon">🔄</div>
                  <div>Tax Report</div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Portfolio;
