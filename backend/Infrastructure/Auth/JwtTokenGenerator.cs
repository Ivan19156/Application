using Application.Interfaces.Infrastructure;
using Core.Entities;
using Microsoft.Extensions.Configuration; // To read settings from appsettings
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Infrastructure.Auth;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        // Read settings from appsettings.json
        var secret = _configuration["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
        var issuer = _configuration["JwtSettings:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
        var audience = _configuration["JwtSettings:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");
        var expiryMinutes = _configuration.GetValue<int>("JwtSettings:ExpiryMinutes", 60); // Default to 60 minutes

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()), // Subject (User ID)
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Name, user.Name),
            // Add other claims as needed (e.g., roles)
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // Unique token identifier
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}