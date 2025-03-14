namespace FinanceSimplified.Models;

public class StakingResult
{
    public bool Success { get; set; }
    
    public string StakingId { get; set; } = string.Empty;
    
    public string Message { get; set; } = string.Empty;
    
    public StakingPosition? StakingPosition { get; set; }
    
    public decimal ReturnAmount { get; set; }
    
    public decimal Rewards { get; set; }
    
    public decimal Penalty { get; set; }
}