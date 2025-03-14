using FinanceSimplified.Data;
using FinanceSimplified.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceSimplified.Services;

public interface IWalletService
{
    Task<Wallet?> GetWalletByUserIdAsync(string userId);
    Task<Wallet?> GetWalletByAddressAsync(string address);
    Task<bool> ConnectWalletAsync(string userId, string address);
    Task<bool> DisconnectWalletAsync(string userId);
    Task<List<TokenBalanceDto>> GetTokenBalancesAsync(string userId);
    Task<bool> UpdateTokenBalanceAsync(string userId, string tokenId, decimal amount);
}

public class WalletService : IWalletService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<WalletService> _logger;

    public WalletService(ApplicationDbContext dbContext, ILogger<WalletService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<Wallet?> GetWalletByUserIdAsync(string userId)
    {
        return await _dbContext.Wallets
            .Include(w => w.TokenBalances)
            .ThenInclude(tb => tb.Token)
            .SingleOrDefaultAsync(w => w.UserId == userId);
    }

    public async Task<Wallet?> GetWalletByAddressAsync(string address)
    {
        return await _dbContext.Wallets
            .Include(w => w.TokenBalances)
            .ThenInclude(tb => tb.Token)
            .SingleOrDefaultAsync(w => w.Address == address);
    }

    public async Task<bool> ConnectWalletAsync(string userId, string address)
    {
        var wallet = await _dbContext.Wallets.SingleOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            _logger.LogError("Wallet not found for user ID: {UserId}", userId);
            return false;
        }

        wallet.Address = address;
        wallet.IsConnected = true;
        wallet.LastUpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DisconnectWalletAsync(string userId)
    {
        var wallet = await _dbContext.Wallets.SingleOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            _logger.LogError("Wallet not found for user ID: {UserId}", userId);
            return false;
        }

        wallet.IsConnected = false;
        wallet.LastUpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<List<TokenBalanceDto>> GetTokenBalancesAsync(string userId)
    {
        var wallet = await _dbContext.Wallets
            .Include(w => w.TokenBalances)
            .ThenInclude(tb => tb.Token)
            .SingleOrDefaultAsync(w => w.UserId == userId);

        if (wallet == null)
        {
            _logger.LogError("Wallet not found for user ID: {UserId}", userId);
            return new List<TokenBalanceDto>();
        }

        return wallet.TokenBalances.Select(tb => new TokenBalanceDto
        {
            TokenId = tb.TokenId,
            Symbol = tb.Token.Symbol,
            Name = tb.Token.Name,
            Balance = tb.Balance,
            UsdValue = 0 // In a real app, you would calculate this based on current prices
        }).ToList();
    }

    public async Task<bool> UpdateTokenBalanceAsync(string userId, string tokenId, decimal amount)
    {
        var wallet = await _dbContext.Wallets.SingleOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            _logger.LogError("Wallet not found for user ID: {UserId}", userId);
            return false;
        }

        var tokenBalance = await _dbContext.TokenBalances
            .SingleOrDefaultAsync(tb => tb.WalletId == wallet.Id && tb.TokenId == tokenId);

        if (tokenBalance == null)
        {
            // Create a new token balance if it doesn't exist
            tokenBalance = new TokenBalance
            {
                WalletId = wallet.Id,
                TokenId = tokenId,
                Balance = amount,
                LastUpdatedAt = DateTime.UtcNow
            };
            _dbContext.TokenBalances.Add(tokenBalance);
        }
        else
        {
            // Update existing token balance
            tokenBalance.Balance = amount;
            tokenBalance.LastUpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync();
        return true;
    }
}
