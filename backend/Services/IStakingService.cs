using FinanceSimplified.Models;

namespace FinanceSimplified.Services;

public interface IStakingService
{
    Task<List<StakingPosition>> GetUserStakingPositionsAsync(int userId);
    Task<StakingResult> StakeTokensAsync(int userId, string tokenSymbol, decimal amount, int duration);
    Task<StakingResult> UnstakeTokensAsync(int userId, int stakingId);
    Task<StakingReward> GetStakingRewardsAsync(int userId, int stakingId);
    Task<List<StakingApyRate>> GetStakingApyRatesAsync();
}