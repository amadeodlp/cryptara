namespace FinanceSimplified.Models;

public class Token
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Decimals { get; set; } = 18;
    public string ContractAddress { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<TokenBalance> TokenBalances { get; set; } = new List<TokenBalance>();
}

public class TokenDto
{
    public string Id { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ContractAddress { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public decimal CurrentPrice { get; set; }
    public decimal PriceChangePercentage24h { get; set; }
}
