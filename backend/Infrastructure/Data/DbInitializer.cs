using Core.Entities;
using Dapper;
using Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using BCryptNet = BCrypt.Net.BCrypt;
using System;
using System.Data;
using System.Collections.Generic; // Потрібно для Dictionary
using System.Linq; // Потрібно для ToDictionary та Select
using System.Threading.Tasks;

namespace Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedDatabaseAsync(this IHost host)
    {
        using var scope = host.Services.CreateScope();
        var services = scope.ServiceProvider;
        var connectionProvider = services.GetRequiredService<DbConnectionProvider>();
        var logger = services.GetRequiredService<ILogger<DbConnectionProvider>>();

        try
        {
            logger.LogInformation("Attempting to seed database...");
            using var connection = connectionProvider.CreateConnection();
            connection.Open();

            // Порядок важливий через зовнішні ключі
            var userIds = await SeedUsersAsync(connection, logger);
            var tagIds = await SeedTagsAsync(connection, logger);
            var eventIds = await SeedEventsAsync(connection, logger, userIds);
            
            // 👇 Додаємо виклики для нових методів сідінгу
            await SeedEventTagsAsync(connection, logger, eventIds, tagIds);
            await SeedParticipantsAsync(connection, logger, eventIds, userIds);

            logger.LogInformation("Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during database seeding.");
        }
    }

    private static async Task<Dictionary<string, Guid>> SeedUsersAsync(IDbConnection connection, ILogger logger)
    {
        if (await connection.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM ""Users"";") > 0)
        {
            logger.LogInformation("Users table already seeded.");
            // 1. ПЕРЕЙМЕНОВАНО: 'users' -> 'existingUsers'
            var existingUsers = await connection.QueryAsync<User>(@"SELECT ""Id"", ""Name"" FROM ""Users"";");
            // Повертаємо існуючі дані, щоб інші сіди могли їх використати
            return existingUsers.ToDictionary(u => u.Name.Split(' ')[0], u => u.Id); // Використовуємо 'Alice'/'Bob' як ключ
        }
        
        logger.LogInformation("Seeding Users...");
        var userIds = new Dictionary<string, Guid>
        {
            { "Alice", Guid.Parse("f9f0b8d8-6d4f-4d2a-8c9a-1f0b8d8e6f4a") },
            { "Bob", Guid.Parse("c3b5a7d0-9e1a-4f8c-8a6e-2f0b8d8e6f4b") }
        };

        // 2. ПЕРЕЙМЕНОВАНО: 'users' -> 'newUsers'
        var newUsers = new[]
        {
            new { Id = userIds["Alice"], Name = "Alice Smith", Email = "alice@example.com", PasswordHash = BCryptNet.HashPassword("password123") },
            new { Id = userIds["Bob"], Name = "Bob Johnson", Email = "bob@example.com", PasswordHash = BCryptNet.HashPassword("password456") }
        };
        await connection.ExecuteAsync(@"INSERT INTO ""Users"" (""Id"", ""Name"", ""Email"", ""PasswordHash"") VALUES (@Id, @Name, @Email, @PasswordHash);", newUsers);
        return userIds;
    }

    // 👇 НОВИЙ МЕТОД: Сідінг тегів
    private static async Task<Dictionary<string, Guid>> SeedTagsAsync(IDbConnection connection, ILogger logger)
    {
        if (await connection.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM ""Tags"";") > 0)
        {
             logger.LogInformation("Tags table already seeded.");
             // 3. ПЕРЕЙМЕНОВАНО: 'tags' -> 'existingTags'
             var existingTags = await connection.QueryAsync<Tag>(@"SELECT ""Id"", ""Name"" FROM ""Tags"";");
             return existingTags.ToDictionary(t => t.Name, t => t.Id);
        }

        logger.LogInformation("Seeding Tags...");
        var tagIds = new Dictionary<string, Guid>
        {
            { "Tech", Guid.NewGuid() },
            { "Design", Guid.NewGuid() },
            { "Meetup", Guid.NewGuid() },
            { "Conference", Guid.NewGuid() }
        };
        
        // 4. ПЕРЕЙМЕНОВАНО: 'tags' -> 'newTags'
        var newTags = tagIds.Select(kvp => new { Id = kvp.Value, Name = kvp.Key });
        await connection.ExecuteAsync(@"INSERT INTO ""Tags"" (""Id"", ""Name"") VALUES (@Id, @Name);", newTags);
        return tagIds;
    }

    // Оновлений метод сідінгу подій, тепер він приймає userIds
    private static async Task<Dictionary<string, Guid>> SeedEventsAsync(IDbConnection connection, ILogger logger, Dictionary<string, Guid> userIds)
    {
        if (await connection.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM ""Events"";") > 0)
        {
            logger.LogInformation("Events table already seeded.");
            // 5. ПЕРЕЙМЕНОВАНО: 'events' -> 'existingEvents'
            var existingEvents = await connection.QueryAsync<Event>(@"SELECT ""Id"", ""Name"" FROM ""Events"";");
            return existingEvents.ToDictionary(e => e.Name, e => e.Id);
        }

        logger.LogInformation("Seeding Events...");
        var eventIds = new Dictionary<string, Guid>
        {
            { "Angular Conf", Guid.NewGuid() },
            { "Design Workshop", Guid.NewGuid() },
            { ".NET Meetup", Guid.NewGuid() },
            { "AI Talk (Private)", Guid.NewGuid() }
        };

        // 6. ПЕРЕЙМЕНОВАНО: 'events' -> 'newEvents'
        var newEvents = new[]
        {
            // 7. ВИПРАВЛЕНО: Додано (int?) до Capacity
            new { Id = eventIds["Angular Conf"], Name = "Angular Conf", Description = "Big conference for Angular devs.", DateTime = DateTimeOffset.UtcNow.AddDays(10), Location = "Kyiv", Capacity = (int?)100, Visibility = (short)EventVisibility.Public, OrganizerId = userIds["Alice"] },
            new { Id = eventIds["Design Workshop"], Name = "Design Workshop", Description = "UI/UX workshop.", DateTime = DateTimeOffset.UtcNow.AddDays(20), Location = "Lviv", Capacity = (int?)50, Visibility = (short)EventVisibility.Public, OrganizerId = userIds["Bob"] },
            new { Id = eventIds[".NET Meetup"], Name = ".NET Meetup", Description = "Monthly meetup.", DateTime = DateTimeOffset.UtcNow.AddDays(30), Location = "Online", Capacity = (int?)null, Visibility = (short)EventVisibility.Public, OrganizerId = userIds["Alice"] },
            new { Id = eventIds["AI Talk (Private)"], Name = "AI Talk (Private)", Description = "Internal meeting.", DateTime = DateTimeOffset.UtcNow.AddDays(5), Location = "Office", Capacity = (int?)20, Visibility = (short)EventVisibility.Private, OrganizerId = userIds["Bob"] }
        };
        await connection.ExecuteAsync(@"INSERT INTO ""Events"" (""Id"", ""Name"", ""Description"", ""DateTime"", ""Location"", ""Capacity"", ""Visibility"", ""OrganizerId"") VALUES (@Id, @Name, @Description, @DateTime, @Location, @Capacity, @Visibility, @OrganizerId);", newEvents);
        return eventIds;
    }

    // 👇 НОВИЙ МЕТОД: Сідінг зв'язків Event-Tag
    private static async Task SeedEventTagsAsync(IDbConnection connection, ILogger logger, Dictionary<string, Guid> eventIds, Dictionary<string, Guid> tagIds)
    {
        if (await connection.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM ""EventTags"";") > 0)
        {
            logger.LogInformation("EventTags table already seeded.");
            return;
        }

        logger.LogInformation("Seeding EventTags (linking events to tags)...");
        var eventTags = new[]
        {
            // Angular Conf -> Tech, Conference
            new { EventId = eventIds["Angular Conf"], TagId = tagIds["Tech"] },
            new { EventId = eventIds["Angular Conf"], TagId = tagIds["Conference"] },
            // Design Workshop -> Design
            new { EventId = eventIds["Design Workshop"], TagId = tagIds["Design"] },
            // .NET Meetup -> Tech, Meetup
            new { EventId = eventIds[".NET Meetup"], TagId = tagIds["Tech"] },
            new { EventId = eventIds[".NET Meetup"], TagId = tagIds["Meetup"] },
            // AI Talk -> Tech
            new { EventId = eventIds["AI Talk (Private)"], TagId = tagIds["Tech"] }
        };
        await connection.ExecuteAsync(@"INSERT INTO ""EventTags"" (""EventId"", ""TagId"") VALUES (@EventId, @TagId) ON CONFLICT DO NOTHING;", eventTags);
    }

    // 👇 НОВИЙ МЕТОД: Сідінг учасників
    private static async Task SeedParticipantsAsync(IDbConnection connection, ILogger logger, Dictionary<string, Guid> eventIds, Dictionary<string, Guid> userIds)
    {
        if (await connection.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM ""Participants"";") > 0)
        {
            logger.LogInformation("Participants table already seeded.");
            return;
        }
        
        logger.LogInformation("Seeding Participants (linking users to events)...");
        var participants = new[]
        {
            // Alice (user1) joins Bob's (user2) event "Design Workshop"
            new { UserId = userIds["Alice"], EventId = eventIds["Design Workshop"] },
            // Bob (user2) joins Alice's (user1) event "Angular Conf"
            new { UserId = userIds["Bob"], EventId = eventIds["Angular Conf"] }
        };
        await connection.ExecuteAsync(@"INSERT INTO ""Participants"" (""UserId"", ""EventId"") VALUES (@UserId, @EventId) ON CONFLICT DO NOTHING;", participants);
    }
}


