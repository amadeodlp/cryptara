using System.Security.Cryptography; // Still needed for legacy hash verification
using System.Text; // Still needed for legacy hash verification
using BCrypt.Net;
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
        
        if (user == null)
            return null;
            
        bool isAuthenticated = false;
        
        // Check if the hash is in BCrypt format
        if (user.PasswordHash.StartsWith("$2a$") || user.PasswordHash.StartsWith("$2b$") || user.PasswordHash.StartsWith("$2y$"))
        {
            // BCrypt hash - use BCrypt verification
            isAuthenticated = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        }
        else
        {
            // Legacy SHA256 hash - verify with old method
            isAuthenticated = VerifyPasswordLegacy(password, user.PasswordHash);
            
            // If authenticated with legacy hash, upgrade to BCrypt
            if (isAuthenticated)
            {
                _logger.LogInformation("Upgrading password hash to BCrypt for user {Email}", user.Email);
                user.PasswordHash = HashPassword(password);
            }
        }
        
        // Return null if password is wrong
        if (!isAuthenticated)
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

        try 
        {
            // Log the detailed process
            _logger.LogInformation("Starting user registration process for {Email}", email);
            
            // Use a transaction to ensure atomicity
            using var transaction = await _dbContext.Database.BeginTransactionAsync();

            // Create the user without specifying an ID - let the database generate it
            var newUser = new User
            {
                Name = name,
                Email = email,
                PasswordHash = HashPassword(password),
                CreatedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Adding user to database");
            _dbContext.Users.Add(newUser);
            
            try {
                await _dbContext.SaveChangesAsync(); // Save to generate the ID
                _logger.LogInformation("Successfully saved user with auto-generated ID: {UserId}", newUser.Id);
            }
            catch (Exception ex) {
                _logger.LogError(ex, "Error saving user");
                throw; // Re-throw to be caught by outer catch block
            }
            
            // Create a wallet for the new user without specifying an ID
            var wallet = new Wallet
            {
                UserId = newUser.Id,
                IsConnected = false,
                CreatedAt = DateTime.UtcNow
            };
            
            _logger.LogInformation("Adding wallet to database for user {UserId}", newUser.Id);
            _dbContext.Wallets.Add(wallet);
            
            try {
                await _dbContext.SaveChangesAsync();
                _logger.LogInformation("Successfully saved wallet with auto-generated ID: {WalletId}", wallet.Id);
            }
            catch (Exception ex) {
                _logger.LogError(ex, "Error saving wallet");
                throw; // Re-throw to be caught by outer catch block
            }

            // Get predefined tokens
            var tokens = await _dbContext.Tokens.Where(t => t.IsActive).ToListAsync();

            // Add token balances with zero balance
            foreach (var token in tokens)
            {
                var tokenBalance = new TokenBalance
                {
                    WalletId = wallet.Id,
                    TokenId = token.Id,
                    Balance = 0,
                    LastUpdatedAt = DateTime.UtcNow
                };
                
                _dbContext.TokenBalances.Add(tokenBalance);
            }
            
            try {
                await _dbContext.SaveChangesAsync();
                _logger.LogInformation("Successfully saved token balances for wallet {WalletId}", wallet.Id);
                
                await transaction.CommitAsync();
                _logger.LogInformation("Successfully committed transaction for user {UserId}", newUser.Id);
                
                return true;
            }
            catch (Exception ex) {
                _logger.LogError(ex, "Error saving token balances or committing transaction");
                throw; // Re-throw to be caught by outer catch block
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering user {Email}", email);
            return false;
        }
    }

    public async Task<bool> UpdateUserAsync(User user)
    {
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    // This method is used for creating new password hashes with BCrypt
    private static string HashPassword(string password)
    {
        // Generate a salt and hash the password using BCrypt
        return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
    }
    
    // Legacy SHA256 password verification - only for backwards compatibility
    private static bool VerifyPasswordLegacy(string password, string hash)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        var hashedPassword = Convert.ToBase64String(hashedBytes);
        return hashedPassword == hash;
    }
}
