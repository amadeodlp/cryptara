using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinanceSimplified.Models;

public class UserWallet
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    public string UserId { get; set; } = string.Empty;
    
    public string TokenSymbol { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal Balance { get; set; }
    
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}