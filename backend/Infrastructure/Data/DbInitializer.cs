using Core.Entities;
using Dapper;
using Infrastructure.Data; 
using Microsoft.Extensions.DependencyInjection; 
using Microsoft.Extensions.Hosting; 
using Microsoft.Extensions.Logging; 
using BCryptNet = BCrypt.Net.BCrypt; 
using System;
using System.Data; 

namespace Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedDatabaseAsync(this IHost host)
    {
        using var scope = host.Services.CreateScope();
        var services = scope.ServiceProvider;
        var connectionProvider = services.GetRequiredService<DbConnectionProvider>();
        var logger = services.GetRequiredService<ILogger<DbConnectionProvider>>(); // Using DbConnectionProvider's logger category

        try
        {
            logger.LogInformation("Attempting to seed database...");
        
            using var connection = connectionProvider.CreateConnection();
            connection.Open();

            await SeedUsersAsync(connection, logger);
            await SeedEventsAsync(connection, logger);


            logger.LogInformation("Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during database seeding.");
        }
    }

    private static async Task SeedUsersAsync(IDbConnection connection, ILogger logger)
    {
        const string checkSql = @"SELECT COUNT(*) FROM ""Users"";";
        var userCount = await connection.ExecuteScalarAsync<int>(checkSql);

        if (userCount == 0)
        {
            logger.LogInformation("Seeding Users...");
            var passwordHash1 = BCryptNet.HashPassword("password123");
            var passwordHash2 = BCryptNet.HashPassword("password456");

            var users = new[]
            {
                new { Id = Guid.Parse("f9f0b8d8-6d4f-4d2a-8c9a-1f0b8d8e6f4a"), Name = "Alice Smith", Email = "alice@example.com", PasswordHash = passwordHash1 },
                new { Id = Guid.Parse("c3b5a7d0-9e1a-4f8c-8a6e-2f0b8d8e6f4b"), Name = "Bob Johnson", Email = "bob@example.com", PasswordHash = passwordHash2 }
            };

            const string insertSql = """
                INSERT INTO "Users" ("Id", "Name", "Email", "PasswordHash")
                VALUES (@Id, @Name, @Email, @PasswordHash);
                """;

            await connection.ExecuteAsync(insertSql, users);
            logger.LogInformation("Users seeded: {Count}", users.Length);
        }
        else
        {
            logger.LogInformation("Users table already contains data. Skipping seeding.");
        }
    }

    
    private static async Task SeedEventsAsync(IDbConnection connection, ILogger logger)
    {
        
        const string checkSql = @"SELECT COUNT(*) FROM ""Events"";";
        var eventCount = await connection.ExecuteScalarAsync<int>(checkSql);

        if (eventCount == 0)
        {
            logger.LogInformation("Seeding Events...");
           
            var aliceId = Guid.Parse("f9f0b8d8-6d4f-4d2a-8c9a-1f0b8d8e6f4a");
            var bobId = Guid.Parse("c3b5a7d0-9e1a-4f8c-8a6e-2f0b8d8e6f4b");

            var events = new[]
            {
                new { Id = Guid.NewGuid(), Name = "Tech Meetup Vol. 1", Description = "Discussing latest tech trends.", DateTime = DateTimeOffset.UtcNow.AddDays(10).Date.AddHours(18), Location = "Online", Capacity = (int?)100, Visibility = (short)EventVisibility.Public, OrganizerId = aliceId },
                new { Id = Guid.NewGuid(), Name = "Design Workshop", Description = "Hands-on UI/UX workshop.", DateTime = DateTimeOffset.UtcNow.AddDays(20).Date.AddHours(10), Location = "Community Hub", Capacity = (int?)30, Visibility = (short)EventVisibility.Public, OrganizerId = bobId },
                new { Id = Guid.NewGuid(), Name = "Project Alpha Kick-off (Private)", Description = "Internal project meeting.", DateTime = DateTimeOffset.UtcNow.AddDays(5).Date.AddHours(14), Location = "Office Room 3", Capacity = (int?)null, Visibility = (short)EventVisibility.Private, OrganizerId = aliceId }
            };

            const string insertSql = """
                INSERT INTO "Events" ("Id", "Name", "Description", "DateTime", "Location", "Capacity", "Visibility", "OrganizerId")
                VALUES (@Id, @Name, @Description, @DateTime, @Location, @Capacity, @Visibility, @OrganizerId);
                """;
    
            await connection.ExecuteAsync(insertSql, events);
            logger.LogInformation("Events seeded: {Count}", events.Length);
        }
        else
        {
            logger.LogInformation("Events table already contains data. Skipping seeding.");
        }
    }
}