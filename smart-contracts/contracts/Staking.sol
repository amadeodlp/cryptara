// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title Staking Contract
 * @notice This contract allows users to stake tokens and earn rewards
 */
contract Staking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct StakingPool {
        IERC20 stakingToken;        // Token that can be staked
        uint256 rewardRate;         // Reward rate per second
        uint256 rewardPerTokenStored;
        uint256 lastUpdateTime;
        uint256 totalStaked;
        uint256 minStakeDuration;   // Minimum staking duration in seconds
        uint256 earlyUnstakeFee;    // Fee percentage for early unstaking (1000 = 10%)
        uint256 maxCapacity;        // Maximum amount that can be staked in the pool
        bool active;                // Whether the pool is active
    }

    struct UserStake {
        uint256 amount;
        uint256 startTime;
        uint256 rewards;
        uint256 rewardPerTokenPaid;
    }

    // Mapping from pool ID to pool details
    mapping(uint256 => StakingPool) public stakingPools;
    
    // Mapping from pool ID to user address to staking details
    mapping(uint256 => mapping(address => UserStake)) public userStakes;
    
    // Array of pool IDs
    uint256[] public poolIds;
    
    // Events
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardPaid(address indexed user, uint256 indexed poolId, uint256 reward);
    event PoolCreated(uint256 indexed poolId, address stakingToken);
    event PoolUpdated(uint256 indexed poolId, uint256 rewardRate, bool active);

    constructor() {
        _transferOwnership(msg.sender);
    }

    /**
     * @notice Create a new staking pool
     * @param _stakingToken The token that can be staked
     * @param _rewardRate The reward rate per second
     * @param _minStakeDuration Minimum staking duration in seconds
     * @param _earlyUnstakeFee Fee percentage for early unstaking (1000 = 10%)
     * @param _maxCapacity Maximum amount that can be staked in the pool
     * @return poolId The ID of the created pool
     */
    function createPool(
        IERC20 _stakingToken,
        uint256 _rewardRate,
        uint256 _minStakeDuration,
        uint256 _earlyUnstakeFee,
        uint256 _maxCapacity
    ) external onlyOwner returns (uint256 poolId) {
        require(address(_stakingToken) != address(0), "Invalid token address");
        require(_earlyUnstakeFee <= 3000, "Max fee is 30%"); // 3000 = 30%
        
        poolId = poolIds.length;
        poolIds.push(poolId);
        
        stakingPools[poolId] = StakingPool({
            stakingToken: _stakingToken,
            rewardRate: _rewardRate,
            rewardPerTokenStored: 0,
            lastUpdateTime: block.timestamp,
            totalStaked: 0,
            minStakeDuration: _minStakeDuration,
            earlyUnstakeFee: _earlyUnstakeFee,
            maxCapacity: _maxCapacity,
            active: true
        });
        
        emit PoolCreated(poolId, address(_stakingToken));
        return poolId;
    }

    /**
     * @notice Update pool settings
     * @param _poolId The pool ID
     * @param _rewardRate New reward rate
     * @param _active Whether the pool is active
     */
    function updatePool(
        uint256 _poolId,
        uint256 _rewardRate,
        bool _active
    ) external onlyOwner {
        require(_poolId < poolIds.length, "Pool does not exist");
        
        StakingPool storage pool = stakingPools[_poolId];
        
        // Update rewards before changing reward rate
        _updateReward(_poolId, address(0));
        
        pool.rewardRate = _rewardRate;
        pool.active = _active;
        
        emit PoolUpdated(_poolId, _rewardRate, _active);
    }

    /**
     * @notice Stake tokens in a pool
     * @param _poolId The pool ID
     * @param _amount Amount to stake
     */
    function stake(uint256 _poolId, uint256 _amount) external nonReentrant {
        require(_poolId < poolIds.length, "Pool does not exist");
        StakingPool storage pool = stakingPools[_poolId];
        require(pool.active, "Pool is not active");
        require(_amount > 0, "Amount must be greater than 0");
        require(pool.totalStaked + _amount <= pool.maxCapacity, "Pool capacity exceeded");
        
        _updateReward(_poolId, msg.sender);
        
        userStakes[_poolId][msg.sender].amount += _amount;
        
        // If first time staking or restaking after unstaking everything,
        // update the start time
        if (userStakes[_poolId][msg.sender].startTime == 0) {
            userStakes[_poolId][msg.sender].startTime = block.timestamp;
        }
        
        pool.totalStaked += _amount;
        
        // Transfer staking tokens to this contract
        pool.stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        emit Staked(msg.sender, _poolId, _amount);
    }

    /**
     * @notice Unstake tokens from a pool
     * @param _poolId The pool ID
     * @param _amount Amount to unstake
     */
    function unstake(uint256 _poolId, uint256 _amount) external nonReentrant {
        require(_poolId < poolIds.length, "Pool does not exist");
        
        UserStake storage userStake = userStakes[_poolId][msg.sender];
        require(userStake.amount >= _amount, "Insufficient staked amount");
        
        StakingPool storage pool = stakingPools[_poolId];
        
        _updateReward(_poolId, msg.sender);
        
        // Check if user is unstaking early
        bool isEarlyUnstake = block.timestamp < userStake.startTime + pool.minStakeDuration;
        
        // Calculate fee for early unstaking
        uint256 feeAmount = 0;
        if (isEarlyUnstake) {
            feeAmount = (_amount * pool.earlyUnstakeFee) / 10000;
        }
        
        uint256 amountToTransfer = _amount - feeAmount;
        
        // Update user stake
        userStake.amount -= _amount;
        pool.totalStaked -= _amount;
        
        // Reset start time if unstaking everything
        if (userStake.amount == 0) {
            userStake.startTime = 0;
        }
        
        // Transfer tokens back to the user
        pool.stakingToken.safeTransfer(msg.sender, amountToTransfer);
        
        // If there's a fee, it stays in the contract (could be sent to treasury)
        
        emit Unstaked(msg.sender, _poolId, _amount);
    }

    /**
     * @notice Claim rewards from a pool
     * @param _poolId The pool ID
     */
    function claimRewards(uint256 _poolId) external nonReentrant {
        require(_poolId < poolIds.length, "Pool does not exist");
        
        _updateReward(_poolId, msg.sender);
        
        uint256 reward = userStakes[_poolId][msg.sender].rewards;
        if (reward > 0) {
            userStakes[_poolId][msg.sender].rewards = 0;
            
            // In a real implementation, you'd transfer reward tokens here
            // For simplicity, we're just emitting an event
            
            emit RewardPaid(msg.sender, _poolId, reward);
        }
    }

    /**
     * @notice Get the number of staking pools
     * @return The number of staking pools
     */
    function getPoolCount() external view returns (uint256) {
        return poolIds.length;
    }

    /**
     * @notice Get staking information for a user
     * @param _poolId The pool ID
     * @param _user The user address
     * @return amount Amount staked
     * @return startTime Start time of staking
     * @return pendingRewards Pending rewards
     */
    function getUserStake(uint256 _poolId, address _user) 
        external 
        view 
        returns (
            uint256 amount,
            uint256 startTime,
            uint256 pendingRewards
        ) 
    {
        require(_poolId < poolIds.length, "Pool does not exist");
        
        UserStake storage userStake = userStakes[_poolId][_user];
        StakingPool storage pool = stakingPools[_poolId];
        
        amount = userStake.amount;
        startTime = userStake.startTime;
        
        // Calculate pending rewards
        uint256 rewardPerToken = _rewardPerToken(_poolId);
        pendingRewards = userStake.rewards + 
            (amount * (rewardPerToken - userStake.rewardPerTokenPaid)) / 1e18;
        
        return (amount, startTime, pendingRewards);
    }

    /**
     * @notice Internal function to update rewards
     * @param _poolId The pool ID
     * @param _account The account to update rewards for
     */
    function _updateReward(uint256 _poolId, address _account) internal {
        StakingPool storage pool = stakingPools[_poolId];
        pool.rewardPerTokenStored = _rewardPerToken(_poolId);
        pool.lastUpdateTime = _lastTimeRewardApplicable();
        
        if (_account != address(0)) {
            userStakes[_poolId][_account].rewards = earned(_poolId, _account);
            userStakes[_poolId][_account].rewardPerTokenPaid = pool.rewardPerTokenStored;
        }
    }

    /**
     * @notice Calculate the reward per token
     * @param _poolId The pool ID
     * @return The reward per token
     */
    function _rewardPerToken(uint256 _poolId) internal view returns (uint256) {
        StakingPool storage pool = stakingPools[_poolId];
        
        if (pool.totalStaked == 0) {
            return pool.rewardPerTokenStored;
        }
        
        return pool.rewardPerTokenStored + (
            (_lastTimeRewardApplicable() - pool.lastUpdateTime) * pool.rewardRate * 1e18 / pool.totalStaked
        );
    }

    /**
     * @notice Calculate earned rewards for an account
     * @param _poolId The pool ID
     * @param _account The account to calculate rewards for
     * @return The earned rewards
     */
    function earned(uint256 _poolId, address _account) public view returns (uint256) {
        StakingPool storage pool = stakingPools[_poolId];
        UserStake storage userStake = userStakes[_poolId][_account];
        
        return userStake.rewards + (
            userStake.amount * (_rewardPerToken(_poolId) - userStake.rewardPerTokenPaid) / 1e18
        );
    }

    /**
     * @notice Get the last time rewards were applicable
     * @return The last time rewards were applicable
     */
    function _lastTimeRewardApplicable() internal view returns (uint256) {
        return Math.min(block.timestamp, block.timestamp);
    }

    /**
     * @notice Emergency withdraw tokens from the contract (owner only)
     * @param _token The token to withdraw
     * @param _amount The amount to withdraw
     */
    function emergencyWithdraw(IERC20 _token, uint256 _amount) external onlyOwner {
        _token.safeTransfer(msg.sender, _amount);
    }
}