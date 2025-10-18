using Core.Entities;
using Dapper;
using Infrastructure.Data; // For DbConnectionProvider
using Microsoft.Extensions.DependencyInjection; // For IServiceProvider
using Microsoft.Extensions.Hosting; // For IHost
using Microsoft.Extensions.Logging; // For logging
using BCryptNet = BCrypt.Net.BCrypt; // Alias for hashing
using System;
using System.Data; // <-- Ensure this using statement is present

namespace Infrastructure.Data;

public static class DbInitializer
{
    // Extension method to easily call seeding from Program.cs
    public static async Task SeedDatabaseAsync(this IHost host)
    {
        // Create a scope to resolve services
        using var scope = host.Services.CreateScope();
        var services = scope.ServiceProvider;
        // Get necessary services from the DI container
        var connectionProvider = services.GetRequiredService<DbConnectionProvider>();
        var logger = services.GetRequiredService<ILogger<DbConnectionProvider>>(); // Using DbConnectionProvider's logger category

        try
        {
            logger.LogInformation("Attempting to seed database...");
            // Create and open a database connection
            using var connection = connectionProvider.CreateConnection();
            connection.Open();

            // Seed users and events
            await SeedUsersAsync(connection, logger);
            await SeedEventsAsync(connection, logger);
            // Add SeedParticipantsAsync call here if you implement it

            logger.LogInformation("Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during database seeding.");
            // Consider whether the application should stop if seeding fails
            // throw;
        }
    }

    // Seeds the Users table if it's empty
    private static async Task SeedUsersAsync(IDbConnection connection, ILogger logger)
    {
        // Check if users already exist
        const string checkSql = @"SELECT COUNT(*) FROM ""Users"";";
        var userCount = await connection.ExecuteScalarAsync<int>(checkSql);

        if (userCount == 0)
        {
            logger.LogInformation("Seeding Users...");
            // Hash passwords for seed users
            var passwordHash1 = BCryptNet.HashPassword("password123");
            var passwordHash2 = BCryptNet.HashPassword("password456");

            // Define seed user data with fixed Guids
            var users = new[]
            {
                new { Id = Guid.Parse("f9f0b8d8-6d4f-4d2a-8c9a-1f0b8d8e6f4a"), Name = "Alice Smith", Email = "alice@example.com", PasswordHash = passwordHash1 },
                new { Id = Guid.Parse("c3b5a7d0-9e1a-4f8c-8a6e-2f0b8d8e6f4b"), Name = "Bob Johnson", Email = "bob@example.com", PasswordHash = passwordHash2 }
            };

            // SQL command to insert users
            const string insertSql = """
                INSERT INTO "Users" ("Id", "Name", "Email", "PasswordHash")
                VALUES (@Id, @Name, @Email, @PasswordHash);
                """;
            // Execute the insert command using Dapper
            await connection.ExecuteAsync(insertSql, users);
            logger.LogInformation("Users seeded: {Count}", users.Length);
        }
        else
        {
            logger.LogInformation("Users table already contains data. Skipping seeding.");
        }
    }

    // Seeds the Events table if it's empty
    private static async Task SeedEventsAsync(IDbConnection connection, ILogger logger)
    {
        // Check if events already exist
        const string checkSql = @"SELECT COUNT(*) FROM ""Events"";";
        var eventCount = await connection.ExecuteScalarAsync<int>(checkSql);

        if (eventCount == 0)
        {
            logger.LogInformation("Seeding Events...");
            // Use the fixed Guids defined in SeedUsersAsync
            var aliceId = Guid.Parse("f9f0b8d8-6d4f-4d2a-8c9a-1f0b8d8e6f4a");
            var bobId = Guid.Parse("c3b5a7d0-9e1a-4f8c-8a6e-2f0b8d8e6f4b");

            // Define seed event data
            var events = new[]
            {
                new { Id = Guid.NewGuid(), Name = "Tech Meetup Vol. 1", Description = "Discussing latest tech trends.", DateTime = DateTimeOffset.UtcNow.AddDays(10).Date.AddHours(18), Location = "Online", Capacity = (int?)100, Visibility = (short)EventVisibility.Public, OrganizerId = aliceId },
                new { Id = Guid.NewGuid(), Name = "Design Workshop", Description = "Hands-on UI/UX workshop.", DateTime = DateTimeOffset.UtcNow.AddDays(20).Date.AddHours(10), Location = "Community Hub", Capacity = (int?)30, Visibility = (short)EventVisibility.Public, OrganizerId = bobId },
                new { Id = Guid.NewGuid(), Name = "Project Alpha Kick-off (Private)", Description = "Internal project meeting.", DateTime = DateTimeOffset.UtcNow.AddDays(5).Date.AddHours(14), Location = "Office Room 3", Capacity = (int?)null, Visibility = (short)EventVisibility.Private, OrganizerId = aliceId }
            };

            // SQL command to insert events
            const string insertSql = """
                INSERT INTO "Events" ("Id", "Name", "Description", "DateTime", "Location", "Capacity", "Visibility", "OrganizerId")
                VALUES (@Id, @Name, @Description, @DateTime, @Location, @Capacity, @Visibility, @OrganizerId);
                """;
            // Execute the insert command using Dapper
            await connection.ExecuteAsync(insertSql, events);
            logger.LogInformation("Events seeded: {Count}", events.Length);
        }
        else
        {
            logger.LogInformation("Events table already contains data. Skipping seeding.");
        }
    }
}