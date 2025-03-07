using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nethereum.Web3;

namespace FinanceSimplified.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class BlockchainController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<BlockchainController> _logger;

    public BlockchainController(
        IConfiguration configuration,
        ILogger<BlockchainController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet("balance/{address}")]
    public async Task<IActionResult> GetBalance(string address)
    {
        try
        {
            var infuraUrl = _configuration["Blockchain:InfuraUrl"];
            var web3 = new Web3(infuraUrl);
            
            var balance = await web3.Eth.GetBalance.SendRequestAsync(address);
            var etherBalance = Web3.Convert.FromWei(balance.Value);
            
            return Ok(new { address, balance = etherBalance.ToString() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting balance for address {Address}", address);
            return StatusCode(500, new { message = "Error getting blockchain data" });
        }
    }
}
