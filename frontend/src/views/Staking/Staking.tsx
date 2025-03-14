import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import './styles.css';

interface StakingPool {
  id: number;
  name: string;
  symbol: string;
  apy: number;
  totalStaked: string;
  myStake: string;
  lockPeriod: number;
  rewards: string;
  earlyWithdrawalFee: number;
}

interface StakeModalProps {
  pool: StakingPool;
  onClose: () => void;
  onConfirm: (poolId: number, amount: string, duration: number) => void;
}

const StakeModal: React.FC<StakeModalProps> = ({ pool, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>('');
  const [duration, setDuration] = useState<number>(pool.lockPeriod);
  const [estimatedReward, setEstimatedReward] = useState<string>('0');
  
  useEffect(() => {
    if (amount && !isNaN(Number(amount))) {
      // Simple estimation for demo purposes
      const stakeAmount = parseFloat(amount);
      const annualReward = stakeAmount * (pool.apy / 100);
      const periodReward = annualReward * (duration / 365);
      setEstimatedReward(periodReward.toFixed(4));
    } else {
      setEstimatedReward('0');
    }
  }, [amount, duration, pool.apy]);
  
  const handleConfirm = () => {
    onConfirm(pool.id, amount, duration);
    onClose();
  };
  
  return (
    <div className="modal-backdrop">
      <div className="modal-container glass-card">
        <div className="modal-header">
          <h2>Stake {pool.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label className="input-label">Amount to Stake</label>
            <div className="input-with-max">
              <input
                type="text"
                className="input-modern"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <button className="max-button" onClick={() => setAmount('1000')}>MAX</button>
            </div>
            <div className="input-hint">Available: 1,000 {pool.symbol}</div>
          </div>
          
          <div className="form-group">
            <label className="input-label">Lock Period (Days)</label>
            <div className="period-selector">
              <button
                className={duration === 30 ? 'period-option selected' : 'period-option'}
                onClick={() => setDuration(30)}
              >
                30 Days
              </button>
              <button
                className={duration === 90 ? 'period-option selected' : 'period-option'}
                onClick={() => setDuration(90)}
              >
                90 Days
              </button>
              <button
                className={duration === 180 ? 'period-option selected' : 'period-option'}
                onClick={() => setDuration(180)}
              >
                180 Days
              </button>
              <button
                className={duration === 365 ? 'period-option selected' : 'period-option'}
                onClick={() => setDuration(365)}
              >
                365 Days
              </button>
            </div>
            <div className="input-hint">
              Early withdrawal fee: {pool.earlyWithdrawalFee}%
            </div>
          </div>
          
          <div className="staking-summary">
            <div className="summary-row">
              <span className="summary-label">APY</span>
              <span className="summary-value">{pool.apy}%</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Lock Period</span>
              <span className="summary-value">{duration} days</span>
            </div>
            <div className="summary-row highlight">
              <span className="summary-label">Estimated Reward</span>
              <span className="summary-value">{estimatedReward} {pool.symbol}</span>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-gradient"
            onClick={handleConfirm}
            disabled={!amount || isNaN(Number(amount)) || Number(amount) <= 0}
          >
            Confirm Staking
          </button>
        </div>
      </div>
    </div>
  );
};

interface UnstakeModalProps {
  pool: StakingPool;
  onClose: () => void;
  onConfirm: (poolId: number) => void;
}

const UnstakeModal: React.FC<UnstakeModalProps> = ({ pool, onClose, onConfirm }) => {
  const handleConfirm = () => {
    onConfirm(pool.id);
    onClose();
  };
  
  return (
    <div className="modal-backdrop">
      <div className="modal-container glass-card">
        <div className="modal-header">
          <h2>Unstake {pool.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="staking-summary">
            <div className="summary-row">
              <span className="summary-label">Currently Staked</span>
              <span className="summary-value">{pool.myStake} {pool.symbol}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Accrued Rewards</span>
              <span className="summary-value">{pool.rewards} {pool.symbol}</span>
            </div>
            <div className="warning-message">
              {parseFloat(pool.myStake) > 0 ? (
                <>
                  <div className="warning-icon">⚠️</div>
                  <div>
                    <p>You are about to unstake all your {pool.symbol} tokens.</p>
                    <p>Early withdrawal may incur a {pool.earlyWithdrawalFee}% fee.</p>
                  </div>
                </>
              ) : (
                <p>You don't have any staked tokens to withdraw.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-gradient"
            onClick={handleConfirm}
            disabled={parseFloat(pool.myStake) <= 0}
          >
            Confirm Unstaking
          </button>
        </div>
      </div>
    </div>
  );
};

const Staking: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [stakingPools, setStakingPools] = useState<StakingPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [modalType, setModalType] = useState<'stake' | 'unstake' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Simulate API call to get staking pools
    setTimeout(() => {
      const mockPools: StakingPool[] = [
        {
          id: 1,
          name: 'Finance Token',
          symbol: 'FIN',
          apy: 12.5,
          totalStaked: '1,250,000',
          myStake: '150',
          lockPeriod: 30,
          rewards: '2.45',
          earlyWithdrawalFee: 10
        },
        {
          id: 2,
          name: 'Ethereum',
          symbol: 'ETH',
          apy: 5.2,
          totalStaked: '2,500',
          myStake: '0.5',
          lockPeriod: 90,
          rewards: '0.004',
          earlyWithdrawalFee: 15
        },
        {
          id: 3,
          name: 'Bitcoin',
          symbol: 'BTC',
          apy: 3.8,
          totalStaked: '120',
          myStake: '0',
          lockPeriod: 180,
          rewards: '0',
          earlyWithdrawalFee: 20
        },
        {
          id: 4,
          name: 'Solana',
          symbol: 'SOL',
          apy: 8.5,
          totalStaked: '85,000',
          myStake: '25',
          lockPeriod: 30,
          rewards: '0.32',
          earlyWithdrawalFee: 10
        }
      ];
      
      setStakingPools(mockPools);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const openStakeModal = (pool: StakingPool) => {
    setSelectedPool(pool);
    setModalType('stake');
  };
  
  const openUnstakeModal = (pool: StakingPool) => {
    setSelectedPool(pool);
    setModalType('unstake');
  };
  
  const closeModal = () => {
    setSelectedPool(null);
    setModalType(null);
  };
  
  const handleStake = (poolId: number, amount: string, duration: number) => {
    console.log(`Staking ${amount} tokens in pool ${poolId} for ${duration} days`);
    // In a real implementation, you would call your staking API here
    
    // Simulate successful staking by updating the local state
    setStakingPools(pools => 
      pools.map(pool => 
        pool.id === poolId 
          ? { 
              ...pool, 
              myStake: (parseFloat(pool.myStake.replace(/,/g, '')) + parseFloat(amount)).toString(),
              totalStaked: (parseFloat(pool.totalStaked.replace(/,/g, '')) + parseFloat(amount)).toLocaleString()
            } 
          : pool
      )
    );
  };
  
  const handleUnstake = (poolId: number) => {
    console.log(`Unstaking from pool ${poolId}`);
    // In a real implementation, you would call your unstaking API here
    
    // Simulate successful unstaking by updating the local state
    const poolToUpdate = stakingPools.find(p => p.id === poolId);
    if (poolToUpdate) {
      const stakedAmount = parseFloat(poolToUpdate.myStake.replace(/,/g, ''));
      
      setStakingPools(pools => 
        pools.map(pool => 
          pool.id === poolId 
            ? { 
                ...pool, 
                myStake: '0',
                rewards: '0',
                totalStaked: (parseFloat(pool.totalStaked.replace(/,/g, '')) - stakedAmount).toLocaleString()
              } 
            : pool
        )
      );
    }
  };
  
  return (
    <div className="staking-page">
      <div className="staking-header">
        <h1 className="staking-title">Staking</h1>
        <p className="staking-subtitle">Stake your tokens to earn rewards</p>
      </div>
      
      {isLoading ? (
        <div className="staking-loading">
          <div className="loading-spinner-large"></div>
          <p>Loading staking pools...</p>
        </div>
      ) : (
        <div className="staking-pools">
          <div className="pools-header">
            <div className="pool-column asset">Asset</div>
            <div className="pool-column apy">APY</div>
            <div className="pool-column duration">Lock Period</div>
            <div className="pool-column total-staked">Total Staked</div>
            <div className="pool-column my-stake">My Stake</div>
            <div className="pool-column rewards">Rewards</div>
            <div className="pool-column actions">Actions</div>
          </div>
          
          {stakingPools.map(pool => (
            <div key={pool.id} className="pool-row glass-card">
              <div className="pool-column asset">
                <div className="asset-icon">{pool.symbol.charAt(0)}</div>
                <div className="asset-details">
                  <div className="asset-name">{pool.name}</div>
                  <div className="asset-symbol">{pool.symbol}</div>
                </div>
              </div>
              
              <div className="pool-column apy">
                <div className="apy-value">{pool.apy}%</div>
                <div className="apy-label">Annual</div>
              </div>
              
              <div className="pool-column duration">
                <div className="duration-value">{pool.lockPeriod} days</div>
                <div className="duration-fee">Fee: {pool.earlyWithdrawalFee}%</div>
              </div>
              
              <div className="pool-column total-staked">
                <div className="staked-value">{pool.totalStaked}</div>
                <div className="staked-symbol">{pool.symbol}</div>
              </div>
              
              <div className="pool-column my-stake">
                <div className="stake-value">{pool.myStake}</div>
                <div className="stake-symbol">{pool.symbol}</div>
              </div>
              
              <div className="pool-column rewards">
                <div className="rewards-value">{pool.rewards}</div>
                <div className="rewards-symbol">{pool.symbol}</div>
              </div>
              
              <div className="pool-column actions">
                <button 
                  className="btn-action stake" 
                  onClick={() => openStakeModal(pool)}
                  disabled={!isAuthenticated}
                >
                  Stake
                </button>
                <button 
                  className="btn-action unstake" 
                  onClick={() => openUnstakeModal(pool)}
                  disabled={!isAuthenticated || parseFloat(pool.myStake.replace(/,/g, '')) <= 0}
                >
                  Unstake
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!isAuthenticated && (
        <div className="auth-required-message glass-card">
          <div className="message-icon">🔒</div>
          <div className="message-content">
            <h3>Authentication Required</h3>
            <p>Please log in or sign up to access staking features</p>
            <div className="message-actions">
              <a href="/login" className="btn-secondary">Log In</a>
              <a href="/signup" className="btn-gradient">Sign Up</a>
            </div>
          </div>
        </div>
      )}
      
      <div className="staking-info glass-card">
        <h3>About Staking</h3>
        <p>
          Staking is the process of actively participating in transaction validation 
          on a proof-of-stake (PoS) blockchain. By locking up your tokens, you help 
          secure the network and earn rewards in return.
        </p>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">💰</div>
            <div className="info-title">Earn Passive Income</div>
            <div className="info-text">Earn APY rewards just by holding your tokens</div>
          </div>
          <div className="info-item">
            <div className="info-icon">🔒</div>
            <div className="info-title">Security</div>
            <div className="info-text">Your funds remain secure with institutional-grade custody</div>
          </div>
          <div className="info-item">
            <div className="info-icon">⚡</div>
            <div className="info-title">Flexibility</div>
            <div className="info-text">Choose different lock periods to maximize your returns</div>
          </div>
        </div>
      </div>
      
      {selectedPool && modalType === 'stake' && (
        <StakeModal 
          pool={selectedPool} 
          onClose={closeModal} 
          onConfirm={handleStake} 
        />
      )}
      
      {selectedPool && modalType === 'unstake' && (
        <UnstakeModal 
          pool={selectedPool} 
          onClose={closeModal} 
          onConfirm={handleUnstake} 
        />
      )}
    </div>
  );
};

export default Staking;