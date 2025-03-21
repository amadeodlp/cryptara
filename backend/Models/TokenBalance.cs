namespace FinanceSimplified.Models;

public class TokenBalance
{
    public int WalletId { get; set; }
    public int TokenId { get; set; }
    public decimal Balance { get; set; }
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Wallet Wallet { get; set; } = null!;
    public virtual Token Token { get; set; } = null!;
}

public class TokenBalanceDto
{
    public int TokenId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal UsdValue { get; set; }
}
