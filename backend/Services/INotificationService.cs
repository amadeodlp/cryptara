using FinanceSimplified.Models;

namespace FinanceSimplified.Services;

public interface INotificationService
{
    Task<bool> SendNotificationAsync(string userId, string title, string message, string? actionLink = null);
    Task<List<Notification>> GetUserNotificationsAsync(string userId, int limit = 20, bool unreadOnly = false);
    Task<bool> MarkNotificationAsReadAsync(string notificationId);
    Task<bool> MarkAllNotificationsAsReadAsync(string userId);
    Task<bool> DeleteNotificationAsync(string notificationId);
}