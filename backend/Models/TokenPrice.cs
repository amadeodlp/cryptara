using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace FinanceSimplified.Models;

public class TokenPrice
{
    public string Symbol { get; set; } = string.Empty;
    
    public string Name { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal Price { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal PercentChange24h { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal MarketCap { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal Volume24h { get; set; }
    
    public DateTime LastUpdated { get; set; }
}

public class PricePoint
{
    public DateTime Timestamp { get; set; }
    
    [Column(TypeName = "decimal(18,8)")]
    public decimal Price { get; set; }
}

public class TokenPriceHistory
{
    public string Symbol { get; set; } = string.Empty;
    
    public string Timeframe { get; set; } = string.Empty;
    
    public List<PricePoint> PricePoints { get; set; } = new List<PricePoint>();
}

// Models for CoinMarketCap API response
public class CoinMarketCapResponse
{
    public Dictionary<string, CoinMarketCapTokenData> Data { get; set; } = new Dictionary<string, CoinMarketCapTokenData>();
    public CoinMarketCapStatus Status { get; set; } = new CoinMarketCapStatus();
}

public class CoinMarketCapTokenData
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
    public CoinMarketCapQuote Quote { get; set; } = new CoinMarketCapQuote();
}

public class CoinMarketCapQuote
{
    public CoinMarketCapUsdData USD { get; set; } = new CoinMarketCapUsdData();
}

public class CoinMarketCapUsdData
{
    public decimal Price { get; set; }
    public decimal Volume24h { get; set; }
    public decimal PercentChange24h { get; set; }
    public decimal MarketCap { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class CoinMarketCapStatus
{
    public DateTime Timestamp { get; set; }
    public int ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public int Elapsed { get; set; }
    public int CreditCount { get; set; }
}