using FinanceSimplified.Models;
using FinanceSimplified.Services;
using Microsoft.AspNetCore.Mvc;

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
        _logger.LogInformation("Registration attempt for {Email}", model.Email);

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

        // Register new user
        var success = await _userService.RegisterAsync(model.Name, model.Email, model.Password);
        if (!success)
        {
            _logger.LogError("Registration failed for {Email}", model.Email);
            return StatusCode(500, new { message = "Failed to register user" });
        }

        _logger.LogInformation("Registration successful for {Email}", model.Email);
        return Ok(new { message = "Registration successful" });
    }
}

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
