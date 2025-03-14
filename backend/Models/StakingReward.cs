using System.ComponentModel.DataAnnotations.Schema;

namespace FinanceSimplified.Models;

public class StakingReward
{
    public string StakingId { get; set; } = string.Empty;
    
    public string TokenSymbol { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal StakedAmount { get; set; }
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal RewardAmount { get; set; } // This was missing and causing the error
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal CurrentRewardAmount { get; set; }
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal ProjectedRewardAmount { get; set; }
    
    public decimal APY { get; set; }
    
    public int ElapsedDays { get; set; }
    
    public int RemainingDays { get; set; }
    
    public DateTime UnlockDate { get; set; }
    
    public string Message { get; set; } = string.Empty;
}