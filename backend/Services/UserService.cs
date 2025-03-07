using System.Security.Cryptography;
using System.Text;
using FinanceSimplified.Models;

namespace FinanceSimplified.Services;

public interface IUserService
{
    User? Authenticate(string email, string password);
}

public class UserService : IUserService
{
    // For simplicity, we're using an in-memory user instead of a database
    // In a real application, you would use a database
    private readonly List<User> _users;

    public UserService()
    {
        // Create a test user for development
        _users = new List<User>
        {
            new User
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test User",
                Email = "test@example.com",
                PasswordHash = HashPassword("password123")
            }
        };
    }

    public User? Authenticate(string email, string password)
    {
        var user = _users.SingleOrDefault(x => x.Email == email);
        
        // Return null if user not found or password is wrong
        if (user == null || !VerifyPassword(password, user.PasswordHash))
            return null;

        return user;
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return HashPassword(password) == hash;
    }
}
