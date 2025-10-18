using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FluentValidation.AspNetCore;
using Microsoft.OpenApi.Models;

// --- Import namespaces from your other projects ---
// Infrastructure (Data Access, Auth Implementations)
using Infrastructure.Data;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Auth;
// Application (Interfaces, Services)
using Application.Interfaces.Persistence;
using Application.Interfaces.Infrastructure;
using Application.Interfaces.Services;
using Application.Services;
// WebAPI (Middleware)
using WebAPI.Middleware;
// Contracts (For FluentValidation Assembly Scan)
using Contracts.DTOs.Auth; // Assuming RegisterUserDto is in here

var builder = WebApplication.CreateBuilder(args);

// --- 1. Add services to the container (Dependency Injection) ---

// Database Connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
// Register Dapper connection provider
builder.Services.AddSingleton(new DbConnectionProvider(connectionString));

// Register Repositories (Infrastructure implementations against Application interfaces)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IParticipantRepository, ParticipantRepository>();

// Register Infrastructure Services (Hashing, JWT)
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

// Register Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEventService, EventService>();

// Add Controllers and FluentValidation
builder.Services.AddControllers()
    // Find validators in the Contracts assembly
    .AddFluentValidation(fv => fv.RegisterValidatorsFromAssemblyContaining<RegisterUserDto>());

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Frontend URL
              .AllowAnyHeader()
              .AllowAnyMethod();
        // TODO: Restrict for production
    });
});

// Configure JWT Authentication
// TODO: Securely configure Secret, Issuer, Audience in appsettings/secrets
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "REPLACE_THIS_WITH_A_VERY_STRONG_SECRET_KEY_MIN_32_CHARS";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "YourApp";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "YourApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };
});

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Radency Event App API", Version = "v1" });
    // Add JWT Authentication to Swagger UI
    // Define JWT security scheme for Swagger UI
options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
{
    In = ParameterLocation.Header,
    Description = "Please enter JWT with Bearer into field (e.g., 'Bearer your_token')",
    Name = "Authorization",
    Type = SecuritySchemeType.ApiKey, // Use ApiKey for Bearer tokens in header
    Scheme = "Bearer"
});

// Make Swagger UI use the Bearer token
options.AddSecurityRequirement(new OpenApiSecurityRequirement
{
    {
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer" // Must match the Id in AddSecurityDefinition
            },
            Scheme = "oauth2", // Although type is ApiKey, scheme can be oauth2/bearer
            Name = "Bearer",
            In = ParameterLocation.Header,
        },
        new List<string>() // No specific scopes required for simple Bearer
    }
});
});

// --- 2. Configure the HTTP request pipeline (Middleware) ---

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    // Use await directly with the extension method
    await app.SeedDatabaseAsync(); // Call the seeder
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // TODO: Add database seeding logic here
}

// Global Error Handling (place early)
app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowFrontend");

// Enable Authentication and Authorization (in this order)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();