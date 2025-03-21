using FinanceSimplified.Models;
using FinanceSimplified.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Data;

namespace FinanceSimplified.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IUserService userService,
        ITokenService tokenService,
        ILogger<AuthController> logger)
    {
        _userService = userService;
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest model)
    {
        _logger.LogInformation("Login attempt for {Email}", model.Email);

        var user = await _userService.AuthenticateAsync(model.Email, model.Password);

        if (user == null)
        {
            _logger.LogWarning("Login failed for {Email}", model.Email);
            return Unauthorized(new { message = "Invalid email or password" });
        }

        var token = _tokenService.GenerateToken(user);

        _logger.LogInformation("Login successful for {Email}", model.Email);

        return Ok(new LoginResponse
        {
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name
            },
            Token = token
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest model)
    {
        try
        {
            _logger.LogInformation("Registration attempt for {Email}", model.Email);

            // Basic validation
            if (string.IsNullOrWhiteSpace(model.Email) || string.IsNullOrWhiteSpace(model.Name))
            {
                return BadRequest(new { message = "Email and name are required fields" });
            }

            // Check if email already exists
            var existingUser = await _userService.GetByEmailAsync(model.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("Registration failed: Email {Email} already exists", model.Email);
                return BadRequest(new { message = "Email already exists" });
            }

            // Validate password
            if (string.IsNullOrWhiteSpace(model.Password) || model.Password.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters" });
            }

            // Log the GUID generation to verify the format being used
            var testId = Guid.NewGuid().ToString("N").Substring(0, 20);
            _logger.LogInformation("Test ID generated: {Id} with length {Length}", testId, testId.Length);

            // Register new user
            var success = await _userService.RegisterAsync(model.Name, model.Email, model.Password);
            if (!success)
            {
                _logger.LogError("Registration failed for {Email}", model.Email);
                return StatusCode(500, new { message = "Failed to register user. Please try again later." });
            }

            _logger.LogInformation("Registration successful for {Email}", model.Email);
            return Ok(new { message = "Registration successful" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception during registration for {Email}", model.Email);
            return StatusCode(500, new { message = "An unexpected error occurred. Please try again later." });
        }
    }
    
    [HttpGet("debug/schema")]
    public async Task<IActionResult> DebugSchema()
    {
        try
        {
            // Get the DbContext from the DI container
            var dbContext = HttpContext.RequestServices.GetRequiredService<FinanceSimplified.Data.ApplicationDbContext>();
            
            // Create a test ID to check the format
            var testId = Guid.NewGuid().ToString("N").Substring(0, 20);
            
            // Get the User entity type
            var userEntityType = dbContext.Model.FindEntityType(typeof(FinanceSimplified.Models.User));
            var userProperties = userEntityType.GetProperties().Select(p => new {
                Name = p.Name,
                ColumnName = p.GetColumnName(),
                ClrType = p.ClrType.Name,
                ProviderClrType = p.GetColumnType(),
                IsKey = p.IsKey()
            }).ToList();
            
            return Ok(new {
                TestId = testId,
                TestIdLength = testId.Length,
                UserProperties = userProperties
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.ToString() });
        }
    }
    
    [HttpGet("debug/db-schema")]
    public async Task<IActionResult> GetDatabaseSchema()
    {
        try
        {
            _logger.LogInformation("Querying database schema");
            
            // Get the DbContext from the DI container
            var dbContext = HttpContext.RequestServices.GetRequiredService<FinanceSimplified.Data.ApplicationDbContext>();
            
            // Check MySQL version
            string sqlVersion = "Unknown";
            try {
                var connection = dbContext.Database.GetDbConnection();
                await connection.OpenAsync();
                
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT VERSION()";
                
                var result = await command.ExecuteScalarAsync();
                if (result != null) {
                    sqlVersion = result.ToString();
                }
                
                await connection.CloseAsync();
            } catch (Exception ex) {
                _logger.LogError(ex, "Error getting SQL version");
            }
            
            // Use raw SQL to query the database schema - adjust the query based on MySQL
            var userTableInfo = new List<Dictionary<string, object>>();
            
            // Get table structure in MySQL
            var connection = dbContext.Database.GetDbConnection();
            try {
                await connection.OpenAsync();
                
                using var command = connection.CreateCommand();
                command.CommandText = "DESCRIBE users";
                
                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<string, object>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        row[reader.GetName(i)] = reader.GetValue(i);
                    }
                    userTableInfo.Add(row);
                }
            }
            finally {
                if (connection.State == System.Data.ConnectionState.Open)
                    await connection.CloseAsync();
            }
            
            return Ok(new { 
                SqlVersion = sqlVersion,
                UserTableSchema = userTableInfo
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.ToString() });
        }
    }
    
    [HttpGet("debug/test-user-creation")]
    public async Task<IActionResult> TestUserCreation()
    {
        try
        {
            _logger.LogInformation("Testing user creation with various ID formats");
            
            // Get the DbContext from the DI container
            var dbContext = HttpContext.RequestServices.GetRequiredService<FinanceSimplified.Data.ApplicationDbContext>();
            
            // Generate different formats of IDs for testing
            var idFormats = new Dictionary<string, string>
            {
                { "Standard GUID", Guid.NewGuid().ToString() },
                { "No hyphens", Guid.NewGuid().ToString("N") },
                { "Truncated to 20", Guid.NewGuid().ToString("N").Substring(0, 20) },
                { "Numeric only", "123456789012345678" }, // Numeric ID to test if the column is actually INTEGER/SERIAL
                { "Short", "test" } // Very short ID to see if there's a minimum length constraint
            };
            
            var results = new List<object>();
            
            // Try inserting and then immediately removing test users with each ID format
            foreach (var format in idFormats)
            {
                var testEmail = $"test-{Guid.NewGuid().ToString("N")}@example.com";
                
                try
                {
                    // Create test user with this ID format
                    var user = new FinanceSimplified.Models.User
                    {
                        Id = format.Value,
                        Name = "Test User",
                        Email = testEmail,
                        PasswordHash = "TestHash",
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    // Add to db and save
                    dbContext.Users.Add(user);
                    await dbContext.SaveChangesAsync();
                    
                    // If we get here, insertion succeeded
                    results.Add(new {
                        FormatName = format.Key,
                        Id = format.Value,
                        Success = true,
                        Message = "User created successfully"
                    });
                    
                    // Now delete the test user
                    dbContext.Users.Remove(user);
                    await dbContext.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    // Record the failure
                    results.Add(new {
                        FormatName = format.Key,
                        Id = format.Value,
                        Success = false,
                        Error = ex.ToString()
                    });
                }
            }
            
            return Ok(new { TestResults = results });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.ToString() });
        }
    }
}

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
