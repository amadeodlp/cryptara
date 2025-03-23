namespace FinanceSimplified.Models;

public class StakingResult
{
    public bool Success { get; set; }
    
    public int StakingId { get; set; }
    
    public string Message { get; set; } = string.Empty;
    
    public StakingPosition? StakingPosition { get; set; }
    
    public decimal ReturnAmount { get; set; }
    
    public decimal Rewards { get; set; }
    
    public decimal Penalty { get; set; }
}