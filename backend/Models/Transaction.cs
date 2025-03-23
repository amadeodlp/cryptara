using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinanceSimplified.Models;

public class Transaction
{
    [Key]
    public int Id { get; set; }
    
    public int UserId { get; set; }
    
    public TransactionType Type { get; set; }
    
    public TransactionStatus Status { get; set; }
    
    public int? TokenFromId { get; set; }
    
    public int? TokenToId { get; set; }
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal? AmountFrom { get; set; }
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal? AmountTo { get; set; }
    
    // Keep existing properties too
    public string TokenSymbol { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal Amount { get; set; }
    
    public string? FromAddress { get; set; }
    
    public string? ToAddress { get; set; }
    
    public string? TxHash { get; set; }
    
    public string? Details { get; set; }
    
    // Add missing properties
    [Column(TypeName = "decimal(18,8)")]
    public decimal? GasFee { get; set; }
    
    public string? GasToken { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime? CompletedAt { get; set; }
    
    public DateTime Timestamp { get; set; }
    
    // Navigation property
    public virtual User? User { get; set; }
}