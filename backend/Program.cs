using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using FinanceSimplified.Services;
using FinanceSimplified.Data;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Force load environment variables - moved to top to ensure they're available for DB connection
builder.Configuration.AddEnvironmentVariables();

// Add database context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        // Use SQLite for development
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=finance.db");
    }
    else
    {
        // For Railway deployment - handle multiple connection string formats
        string connectionString = null;
        
        // 1. Try to use MYSQL_URL if it's in standard format
        var mysqlUrl = Environment.GetEnvironmentVariable("MYSQL_URL");
        if (!string.IsNullOrEmpty(mysqlUrl))
        {
            // Check if it's in standard connection string format
            if (mysqlUrl.StartsWith("Server=") || mysqlUrl.StartsWith("server=") || 
                mysqlUrl.StartsWith("Host=") || mysqlUrl.StartsWith("host="))
            {
                connectionString = mysqlUrl;
                Console.WriteLine("Using MYSQL_URL environment variable (standard format)");
            }
            // Check if it's in URL format (mysql://)
            else if (mysqlUrl.StartsWith("mysql://"))
            {
                try 
                {
                    // Parse the URL format to standard connection string
                    // Example: mysql://user:pass@host:port/dbname
                    var uri = new Uri(mysqlUrl);
                    var userInfo = uri.UserInfo.Split(':');
                    var user = userInfo[0];
                    var password = userInfo.Length > 1 ? userInfo[1] : "";
                    var host = uri.Host;
                    var port = uri.Port > 0 ? uri.Port : 3306;
                    var database = uri.AbsolutePath.TrimStart('/');
                    
                    connectionString = $"Server={host};Port={port};Database={database};" +
                                      $"Uid={user};Pwd={password};AllowPublicKeyRetrieval=true;ConnectionTimeout=30;Pooling=true;";
                    
                    Console.WriteLine("Parsed connection string from MYSQL_URL (URI format)");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to parse MYSQL_URL as URI: {ex.Message}");
                }
            }
            else
            {
                Console.WriteLine($"MYSQL_URL is in unrecognized format: {mysqlUrl.Substring(0, Math.Min(10, mysqlUrl.Length))}...");
            }
        }
        
        // 2. If MYSQL_URL didn't work, try MYSQL_PUBLIC_URL
        if (string.IsNullOrEmpty(connectionString))
        {
            var mysqlPublicUrl = Environment.GetEnvironmentVariable("MYSQL_PUBLIC_URL");
            if (!string.IsNullOrEmpty(mysqlPublicUrl) && mysqlPublicUrl.StartsWith("mysql://"))
            {
                try
                {
                    var uri = new Uri(mysqlPublicUrl);
                    var userInfo = uri.UserInfo.Split(':');
                    var user = userInfo[0];
                    var password = userInfo.Length > 1 ? userInfo[1] : "";
                    var host = uri.Host;
                    var port = uri.Port > 0 ? uri.Port : 3306;
                    var database = uri.AbsolutePath.TrimStart('/');
                
                    connectionString = $"Server={host};Port={port};Database={database};" +
                                      $"Uid={user};Pwd={password};AllowPublicKeyRetrieval=true;SslMode=Required;ConnectionTimeout=30;Pooling=true;";
                
                    Console.WriteLine("Using MYSQL_PUBLIC_URL for connection");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to parse MYSQL_PUBLIC_URL as URI: {ex.Message}");
                }
            }
        }
        
        // 3. Try building from individual environment variables
        if (string.IsNullOrEmpty(connectionString))
        {
            var mysqlHost = Environment.GetEnvironmentVariable("MYSQLHOST");
            var mysqlPort = Environment.GetEnvironmentVariable("MYSQLPORT");
            var mysqlDatabase = Environment.GetEnvironmentVariable("MYSQLDATABASE") ?? 
                               Environment.GetEnvironmentVariable("MYSQL_DATABASE");
            var mysqlUser = Environment.GetEnvironmentVariable("MYSQLUSER");
            var mysqlPassword = Environment.GetEnvironmentVariable("MYSQLPASSWORD");
            
            Console.WriteLine($"MYSQLHOST: {mysqlHost}");
            Console.WriteLine($"MYSQLPORT: {mysqlPort}");
            Console.WriteLine($"MYSQLDATABASE: {mysqlDatabase}");
            Console.WriteLine($"MYSQLUSER: {mysqlUser}");
            Console.WriteLine($"MYSQLPASSWORD: {(string.IsNullOrEmpty(mysqlPassword) ? "null" : "set")}");
            
            if (!string.IsNullOrEmpty(mysqlHost) && 
                !string.IsNullOrEmpty(mysqlDatabase) && 
                !string.IsNullOrEmpty(mysqlUser) && 
                !string.IsNullOrEmpty(mysqlPassword))
            {
                connectionString = $"Server={mysqlHost};Port={mysqlPort ?? "3306"};Database={mysqlDatabase};" +
                                  $"Uid={mysqlUser};Pwd={mysqlPassword};AllowPublicKeyRetrieval=true;ConnectionTimeout=30;Pooling=true;";
                
                Console.WriteLine("Using individual MySQL environment variables for connection");
                Console.WriteLine($"Connection string (partial): Server={mysqlHost};Port={mysqlPort ?? "3306"};Database={mysqlDatabase};Uid={mysqlUser};Pwd=***");
            }
            else
            {
                // Fallback to configuration
                connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                Console.WriteLine("Using connection string from configuration");
            }
        }
        
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new Exception("No database connection string could be determined. Please configure your database connection.");
        }
        
        // Automatically detect server version from connection string
        options.UseMySql(
            connectionString,
            ServerVersion.AutoDetect(connectionString)
        );
        
        Console.WriteLine("MySQL database connection configured.");
    }
});

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Finance Simplified API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Register services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IStakingService, StakingService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddHttpClient<IPriceFeedService, PriceFeedService>();

// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "temporaryDevelopmentKey12345"))
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors("AllowAll");

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else 
{
    // Still enable Swagger in production but on a specific route
    app.UseSwagger();
    app.UseSwaggerUI(c => {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Finance Simplified API V1");
        c.RoutePrefix = "api-docs";
    });
}

// Initialize the database - do this in both development and production
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var dbContext = services.GetRequiredService<ApplicationDbContext>();
    
    try
    {
        // First, test the connection
        logger.LogInformation("Testing database connection...");
        bool canConnect = false;
        try
        {
            canConnect = dbContext.Database.CanConnect();
            logger.LogInformation($"Database connection test result: {(canConnect ? "SUCCESS" : "FAILED")}");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Database connection test failed with exception");
            // Continue with migration attempt even if connection test fails
        }

        logger.LogInformation("Applying database migrations...");
        // Apply any pending migrations - safer than EnsureCreated() for production
        dbContext.Database.Migrate();
        logger.LogInformation("Database migrations applied successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while migrating the database");
        throw; // Rethrow to prevent app startup if db migration fails
    }
}

// Print environment variables
Console.WriteLine($"Infura URL: {builder.Configuration["Blockchain:InfuraUrl"]}");
Console.WriteLine($"TokenContractAddress: {builder.Configuration["Blockchain:TokenContractAddress"]}");
app.MapGet("/", () => "Hello, Railway!");

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
try {
app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"Unhandled Exception: {ex}");
}
