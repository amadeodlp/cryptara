using Microsoft.AspNetCore.Mvc;
using FinanceSimplified.Services;
using Nethereum.Web3;
using System.Numerics;

namespace FinanceSimplified.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PortfolioController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IPriceFeedService _priceFeedService;
    private readonly ILogger<PortfolioController> _logger;
    private readonly Random _random;

    public PortfolioController(
        IConfiguration configuration,
        IPriceFeedService priceFeedService,
        ILogger<PortfolioController> logger)
    {
        _configuration = configuration;
        _priceFeedService = priceFeedService;
        _logger = logger;
        _random = new Random();
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetPortfolioHistory([FromQuery] string address, [FromQuery] string timeframe = "1m")
    {
        try
        {
            // Validate inputs
            if (string.IsNullOrEmpty(address))
            {
                return BadRequest(new { message = "Address is required" });
            }

            var validTimeframes = new[] { "1d", "1w", "1m", "3m", "1y", "all" };
            if (!validTimeframes.Contains(timeframe))
            {
                return BadRequest(new { message = "Invalid timeframe. Valid options: 1d, 1w, 1m, 3m, 1y, all" });
            }

            // In a production environment, you'd query historical balances and prices
            // For this demo, we'll generate simulated data

            var days = timeframe switch
            {
                "1d" => 1,
                "1w" => 7,
                "1m" => 30,
                "3m" => 90,
                "1y" => 365,
                "all" => 730,
                _ => 30
            };

            // Try to get user's current FIN token balance as baseline
            decimal currentBalance = 0;
            try
            {
                var tokenContractAddress = _configuration["Blockchain:TokenContractAddress"];
                if (!string.IsNullOrEmpty(tokenContractAddress))
                {
                    var infuraUrl = _configuration["Blockchain:InfuraUrl"];
                    var web3 = new Web3(infuraUrl);
                    
                    // Create contract instance
                    var contractAbi = @"[{""inputs"":[{""internalType"":""address"",""name"":""owner"",""type"":""address""}],""name"":""balanceOf"",""outputs"":[{""internalType"":""uint256"",""name"":"""",""type"":""uint256""}],""stateMutability"":""view"",""type"":""function""}]";
                    var contract = web3.Eth.GetContract(contractAbi, tokenContractAddress);
                    
                    // Call balanceOf function
                    var balanceFunction = contract.GetFunction("balanceOf");
                    var balance = await balanceFunction.CallAsync<BigInteger>(address);
                    
                    // Convert wei to ether
                    currentBalance = Web3.Convert.FromWei(balance);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current token balance for address {Address}", address);
                // Use default balance of 1000 tokens for demo purposes
                currentBalance = 1000m;
            }

            // Get current token price
            decimal currentPrice = 1.65m; // Default fallback price
            try
            {
                var priceData = await _priceFeedService.GetTokenPriceAsync("FIN");
                currentPrice = priceData.Price;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current token price");
            }

            // Generate historical data
            var historicalData = GenerateHistoricalData(days, currentBalance, currentPrice);
            
            return Ok(historicalData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting portfolio history for address {Address}", address);
            return StatusCode(500, new { message = "Error retrieving portfolio history" });
        }
    }

    [HttpGet("performance")]
    public async Task<IActionResult> GetPortfolioPerformance([FromQuery] string address)
    {
        try
        {
            if (string.IsNullOrEmpty(address))
            {
                return BadRequest(new { message = "Address is required" });
            }

            // In a real implementation, you'd calculate actual performance metrics
            // For this demo, we'll generate performance data for the assets we support

            // Get token prices to use real price data where possible
            var symbols = new[] { "FIN", "BTC", "ETH", "SOL" };
            var performances = new List<object>();
            
            try
            {
                var prices = await _priceFeedService.GetTokenPricesAsync(symbols.ToList());
                
                foreach (var token in prices)
                {
                    performances.Add(new
                    {
                        name = token.Name,
                        // Use real 24h change if available, otherwise generate random value
                        @return = token.PercentChange24h
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting token prices for performance");
                
                // Fallback to simulated performance data
                performances = new List<object>
                {
                    new { name = "Finance Token", @return = 12.5 },
                    new { name = "Bitcoin", @return = 5.2 },
                    new { name = "Ethereum", @return = 8.7 },
                    new { name = "Solana", @return = -2.1 }
                };
            }
            
            return Ok(performances);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting portfolio performance for address {Address}", address);
            return StatusCode(500, new { message = "Error retrieving portfolio performance" });
        }
    }

    // Helper to generate historical value data
    private List<object> GenerateHistoricalData(int days, decimal currentBalance, decimal currentPrice)
    {
        var now = DateTime.UtcNow;
        var data = new List<object>();
        
        // Calculate current portfolio value
        var currentValue = currentBalance * currentPrice;
        
        // Use a random walk with slight upward trend to simulate historical values
        var value = currentValue;
        
        for (int i = 0; i <= days; i++)
        {
            var date = now.AddDays(-days + i);
            
            if (i < days)
            {
                // For past days, calculate backward from current value
                // Add randomness and slight downward trend (since we're going backward in time)
                var randomFactor = 0.98m + (decimal)(_random.NextDouble() * 0.04); // ±2%
                value /= randomFactor * 1.0005m; // Slight trend factor
            }
            
            data.Add(new
            {
                date = date.ToString("yyyy-MM-dd"),
                value = Math.Round(value, 2)
            });
        }
        
        return data;
    }
}
