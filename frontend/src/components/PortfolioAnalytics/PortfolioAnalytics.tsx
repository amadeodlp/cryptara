import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, CartesianGrid } from 'recharts';
import { ethers } from 'ethers';
import { 
  getPortfolioData, 
  PortfolioData,
  AssetData, 
  HistoricalValue, 
  PerformanceData 
} from '@/services/blockchain/portfolioService';
import './styles.css';

interface PortfolioAnalyticsProps {
  timeframe?: '1d' | '1w' | '1m' | '3m' | '1y' | 'all';
}

const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({ timeframe = '1m' }) => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [activeChart, setActiveChart] = useState<'allocation' | 'performance' | 'history'>('allocation');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1d' | '1w' | '1m' | '3m' | '1y' | 'all'>(timeframe);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Get wallet address
        const address = localStorage.getItem('walletAddress');
        
        if (!address) {
          // No wallet connected, use empty data
          setPortfolioData({
            assets: [],
            historicalValue: [],
            performance: []
          });
          setIsLoading(false);
          return;
        }
        
        // Get portfolio data
        console.log('Loading portfolio data...');
        const data = await getPortfolioData(address, selectedTimeframe);
        console.log('Portfolio data loaded:', data);
        
        // Set the data
        setPortfolioData(data);
      } catch (error) {
        console.error('Error loading portfolio data:', error);
        
        // Fallback to empty data if everything fails
        setPortfolioData({
          assets: [],
          historicalValue: [],
          performance: []
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedTimeframe]);
  
  
  // Calculate total portfolio value
  const totalValue = portfolioData?.assets.reduce((sum, asset) => sum + asset.value, 0) || 0;
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Custom tooltip for the line chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          <p className="tooltip-value">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    
    return null;
  };
  
  // COLORS for the pie chart
  const COLORS = portfolioData?.assets.map(asset => asset.color) || [];
  
  return (
    <div className="portfolio-analytics">
      <div className="analytics-header">
        <h2 className="analytics-title">Portfolio Analytics</h2>
        
        <div className="analytics-tabs">
          <button 
            className={`tab-button ${activeChart === 'allocation' ? 'active' : ''}`}
            onClick={() => setActiveChart('allocation')}
          >
            Allocation
          </button>
          <button 
            className={`tab-button ${activeChart === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveChart('performance')}
          >
            Performance
          </button>
          <button 
            className={`tab-button ${activeChart === 'history' ? 'active' : ''}`}
            onClick={() => setActiveChart('history')}
          >
            History
          </button>
        </div>
        
        <div className="timeframe-selector">
          <button 
            className={`timeframe-button ${selectedTimeframe === '1d' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('1d')}
          >
            1D
          </button>
          <button 
            className={`timeframe-button ${selectedTimeframe === '1w' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('1w')}
          >
            1W
          </button>
          <button 
            className={`timeframe-button ${selectedTimeframe === '1m' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('1m')}
          >
            1M
          </button>
          <button 
            className={`timeframe-button ${selectedTimeframe === '3m' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('3m')}
          >
            3M
          </button>
          <button 
            className={`timeframe-button ${selectedTimeframe === '1y' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('1y')}
          >
            1Y
          </button>
          <button 
            className={`timeframe-button ${selectedTimeframe === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('all')}
          >
            All
          </button>
        </div>
      </div>
      
      <div className="analytics-value">
        <div className="value-label">Total Value:</div>
        <div className="value-amount">{formatCurrency(totalValue)}</div>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading portfolio data...</p>
        </div>
      ) : (
        <div className="chart-container">
          {activeChart === 'allocation' && portfolioData && (
            <div className="allocation-chart">
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={portfolioData.assets}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      labelLine={false}
                    >
                      {portfolioData.assets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="asset-list">
                <h3>Assets</h3>
                <div className="asset-table">
                  <div className="asset-header">
                    <div className="asset-cell">Asset</div>
                    <div className="asset-cell">Amount</div>
                    <div className="asset-cell">Value</div>
                    <div className="asset-cell">Allocation</div>
                  </div>
                  {portfolioData.assets.map((asset, index) => (
                    <div className="asset-row" key={index}>
                      <div className="asset-cell asset-name">
                        <div className="asset-color" style={{ backgroundColor: asset.color }}></div>
                        <span>{asset.name} ({asset.symbol})</span>
                      </div>
                      <div className="asset-cell">{asset.amount}</div>
                      <div className="asset-cell">{formatCurrency(asset.value)}</div>
                      <div className="asset-cell">
                        {((asset.value / totalValue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeChart === 'performance' && portfolioData && (
            <div className="performance-chart">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={portfolioData.performance}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                  />
                  <Bar 
                    dataKey="return" 
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  >
                    {portfolioData.performance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.return >= 0 ? '#00c6ff' : '#ff6b6b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              <div className="performance-summary glass-card">
                <h3>Performance Summary</h3>
                <div className="summary-row">
                  <div className="summary-label">Best Performer:</div>
                  <div className="summary-value">
                    {portfolioData.performance.reduce((best, current) => 
                      best.return > current.return ? best : current, portfolioData.performance[0]).name}
                    <span className="summary-percent positive">
                      (+{portfolioData.performance.reduce((best, current) => 
                        best.return > current.return ? best : current, portfolioData.performance[0]).return.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="summary-row">
                  <div className="summary-label">Worst Performer:</div>
                  <div className="summary-value">
                    {portfolioData.performance.reduce((worst, current) => 
                      worst.return < current.return ? worst : current, portfolioData.performance[0]).name}
                    <span className="summary-percent negative">
                      ({portfolioData.performance.reduce((worst, current) => 
                        worst.return < current.return ? worst : current, portfolioData.performance[0]).return.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="summary-row">
                  <div className="summary-label">Average Return:</div>
                  <div className="summary-value">
                    <span className={`summary-percent ${portfolioData.performance.reduce((sum, current) => sum + current.return, 0) / portfolioData.performance.length >= 0 ? 'positive' : 'negative'}`}>
                      {(portfolioData.performance.reduce((sum, current) => sum + current.return, 0) / portfolioData.performance.length).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeChart === 'history' && portfolioData && (
            <div className="history-chart">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={portfolioData.historicalValue}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis 
                    domain={['dataMin - 1000', 'dataMax + 1000']} 
                    tickFormatter={(value) => `$${value.toLocaleString()}`} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00c6ff"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="history-summary glass-card">
                <h3>Value History</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="summary-title">Current Value</div>
                    <div className="summary-value">
                      {formatCurrency(portfolioData.historicalValue[portfolioData.historicalValue.length - 1].value)}
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-title">Starting Value</div>
                    <div className="summary-value">
                      {formatCurrency(portfolioData.historicalValue[0].value)}
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-title">Change</div>
                    <div className="summary-value">
                      {(() => {
                        const startValue = portfolioData.historicalValue[0].value;
                        const endValue = portfolioData.historicalValue[portfolioData.historicalValue.length - 1].value;
                        const change = endValue - startValue;
                        const percentChange = (change / startValue) * 100;
                        return (
                          <>
                            {formatCurrency(change)}
                            <span className={`percent-change ${change >= 0 ? 'positive' : 'negative'}`}>
                              ({change >= 0 ? '+' : ''}{percentChange.toFixed(2)}%)
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-title">Highest Value</div>
                    <div className="summary-value">
                      {formatCurrency(Math.max(...portfolioData.historicalValue.map(item => item.value)))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioAnalytics;