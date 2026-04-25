import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useNavigate } from 'react-router-dom';
import PortfolioAnalytics from '@/components/PortfolioAnalytics';
import './styles.css';

type Timeframe = '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

const Portfolio: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [portfolioData, setPortfolioData] = useState<any>([]);
  const [totalValue, setTotalValue] = useState<string>('0.00');
  const [totalProfit, setTotalProfit] = useState<string>('0.00');
  const [profitPercentage, setProfitPercentage] = useState<string>('0.00');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1m');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    setTimeout(() => {
      const mockPortfolioData = [
        { 
          id: 1, 
          name: 'Ethereum', 
          symbol: 'ETH', 
          amount: '2.45', 
          value: '9,328.75', 
          costBasis: '8,575.00',
          profit: '+753.75',
          profitPercentage: '+8.79',
          allocation: '34.1',
          logo: '🔷' 
        },
        { 
          id: 2, 
          name: 'Bitcoin', 
          symbol: 'BTC', 
          amount: '0.18', 
          value: '11,249.20', 
          costBasis: '10,980.00',
          profit: '+269.20',
          profitPercentage: '+2.45',
          allocation: '41.1',
          logo: '₿' 
        },
        { 
          id: 3, 
          name: 'Solana', 
          symbol: 'SOL', 
          amount: '42.5', 
          value: '4,569.84', 
          costBasis: '4,675.00',
          profit: '-105.16',
          profitPercentage: '-2.25',
          allocation: '16.7',
          logo: '◎' 
        },
        { 
          id: 4, 
          name: 'Finance Token', 
          symbol: 'FIN', 
          amount: '1,350.00', 
          value: '2,243.77', 
          costBasis: '2,025.00',
          profit: '+218.77',
          profitPercentage: '+10.80',
          allocation: '8.2',
          logo: '🪙' 
        },
      ];
      
      setPortfolioData(mockPortfolioData);
      setTotalValue('27,391.56');
      setTotalProfit('1,136.56');
      setProfitPercentage('4.32');
      setIsLoading(false);
    }, 1200);
  }, []);

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setSelectedTimeframe(timeframe);
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
              {(['1d', '1w', '1m', '3m', '1y', 'all'] as Timeframe[]).map(tf => (
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
              <div className="allocation-chart">
                <div className="placeholder-chart">
                  <div className="chart-segment eth" style={{width: '34.1%'}} title="ETH: 34.1%"></div>
                  <div className="chart-segment btc" style={{width: '41.1%'}} title="BTC: 41.1%"></div>
                  <div className="chart-segment sol" style={{width: '16.7%'}} title="SOL: 16.7%"></div>
                  <div className="chart-segment fin" style={{width: '8.2%'}} title="FIN: 8.2%"></div>
                </div>
              </div>
              <div className="allocation-legend">
                <div className="legend-item">
                  <div className="legend-color eth"></div>
                  <div className="legend-label">ETH</div>
                  <div className="legend-value">34.1%</div>
                </div>
                <div className="legend-item">
                  <div className="legend-color btc"></div>
                  <div className="legend-label">BTC</div>
                  <div className="legend-value">41.1%</div>
                </div>
                <div className="legend-item">
                  <div className="legend-color sol"></div>
                  <div className="legend-label">SOL</div>
                  <div className="legend-value">16.7%</div>
                </div>
                <div className="legend-item">
                  <div className="legend-color fin"></div>
                  <div className="legend-label">FIN</div>
                  <div className="legend-value">8.2%</div>
                </div>
              </div>
            </div>
            
            <div className="assets-table-section glass-card">
              <h2>Assets Breakdown</h2>
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
                    {portfolioData.map((asset: any) => (
                      <tr key={asset.id}>
                        <td className="asset-cell">
                          <div className="asset-logo">{asset.logo}</div>
                          <div className="asset-name">
                            <div>{asset.name}</div>
                            <div className="asset-symbol">{asset.symbol}</div>
                          </div>
                        </td>
                        <td>${(parseFloat(asset.value.replace(/,/g, '')) / parseFloat(asset.amount)).toFixed(2)}</td>
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
                <button className="action-button" onClick={() => {
                  const rows = portfolioData.map((a: any) => `${a.name},${a.symbol},${a.amount},${a.value},${a.profit}`);
                  const csv = ['Name,Symbol,Amount,Value,Profit', ...rows].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement('a');
                  anchor.href = url;
                  anchor.download = 'portfolio.csv';
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}>
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
