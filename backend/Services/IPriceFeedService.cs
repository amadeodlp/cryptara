using FinanceSimplified.Models;

namespace FinanceSimplified.Services;

public interface IPriceFeedService
{
    Task<TokenPrice> GetTokenPriceAsync(string symbol);
    Task<List<TokenPrice>> GetTokenPricesAsync(List<string> symbols);
    Task<TokenPriceHistory> GetTokenPriceHistoryAsync(string symbol, string timeframe);
}