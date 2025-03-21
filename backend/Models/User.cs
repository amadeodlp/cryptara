namespace FinanceSimplified.Models;

public class User
{
    // Don't set a default value - let the database generate the ID
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public virtual Wallet? Wallet { get; set; }
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}

