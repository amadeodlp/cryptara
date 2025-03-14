import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Transaction, fetchTransactions, getWalletHistory, getPlaceholderTransactions } from '@/services/blockchain/transactionService';
import { isMetaMaskInstalled } from '@/services/web3Service';
import './styles.css';

const Transactions: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const walletAddress = localStorage.getItem('walletAddress');
        
        if (!walletAddress) {
          setIsLoading(false);
          setTransactions([]);
          setFilteredTransactions([]);
          return;
        }
        
        // Set a flag to show where data is coming from
        let dataSource = '';
        
        try {
          // First try to get transactions from the backend API
          const apiTransactions = await fetchTransactions(walletAddress);
          if (apiTransactions && apiTransactions.length > 0) {
            setTransactions(apiTransactions);
            setFilteredTransactions(apiTransactions);
            dataSource = 'Backend API';
          } else {
            throw new Error('No transactions found in API');
          }
        } catch (apiError) {
          console.warn('Backend API not available, trying direct blockchain query:', apiError);
          
          try {
            // If backend fails, try to directly query wallet history from blockchain
            if (isMetaMaskInstalled()) {
              const historyTransactions = await getWalletHistory(walletAddress);
              if (historyTransactions && historyTransactions.length > 0) {
                setTransactions(historyTransactions);
                setFilteredTransactions(historyTransactions);
                dataSource = 'Blockchain';
              } else {
                throw new Error('No transactions found in wallet history');
              }
            } else {
              throw new Error('MetaMask not installed');
            }
          } catch (blockchainError) {
            console.warn('Direct blockchain query failed, using placeholder data:', blockchainError);
            
            // If all else fails, use placeholder data (but clearly mark it as such)
            const placeholderData = getPlaceholderTransactions(true);
            setTransactions(placeholderData);
            setFilteredTransactions(placeholderData);
            dataSource = 'Placeholder';
          }
        }
        
        console.log(`Transactions loaded from ${dataSource}`);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions(getPlaceholderTransactions(true));
        setFilteredTransactions(getPlaceholderTransactions(true));
        setIsLoading(false);
      }
    };
    
    loadTransactions();
  }, []);
  
  useEffect(() => {
    // Filter and search transactions
    let result = [...transactions];
    
    // Apply type filter
    if (activeFilter !== 'all') {
      result = result.filter(tx => tx.type.toLowerCase() === activeFilter.toLowerCase());
    }
    
    // Apply search term
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase();
      result = result.filter(tx => 
        (tx.asset?.toLowerCase().includes(search) || false) ||
        (tx.assetFrom?.toLowerCase().includes(search) || false) ||
        (tx.assetTo?.toLowerCase().includes(search) || false) ||
        (tx.from?.toLowerCase().includes(search) || false) ||
        (tx.to?.toLowerCase().includes(search) || false) ||
        (tx.txHash?.toLowerCase().includes(search) || false)
      );
    }
    
    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredTransactions(result);
  }, [transactions, activeFilter, searchTerm, sortOrder]);
  
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const truncateAddress = (address: string) => {
    if (!address) return '';
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="transactions-view">
      <div className="transactions-view__header">
        <h1 className="page-title">Transaction History</h1>
        <p className="page-subtitle">View and track all your transactions</p>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading transaction data...</p>
        </div>
      ) : (
        <>
          <div className="transactions-controls glass-card">
            <div className="filter-options">
              <button 
                className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
              <button 
                className={`filter-button ${activeFilter === 'received' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('received')}
              >
                Received
              </button>
              <button 
                className={`filter-button ${activeFilter === 'sent' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('sent')}
              >
                Sent
              </button>
              <button 
                className={`filter-button ${activeFilter === 'swap' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('swap')}
              >
                Swap
              </button>
              <button 
                className={`filter-button ${activeFilter === 'deposit' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('deposit')}
              >
                Deposit
              </button>
              <button 
                className={`filter-button ${activeFilter === 'withdrawal' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('withdrawal')}
              >
                Withdrawal
              </button>
              <button 
                className={`filter-button ${activeFilter === 'staking' ? 'active' : ''}`} 
                onClick={() => handleFilterChange('staking')}
              >
                Staking
              </button>
            </div>
            
            <div className="search-sort-container">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search by asset, address, or txn hash"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
              
              <button className="sort-button" onClick={handleSortToggle}>
                Sort {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
          
          <div className="transactions-list glass-card">
            <div className="transactions-table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Asset</th>
                    <th>Amount</th>
                    <th>From/To</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Transaction Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className={`transaction-row ${tx.status.toLowerCase()}`}>
                        <td>
                          <div className={`transaction-type-icon ${tx.type.toLowerCase()}`}></div>
                          <span className="transaction-type">{tx.type}</span>
                        </td>
                        <td>{formatDate(tx.date)}</td>
                        <td>
                          {tx.type === 'Swap' ? (
                            <div className="swap-assets">
                              {tx.assetFrom} → {tx.assetTo}
                            </div>
                          ) : (
                            tx.asset
                          )}
                        </td>
                        <td>
                          {tx.type === 'Swap' ? (
                            <div className="swap-amounts">
                              {tx.amountFrom} {tx.assetFrom} → {tx.amountTo} {tx.assetTo}
                            </div>
                          ) : (
                            <div className="transaction-amount">
                              {tx.amount} {tx.asset}
                            </div>
                          )}
                        </td>
                        <td>
                          {tx.type === 'Received' && (
                            <div className="address-cell">From: {truncateAddress(tx.from || '')}</div>
                          )}
                          {tx.type === 'Sent' && (
                            <div className="address-cell">To: {truncateAddress(tx.to || '')}</div>
                          )}
                          {tx.type === 'Deposit' && (
                            <div className="address-cell">From: {tx.from}</div>
                          )}
                          {tx.type === 'Withdrawal' && (
                            <div className="address-cell">To: {tx.to}</div>
                          )}
                          {tx.type === 'Swap' && (
                            <div className="address-cell">DEX</div>
                          )}
                          {tx.type === 'Staking' && (
                            <div className="address-cell">Protocol</div>
                          )}
                          {tx.type === 'Reward' && (
                            <div className="address-cell">Protocol</div>
                          )}
                          {tx.type === 'Failed' && (
                            <div className="address-cell">To: {truncateAddress(tx.to || '')}</div>
                          )}
                        </td>
                        <td>{tx.fee}</td>
                        <td>
                          <div className={`status-badge ${tx.status.toLowerCase()}`}>
                            {tx.status}
                          </div>
                        </td>
                        <td>
                          <div className="tx-hash">
                            {truncateAddress(tx.txHash || '')}
                            <button className="copy-button" title="Copy transaction hash">
                              📋
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="no-transactions">
                        <div className="empty-state">
                          <div className="empty-icon">📭</div>
                          <p>No transactions found</p>
                          {searchTerm || activeFilter !== 'all' ? (
                            <p>Try adjusting your filters</p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="transaction-export glass-card">
            <div className="export-section">
              <h3>Export Transactions</h3>
              <p>Download your transaction history for accounting or tax purposes</p>
              <div className="export-buttons">
                <button className="export-button">
                  <span className="export-icon">📊</span>
                  Export CSV
                </button>
                <button className="export-button">
                  <span className="export-icon">📑</span>
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Transactions;