using System.ComponentModel.DataAnnotations.Schema;

namespace FinanceSimplified.Models;

public class TransactionDto
{
    public string Id { get; set; } = string.Empty;
    
    public string Type { get; set; } = string.Empty;
    
    public string Status { get; set; } = string.Empty;
    
    public string? TokenFrom { get; set; }
    
    public string? TokenTo { get; set; }
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal AmountFrom { get; set; }
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal AmountTo { get; set; }
    
    public string? FromAddress { get; set; }
    
    public string? ToAddress { get; set; }
    
    public string? TxHash { get; set; }
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal GasFee { get; set; }
    
    public string? GasToken { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime? CompletedAt { get; set; }
}