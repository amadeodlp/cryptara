using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinanceSimplified.Models;

public class StakingPosition
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    public string UserId { get; set; } = string.Empty;
    
    public string TokenSymbol { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal Amount { get; set; }
    
    public decimal APY { get; set; }
    
    public int DurationDays { get; set; }
    
    public DateTime StakedAt { get; set; }
    
    public DateTime UnlockDate { get; set; }
    
    public DateTime? UnstakedAt { get; set; }
    
    public string Status { get; set; } = string.Empty; // Active, UnstakedEarly, Completed
}