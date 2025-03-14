using System.Security.Cryptography;
using System.Text;
using FinanceSimplified.Models;
using FinanceSimplified.Data;
using Microsoft.EntityFrameworkCore;

namespace FinanceSimplified.Services;

public interface IUserService
{
    Task<User?> AuthenticateAsync(string email, string password);
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByEmailAsync(string email);
    Task<bool> RegisterAsync(string name, string email, string password);
    Task<bool> UpdateUserAsync(User user);
}

public class UserService : IUserService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<UserService> _logger;

    public UserService(ApplicationDbContext dbContext, ILogger<UserService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<User?> AuthenticateAsync(string email, string password)
    {
        var user = await _dbContext.Users
            .SingleOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        
        // Return null if user not found or password is wrong
        if (user == null || !VerifyPassword(password, user.PasswordHash))
            return null;

        // Update last login timestamp
        user.LastLoginAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return user;
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        return await _dbContext.Users.FindAsync(id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbContext.Users
            .SingleOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<bool> RegisterAsync(string name, string email, string password)
    {
        // Check if email already exists
        if (await _dbContext.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower()))
        {
            return false;
        }

        var newUser = new User
        {
            Name = name,
            Email = email,
            PasswordHash = HashPassword(password),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Users.Add(newUser);
        
        // Create a wallet for the new user
        var wallet = new Wallet
        {
            UserId = newUser.Id,
            IsConnected = false,
            CreatedAt = DateTime.UtcNow
        };
        
        _dbContext.Wallets.Add(wallet);
        
        await _dbContext.SaveChangesAsync();
        
        return true;
    }

    public async Task<bool> UpdateUserAsync(User user)
    {
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();
        return true;
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
