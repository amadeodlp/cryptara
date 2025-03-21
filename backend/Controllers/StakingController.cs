using FinanceSimplified.Models;
using FinanceSimplified.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinanceSimplified.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class StakingController : ControllerBase
{
    private readonly IStakingService _stakingService;
    private readonly ILogger<StakingController> _logger;

    public StakingController(
        IStakingService stakingService,
        ILogger<StakingController> logger)
    {
        _stakingService = stakingService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetUserStakingPositions()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        try
        {
            int userId = int.Parse(userIdString);
            var stakingPositions = await _stakingService.GetUserStakingPositionsAsync(userId);
            return Ok(stakingPositions);
        }
        catch (FormatException)
        {
            return BadRequest(new { message = "Invalid user ID format" });
        }
    }

    [HttpPost("stake")]
    public async Task<IActionResult> StakeTokens([FromBody] StakeRequest request)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        try
        {
            int userId = int.Parse(userIdString);
            _logger.LogInformation("Staking request: {Amount} {TokenSymbol} for user {UserId}", 
                request.Amount, request.TokenSymbol, userId);

            var result = await _stakingService.StakeTokensAsync(userId, request.TokenSymbol, request.Amount, request.Duration);
            return Ok(result);
        }
        catch (FormatException)
        {
            return BadRequest(new { message = "Invalid user ID format" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token staking for user {UserId}", userIdString);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("unstake/{stakingId}")]
    public async Task<IActionResult> UnstakeTokens(string stakingId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        try
        {
            int userId = int.Parse(userIdString);
            int stakingIdInt = int.Parse(stakingId);
            
            _logger.LogInformation("Unstaking request: StakingId {StakingId} for user {UserId}", 
                stakingIdInt, userId);

            var result = await _stakingService.UnstakeTokensAsync(userId, stakingIdInt);
            return Ok(result);
        }
        catch (FormatException)
        {
            return BadRequest(new { message = "Invalid ID format" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token unstaking for user {UserId}", userIdString);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("rewards/{stakingId}")]
    public async Task<IActionResult> GetStakingRewards(string stakingId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        try
        {
            int userId = int.Parse(userIdString);
            int stakingIdInt = int.Parse(stakingId);
            
            var rewards = await _stakingService.GetStakingRewardsAsync(userId, stakingIdInt);
            return Ok(rewards);
        }
        catch (FormatException)
        {
            return BadRequest(new { message = "Invalid ID format" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staking rewards for user {UserId}", userIdString);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("apy")]
    public async Task<IActionResult> GetStakingAPY()
    {
        try
        {
            var apyRates = await _stakingService.GetStakingApyRatesAsync();
            return Ok(apyRates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staking APY rates");
            return StatusCode(500, new { message = "Failed to retrieve staking APY rates" });
        }
    }
}

public class StakeRequest
{
    public string TokenSymbol { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Duration { get; set; } // Duration in days
}
