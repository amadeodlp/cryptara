using FinanceSimplified.Data;
using FinanceSimplified.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceSimplified.Services;

public interface ITransactionService
{
    Task<Transaction?> GetTransactionByIdAsync(string id);
    Task<List<TransactionDto>> GetUserTransactionsAsync(string userId, int skip = 0, int take = 20);
    Task<string> CreateTransactionAsync(Transaction transaction);
    Task<bool> UpdateTransactionStatusAsync(string id, TransactionStatus status);
}

public class TransactionService : ITransactionService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<TransactionService> _logger;

    public TransactionService(ApplicationDbContext dbContext, ILogger<TransactionService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<Transaction?> GetTransactionByIdAsync(string id)
    {
        return await _dbContext.Transactions.FindAsync(id);
    }

    public async Task<List<TransactionDto>> GetUserTransactionsAsync(string userId, int skip = 0, int take = 20)
    {
        var transactions = await _dbContext.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.Timestamp)
            .Skip(skip)
            .Take(take)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                Type = t.Type.ToString(),
                Status = t.Status.ToString(),
                TokenFrom = t.TokenSymbol, // Using the same token for simplicity
                TokenTo = t.TokenSymbol,  // Using the same token for simplicity
                AmountFrom = t.Amount,
                AmountTo = t.Amount,      // Using the same amount for simplicity
                FromAddress = t.FromAddress,
                ToAddress = t.ToAddress,
                TxHash = t.TxHash,
                GasFee = 0,               // Default value
                GasToken = "ETH",          // Default value
                CreatedAt = t.Timestamp,
                CompletedAt = t.Status == TransactionStatus.Completed ? t.Timestamp : null
            })
            .ToListAsync();

        return transactions;
    }

    public async Task<string> CreateTransactionAsync(Transaction transaction)
    {
        _dbContext.Transactions.Add(transaction);
        await _dbContext.SaveChangesAsync();
        return transaction.Id;
    }

    public async Task<bool> UpdateTransactionStatusAsync(string id, TransactionStatus status)
    {
        var transaction = await _dbContext.Transactions.FindAsync(id);
        if (transaction == null)
        {
            _logger.LogError("Transaction not found with ID: {Id}", id);
            return false;
        }

        transaction.Status = status;
        
        if (status == TransactionStatus.Completed)
        {
            // Update timestamp for completed transactions
            transaction.Timestamp = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync();
        return true;
    }
}
