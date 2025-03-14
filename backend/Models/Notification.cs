using System.ComponentModel.DataAnnotations;

namespace FinanceSimplified.Models;

public class Notification
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    public string UserId { get; set; } = string.Empty;
    
    public string Title { get; set; } = string.Empty;
    
    public string Message { get; set; } = string.Empty;
    
    public string? ActionLink { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public bool IsRead { get; set; }
    
    public DateTime? ReadAt { get; set; }
}