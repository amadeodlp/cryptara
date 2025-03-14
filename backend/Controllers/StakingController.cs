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
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var stakingPositions = await _stakingService.GetUserStakingPositionsAsync(userId);
        return Ok(stakingPositions);
    }

    [HttpPost("stake")]
    public async Task<IActionResult> StakeTokens([FromBody] StakeRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        _logger.LogInformation("Staking request: {Amount} {TokenSymbol} for user {UserId}", 
            request.Amount, request.TokenSymbol, userId);

        try
        {
            var result = await _stakingService.StakeTokensAsync(userId, request.TokenSymbol, request.Amount, request.Duration);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token staking for user {UserId}", userId);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("unstake/{stakingId}")]
    public async Task<IActionResult> UnstakeTokens(string stakingId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        _logger.LogInformation("Unstaking request: StakingId {StakingId} for user {UserId}", 
            stakingId, userId);

        try
        {
            var result = await _stakingService.UnstakeTokensAsync(userId, stakingId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token unstaking for user {UserId}", userId);
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("rewards/{stakingId}")]
    public async Task<IActionResult> GetStakingRewards(string stakingId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        try
        {
            var rewards = await _stakingService.GetStakingRewardsAsync(userId, stakingId);
            return Ok(rewards);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staking rewards for user {UserId}", userId);
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
