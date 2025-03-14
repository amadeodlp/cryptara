using FinanceSimplified.Models;
using System.Text.Json;

namespace FinanceSimplified.Services;

public class PriceFeedService : IPriceFeedService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PriceFeedService> _logger;
    private string? _apiKey;

    public PriceFeedService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<PriceFeedService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _apiKey = _configuration["CoinMarketCapApiKey"];

        // Configure HttpClient base address
        _httpClient.BaseAddress = new Uri("https://pro-api.coinmarketcap.com/");
        _httpClient.DefaultRequestHeaders.Add("X-CMC_PRO_API_KEY", _apiKey);
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
    }

    public async Task<TokenPrice> GetTokenPriceAsync(string symbol)
    {
        try
        {
            var response = await _httpClient.GetAsync($"v1/cryptocurrency/quotes/latest?symbol={symbol}");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var responseData = JsonSerializer.Deserialize<CoinMarketCapResponse>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (responseData == null || responseData.Data == null || !responseData.Data.ContainsKey(symbol))
            {
                throw new Exception($"Invalid response for token {symbol}");
            }

            var tokenData = responseData.Data[symbol];
            return new TokenPrice
            {
                Symbol = symbol,
                Name = tokenData.Name,
                Price = tokenData.Quote.USD.Price,
                PercentChange24h = tokenData.Quote.USD.PercentChange24h,
                MarketCap = tokenData.Quote.USD.MarketCap,
                Volume24h = tokenData.Quote.USD.Volume24h,
                LastUpdated = tokenData.LastUpdated
            };
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error fetching price for token {Symbol}", symbol);
            
            // Return a fallback price based on simulated data for demo purposes
            // In a production environment, you'd want to handle this differently
            return GetSimulatedTokenPrice(symbol);
        }
    }

    public async Task<List<TokenPrice>> GetTokenPricesAsync(List<string> symbols)
    {
        try
        {
            var symbolsParam = string.Join(",", symbols);
            var response = await _httpClient.GetAsync($"v1/cryptocurrency/quotes/latest?symbol={symbolsParam}");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var responseData = JsonSerializer.Deserialize<CoinMarketCapResponse>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (responseData == null || responseData.Data == null)
            {
                throw new Exception("Invalid response from API");
            }

            var result = new List<TokenPrice>();
            foreach (var symbol in symbols)
            {
                if (responseData.Data.ContainsKey(symbol))
                {
                    var tokenData = responseData.Data[symbol];
                    result.Add(new TokenPrice
                    {
                        Symbol = symbol,
                        Name = tokenData.Name,
                        Price = tokenData.Quote.USD.Price,
                        PercentChange24h = tokenData.Quote.USD.PercentChange24h,
                        MarketCap = tokenData.Quote.USD.MarketCap,
                        Volume24h = tokenData.Quote.USD.Volume24h,
                        LastUpdated = tokenData.LastUpdated
                    });
                }
            }

            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Error fetching prices for tokens {Symbols}", string.Join(", ", symbols));
            
            // Return simulated prices for demo purposes
            return symbols.Select(GetSimulatedTokenPrice).ToList();
        }
    }

    public async Task<TokenPriceHistory> GetTokenPriceHistoryAsync(string symbol, string timeframe)
    {
        try
        {
            // For production, you'd use the CMC historical data endpoint
            // For this demo, we'll simulate historical data
            var days = timeframe switch
            {
                "1d" => 1,
                "7d" => 7,
                "30d" => 30,
                "90d" => 90,
                "1y" => 365,
                _ => 30
            };

            var currentPrice = await GetTokenPriceAsync(symbol);
            var historicalPrices = GenerateSimulatedHistoricalData(symbol, days, currentPrice.Price);

            return new TokenPriceHistory
            {
                Symbol = symbol,
                Timeframe = timeframe,
                PricePoints = historicalPrices
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching price history for token {Symbol} with timeframe {Timeframe}", symbol, timeframe);
            return new TokenPriceHistory
            {
                Symbol = symbol,
                Timeframe = timeframe,
                PricePoints = new List<PricePoint>()
            };
        }
    }

    // Helper method for simulated data in demo environment
    private TokenPrice GetSimulatedTokenPrice(string symbol)
    {
        var (name, basePrice) = symbol.ToUpper() switch
        {
            "BTC" => ("Bitcoin", 62000m),
            "ETH" => ("Ethereum", 3800m),
            "BNB" => ("Binance Coin", 700m),
            "SOL" => ("Solana", 110m),
            "ADA" => ("Cardano", 0.9m),
            "FIN" => ("Finance Token", 1.65m),
            _ => ($"{symbol} Token", 1.0m)
        };

        // Add some randomness to the price
        var random = new Random();
        var randomFactor = 0.98m + (decimal)random.NextDouble() * 0.04m; // ±2%
        var price = basePrice * randomFactor;

        // Generate some random 24h change
        var percentChange = (decimal)((random.NextDouble() * 10) - 5); // -5% to +5%

        return new TokenPrice
        {
            Symbol = symbol,
            Name = name,
            Price = price,
            PercentChange24h = percentChange,
            MarketCap = price * 1_000_000_000,
            Volume24h = price * 100_000_000,
            LastUpdated = DateTime.UtcNow
        };
    }

    private List<PricePoint> GenerateSimulatedHistoricalData(string symbol, int days, decimal currentPrice)
    {
        var result = new List<PricePoint>();
        var random = new Random();
        var volatility = symbol.ToUpper() switch
        {
            "BTC" => 0.02m, // 2% daily volatility
            "ETH" => 0.025m,
            "SOL" => 0.04m,
            "FIN" => 0.03m,
            _ => 0.02m
        };

        var price = currentPrice;
        var now = DateTime.UtcNow;

        // Add current price first
        result.Add(new PricePoint { Timestamp = now, Price = price });

        // Generate historical prices working backwards
        for (int i = 1; i <= days; i++)
        {
            var timestamp = now.AddDays(-i);
            
            // Random walk with some mean reversion
            var changePercent = (decimal)(random.NextDouble() * 2 - 1) * volatility;
            price = price / (1 + changePercent);

            result.Add(new PricePoint { Timestamp = timestamp, Price = price });
        }

        // Reverse to get chronological order
        result.Reverse();
        return result;
    }
}