using System.ComponentModel.DataAnnotations;

namespace FinanceSimplified.Models;

public class StakingApyRate
{
    [Key]
    public int Id { get; set; }
    
    public string TokenSymbol { get; set; } = string.Empty;
    
    public int DurationDays { get; set; }
    
    public decimal APY { get; set; }
    
    public bool IsActive { get; set; }
}