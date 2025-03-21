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
        // For Railway, build connection string from environment variables
        var connectionString = Environment.GetEnvironmentVariable("MYSQL_URL"); // Try the direct URL first
        
        if (string.IsNullOrEmpty(connectionString))
        {
            // If MYSQL_URL isn't available, build connection string from individual parts
            var mysqlHost = Environment.GetEnvironmentVariable("MYSQLHOST");
            var mysqlPort = Environment.GetEnvironmentVariable("MYSQLPORT");
            var mysqlDatabase = Environment.GetEnvironmentVariable("MYSQLDATABASE") ?? 
                               Environment.GetEnvironmentVariable("MYSQL_DATABASE");
            var mysqlUser = Environment.GetEnvironmentVariable("MYSQLUSER");
            var mysqlPassword = Environment.GetEnvironmentVariable("MYSQLPASSWORD");
            
            if (!string.IsNullOrEmpty(mysqlHost) && 
                !string.IsNullOrEmpty(mysqlDatabase) && 
                !string.IsNullOrEmpty(mysqlUser) && 
                !string.IsNullOrEmpty(mysqlPassword))
            {
                // Build the connection string
                connectionString = $"Server={mysqlHost};Port={mysqlPort ?? "3306"};Database={mysqlDatabase};"
                                + $"Uid={mysqlUser};Pwd={mysqlPassword}";
                
                Console.WriteLine("Using built MySQL connection string from environment variables");
            }
            else
            {
                // Fallback to configuration
                connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                Console.WriteLine("Using connection string from configuration");
            }
        }
        else
        {
            Console.WriteLine("Using MYSQL_URL environment variable");
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

// Commented out as we moved this to the top
// builder.Configuration.AddEnvironmentVariables();

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
