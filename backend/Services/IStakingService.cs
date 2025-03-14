using FinanceSimplified.Models;

namespace FinanceSimplified.Services;

public interface IStakingService
{
    Task<List<StakingPosition>> GetUserStakingPositionsAsync(string userId);
    Task<StakingResult> StakeTokensAsync(string userId, string tokenSymbol, decimal amount, int duration);
    Task<StakingResult> UnstakeTokensAsync(string userId, string stakingId);
    Task<StakingReward> GetStakingRewardsAsync(string userId, string stakingId);
    Task<List<StakingApyRate>> GetStakingApyRatesAsync();
}