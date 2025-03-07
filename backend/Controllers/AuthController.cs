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
    public IActionResult Login([FromBody] LoginRequest model)
    {
        _logger.LogInformation("Login attempt for {Email}", model.Email);

        var user = _userService.Authenticate(model.Email, model.Password);

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
}
