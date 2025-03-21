using FinanceSimplified.Data;
using FinanceSimplified.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceSimplified.Services;

public class StakingService : IStakingService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<StakingService> _logger;

    public StakingService(
        ApplicationDbContext context, 
        INotificationService notificationService,
        ILogger<StakingService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<List<StakingPosition>> GetUserStakingPositionsAsync(int userId)
    {
        return await _context.StakingPositions
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.StakedAt)
            .ToListAsync();
    }

    public async Task<StakingResult> StakeTokensAsync(int userId, string tokenSymbol, decimal amount, int duration)
    {
        if (amount <= 0)
        {
            throw new ArgumentException("Staking amount must be greater than zero.");
        }

        if (duration <= 0)
        {
            throw new ArgumentException("Staking duration must be greater than zero days.");
        }

        // Check if token exists and get APY rate for the duration
        var apyRate = await _context.StakingApyRates
            .FirstOrDefaultAsync(r => r.TokenSymbol == tokenSymbol && r.DurationDays == duration);

        if (apyRate == null)
        {
            throw new ArgumentException($"No staking program found for {tokenSymbol} with {duration} days duration.");
        }

        // Check if user has enough balance
        var userWallet = await _context.UserWallets
            .FirstOrDefaultAsync(w => w.UserId == userId && w.TokenSymbol == tokenSymbol);

        if (userWallet == null || userWallet.Balance < amount)
        {
            throw new InvalidOperationException($"Insufficient {tokenSymbol} balance for staking.");
        }

        // Create staking position
        var stakingPosition = new StakingPosition
        {
            UserId = userId,
            TokenSymbol = tokenSymbol,
            Amount = amount,
            APY = apyRate.APY,
            DurationDays = duration,
            StakedAt = DateTime.UtcNow,
            UnlockDate = DateTime.UtcNow.AddDays(duration),
            Status = StakingStatus.Active.ToString()
        };

        // Deduct from user balance
        userWallet.Balance -= amount;

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.StakingPositions.Add(stakingPosition);
            _context.UserWallets.Update(userWallet);
            await _context.SaveChangesAsync();

            // Send notification
            await _notificationService.SendNotificationAsync(
                userId, 
                "Staking Successful", 
                $"You have successfully staked {amount} {tokenSymbol} for {duration} days with {apyRate.APY}% APY."
            );

            await transaction.CommitAsync();

            return new StakingResult
            {
                Success = true,
                StakingId = stakingPosition.Id,
                Message = $"Successfully staked {amount} {tokenSymbol}",
                StakingPosition = stakingPosition
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error during token staking for user {UserId}", userId);
            throw;
        }
    }

    public async Task<StakingResult> UnstakeTokensAsync(int userId, int stakingId)
    {
        var stakingPosition = await _context.StakingPositions
            .FirstOrDefaultAsync(p => p.Id == stakingId && p.UserId == userId);

        if (stakingPosition == null)
        {
            throw new ArgumentException("Staking position not found or does not belong to user.");
        }

        if (stakingPosition.Status != StakingStatus.Active.ToString())
        {
            throw new InvalidOperationException("Cannot unstake a non-active staking position.");
        }

        bool isEarlyUnstake = DateTime.UtcNow < stakingPosition.UnlockDate;
        decimal penaltyPercentage = isEarlyUnstake ? 10m : 0m; // 10% penalty for early unstaking
        decimal penaltyAmount = stakingPosition.Amount * (penaltyPercentage / 100);
        decimal returnAmount = stakingPosition.Amount - penaltyAmount;

        // Calculate rewards if not early unstake
        decimal rewardAmount = 0;
        if (!isEarlyUnstake)
        {
            // Calculate rewards based on APY and actual staking duration
            var stakingDays = (DateTime.UtcNow - stakingPosition.StakedAt).Days;
            rewardAmount = stakingPosition.Amount * (stakingPosition.APY / 100) * (stakingDays / 365.0m);
            returnAmount += rewardAmount;
        }

        // Update user wallet
        var userWallet = await _context.UserWallets
            .FirstOrDefaultAsync(w => w.UserId == userId && w.TokenSymbol == stakingPosition.TokenSymbol);

        if (userWallet == null)
        {
            userWallet = new UserWallet
            {
                UserId = userId,
                TokenSymbol = stakingPosition.TokenSymbol,
                Balance = 0
            };
            _context.UserWallets.Add(userWallet);
        }

        userWallet.Balance += returnAmount;
        stakingPosition.Status = isEarlyUnstake ? StakingStatus.UnstakedEarly.ToString() : StakingStatus.Completed.ToString();
        stakingPosition.UnstakedAt = DateTime.UtcNow;

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.UserWallets.Update(userWallet);
            _context.StakingPositions.Update(stakingPosition);
            await _context.SaveChangesAsync();

            // Create transaction record
            var stakingTransaction = new Transaction
            {
                UserId = userId,
                Type = TransactionType.Unstake,
                TokenSymbol = stakingPosition.TokenSymbol,
                Amount = returnAmount,
                Status = TransactionStatus.Completed,
                Timestamp = DateTime.UtcNow,
                Details = $"Unstaked {stakingPosition.Amount} {stakingPosition.TokenSymbol} " +
                          $"{(isEarlyUnstake ? "early with penalty" : "with rewards")}"
            };
            _context.Transactions.Add(stakingTransaction);
            await _context.SaveChangesAsync();

            // Send notification
            string notificationMessage = isEarlyUnstake
                ? $"Early unstake completed. You received {returnAmount} {stakingPosition.TokenSymbol} after {penaltyPercentage}% penalty."
                : $"Staking completed. You received {stakingPosition.Amount} {stakingPosition.TokenSymbol} plus {rewardAmount} in rewards.";

            await _notificationService.SendNotificationAsync(
                userId,
                "Unstaking Completed",
                notificationMessage
            );

            await transaction.CommitAsync();

            return new StakingResult
            {
                Success = true,
                StakingId = stakingId,
                Message = isEarlyUnstake 
                    ? $"Early unstake completed with {penaltyPercentage}% penalty"
                    : "Unstake completed with rewards",
                StakingPosition = stakingPosition,
                ReturnAmount = returnAmount,
                Rewards = rewardAmount,
                Penalty = penaltyAmount
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error during token unstaking for user {UserId}", userId);
            throw;
        }
    }

    public async Task<StakingReward> GetStakingRewardsAsync(int userId, int stakingId)
    {
        var stakingPosition = await _context.StakingPositions
            .FirstOrDefaultAsync(p => p.Id == stakingId && p.UserId == userId);

        if (stakingPosition == null)
        {
            throw new ArgumentException("Staking position not found or does not belong to user.");
        }

        if (stakingPosition.Status != StakingStatus.Active.ToString())
        {
            return new StakingReward
            {
                StakingId = stakingId,
                TokenSymbol = stakingPosition.TokenSymbol,
                StakedAmount = stakingPosition.Amount,
                RewardAmount = 0,
                APY = stakingPosition.APY,
                Message = "This staking position is no longer active"
            };
        }

        // Calculate current rewards based on time elapsed
        var stakingDays = (DateTime.UtcNow - stakingPosition.StakedAt).Days;
        decimal rewardAmount = stakingPosition.Amount * (stakingPosition.APY / 100) * (stakingDays / 365.0m);

        // Calculate projected rewards at unlock date
        var projectedDays = stakingPosition.DurationDays;
        decimal projectedRewardAmount = stakingPosition.Amount * (stakingPosition.APY / 100) * (projectedDays / 365.0m);

        return new StakingReward
        {
            StakingId = stakingId,
            TokenSymbol = stakingPosition.TokenSymbol,
            StakedAmount = stakingPosition.Amount,
            CurrentRewardAmount = rewardAmount,
            ProjectedRewardAmount = projectedRewardAmount,
            APY = stakingPosition.APY,
            ElapsedDays = stakingDays,
            RemainingDays = Math.Max(0, (stakingPosition.UnlockDate - DateTime.UtcNow).Days),
            UnlockDate = stakingPosition.UnlockDate
        };
    }

    public async Task<List<StakingApyRate>> GetStakingApyRatesAsync()
    {
        return await _context.StakingApyRates
            .OrderBy(r => r.TokenSymbol)
            .ThenBy(r => r.DurationDays)
            .ToListAsync();
    }
}