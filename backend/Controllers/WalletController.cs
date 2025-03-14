using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinanceSimplified.Services;
using Nethereum.Web3;
using Nethereum.Contracts;
using Nethereum.ABI.FunctionEncoding.Attributes;
using System.Text.Json;
using System.Numerics;

namespace FinanceSimplified.Controllers;

[Route("api/[controller]")]
[ApiController]
public class WalletController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IPriceFeedService _priceFeedService;
    private readonly ILogger<WalletController> _logger;

    public WalletController(
        IConfiguration configuration,
        IPriceFeedService priceFeedService,
        ILogger<WalletController> logger)
    {
        _configuration = configuration;
        _priceFeedService = priceFeedService;
        _logger = logger;
    }

    [HttpGet("assets")]
    public async Task<IActionResult> GetUserAssets([FromQuery] string address)
    {
        try 
        {
            // Validate address
            if (string.IsNullOrEmpty(address))
            {
                return BadRequest(new { message = "Address is required" });
            }

            // Get ERC20 token contract addresses from configuration
            var tokenContractAddress = _configuration["Blockchain:TokenContractAddress"];
            var assets = new List<object>();

            // Try to get FIN token balance
            if (!string.IsNullOrEmpty(tokenContractAddress))
            {
                try
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
                    var etherAmount = Web3.Convert.FromWei(balance);
                    
                    // Get FIN token price from price feed service
                    var tokenPrice = await _priceFeedService.GetTokenPriceAsync("FIN");
                    var value = etherAmount * tokenPrice.Price;
                    
                    assets.Add(new
                    {
                        id = "fin",
                        name = "Finance Token",
                        symbol = "FIN",
                        amount = etherAmount.ToString(),
                        value = value.ToString("0.00"),
                        change = tokenPrice.PercentChange24h.ToString("0.0"),
                        logo = "🪙"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting FIN token balance for address {Address}", address);
                    
                    // Add a mock FIN token with zero balance as fallback
                    assets.Add(new
                    {
                        id = "fin",
                        name = "Finance Token",
                        symbol = "FIN",
                        amount = "0.00",
                        value = "0.00",
                        change = "0.0",
                        logo = "🪙"
                    });
                }
            }

            // Get other tokens from price feed
            var supportedTokens = new[] { "BTC", "ETH", "SOL" };
            
            try
            {
                var prices = await _priceFeedService.GetTokenPricesAsync(supportedTokens.ToList());
                
                // For demo purposes, we'll use mock balances for these tokens
                // In a real app, you would query actual balances from blockchain explorers or aggregators
                var mockBalances = new Dictionary<string, decimal>
                {
                    { "BTC", 0.01m },
                    { "ETH", 0.1m },
                    { "SOL", 1.5m }
                };
                
                foreach (var token in prices)
                {
                    var balance = mockBalances.ContainsKey(token.Symbol) ? mockBalances[token.Symbol] : 0m;
                    var value = balance * token.Price;
                    
                    string logo = token.Symbol switch
                    {
                        "BTC" => "₿",
                        "ETH" => "🔷",
                        "SOL" => "◎",
                        _ => "💰"
                    };
                    
                    assets.Add(new
                    {
                        id = token.Symbol.ToLower(),
                        name = token.Name,
                        symbol = token.Symbol,
                        amount = balance.ToString(),
                        value = value.ToString("0.00"),
                        change = token.PercentChange24h.ToString("0.0"),
                        logo = logo
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting token prices for address {Address}", address);
            }
            
            return Ok(assets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assets for address {Address}", address);
            return StatusCode(500, new { message = "Error retrieving assets" });
        }
    }

    [HttpGet("balance/{address}")]
    public async Task<IActionResult> GetWalletBalance(string address)
    {
        try
        {
            var tokenContractAddress = _configuration["Blockchain:TokenContractAddress"];
            var walletContractAddress = _configuration["Blockchain:WalletContractAddress"];
            
            if (string.IsNullOrEmpty(tokenContractAddress) || string.IsNullOrEmpty(walletContractAddress))
            {
                return BadRequest(new { message = "Contract addresses not configured" });
            }
            
            var infuraUrl = _configuration["Blockchain:InfuraUrl"];
            var web3 = new Web3(infuraUrl);
            
            // Call the wallet contract to get the user's token balance
            var contractAbi = @"[{""inputs"":[{""internalType"":""address"",""name"":""token"",""type"":""address""},{""internalType"":""address"",""name"":""user"",""type"":""address""}],""name"":""balanceOf"",""outputs"":[{""internalType"":""uint256"",""name"":"""",""type"":""uint256""}],""stateMutability"":""view"",""type"":""function""}]";
            var contract = web3.Eth.GetContract(contractAbi, walletContractAddress);
            
            var balanceFunction = contract.GetFunction("balanceOf");
            var balance = await balanceFunction.CallAsync<BigInteger>(tokenContractAddress, address);
            
            var etherAmount = Web3.Convert.FromWei(balance);
            
            return Ok(new { address, token = "FIN", balance = etherAmount.ToString() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting wallet balance for address {Address}", address);
            return StatusCode(500, new { message = "Error retrieving wallet balance" });
        }
    }
}
