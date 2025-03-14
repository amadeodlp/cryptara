using FinanceSimplified.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinanceSimplified.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PriceFeedController : ControllerBase
{
    private readonly IPriceFeedService _priceFeedService;
    private readonly ILogger<PriceFeedController> _logger;

    public PriceFeedController(
        IPriceFeedService priceFeedService,
        ILogger<PriceFeedController> logger)
    {
        _priceFeedService = priceFeedService;
        _logger = logger;
    }

    [HttpGet("{symbol}")]
    public async Task<IActionResult> GetTokenPrice(string symbol)
    {
        try
        {
            var price = await _priceFeedService.GetTokenPriceAsync(symbol);
            return Ok(price);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting price for token {Symbol}", symbol);
            return StatusCode(500, new { message = $"Error retrieving price for {symbol}" });
        }
    }

    [HttpGet("bulk")]
    public async Task<IActionResult> GetBulkTokenPrices([FromQuery] string symbols)
    {
        try
        {
            if (string.IsNullOrEmpty(symbols))
            {
                return BadRequest(new { message = "No symbols provided" });
            }

            var symbolList = symbols.Split(',').Select(s => s.Trim()).ToList();
            var prices = await _priceFeedService.GetTokenPricesAsync(symbolList);
            return Ok(prices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting bulk prices for tokens {Symbols}", symbols);
            return StatusCode(500, new { message = "Error retrieving token prices" });
        }
    }

    [HttpGet("{symbol}/history")]
    public async Task<IActionResult> GetTokenPriceHistory(string symbol, [FromQuery] string timeframe = "30d")
    {
        try
        {
            var validTimeframes = new[] { "1d", "7d", "30d", "90d", "1y" };
            if (!validTimeframes.Contains(timeframe))
            {
                return BadRequest(new { message = "Invalid timeframe. Valid options: 1d, 7d, 30d, 90d, 1y" });
            }

            var history = await _priceFeedService.GetTokenPriceHistoryAsync(symbol, timeframe);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting price history for token {Symbol} with timeframe {Timeframe}", symbol, timeframe);
            return StatusCode(500, new { message = $"Error retrieving price history for {symbol}" });
        }
    }
}