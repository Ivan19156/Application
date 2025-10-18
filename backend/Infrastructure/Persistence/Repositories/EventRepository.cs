using Application.Interfaces.Persistence;
using Core.Entities;
using Dapper;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq; // Required for mapping related data if needed
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Repositories;

public class EventRepository : IEventRepository
{
    private readonly DbConnectionProvider _connectionProvider;

    public EventRepository(DbConnectionProvider connectionProvider)
    {
        _connectionProvider = connectionProvider;
    }

    public async Task AddEventAsync(Event newEvent)
    {
        const string sql = """
            INSERT INTO "Events" ("Id", "Name", "Description", "DateTime", "Location", "Capacity", "Visibility", "OrganizerId")
            VALUES (@Id, @Name, @Description, @DateTime, @Location, @Capacity, @Visibility, @OrganizerId);
            """;

        using var connection = _connectionProvider.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            newEvent.Id,
            newEvent.Name,
            newEvent.Description,
            newEvent.DateTime,
            newEvent.Location,
            newEvent.Capacity,
            // Map the enum to its integer representation for the DB
            Visibility = (short)newEvent.Visibility,
            newEvent.OrganizerId
        });
    }

    public async Task DeleteEventAsync(Guid id)
    {
        const string sql = """
            DELETE FROM "Events"
            WHERE "Id" = @Id;
            """;
        using var connection = _connectionProvider.CreateConnection();
        await connection.ExecuteAsync(sql, new { Id = id });
    }

    public async Task<Event?> GetEventByIdAsync(Guid id)
    {
        // Simple query for event details.
        // To include organizer/participant info, more complex queries or multiple queries are needed.
        const string sql = """
            SELECT "Id", "Name", "Description", "DateTime", "Location", "Capacity", "Visibility", "OrganizerId"
            FROM "Events"
            WHERE "Id" = @Id;
            """;

        using var connection = _connectionProvider.CreateConnection();
        // Dapper maps the SMALLINT 'Visibility' back to the enum automatically
        return await connection.QueryFirstOrDefaultAsync<Event>(sql, new { Id = id });

        // --- Example: Query with Organizer Name (requires JOIN) ---
        /*
        const string sqlWithOrganizer = """
            SELECT
                e."Id", e."Name", e."Description", e."DateTime", e."Location", e."Capacity", e."Visibility", e."OrganizerId",
                o."Name" AS OrganizerName -- Select organizer name
            FROM "Events" e
            JOIN "Users" o ON e."OrganizerId" = o."Id"
            WHERE e."Id" = @Id;
            """;
        // To map this, you'd need a custom mapping or a DTO that includes OrganizerName
        // var result = await connection.QueryFirstOrDefaultAsync<YourEventWithOrganizerDto>(sqlWithOrganizer, new { Id = id });
        // return MapDtoToEvent(result); // You'd need a mapping function
        */
    }


    public async Task<IEnumerable<Event>> GetPublicEventsAsync()
    {
        // Query only public events (Visibility = 0)
        const string sql = """
            SELECT "Id", "Name", "Description", "DateTime", "Location", "Capacity", "Visibility", "OrganizerId"
            FROM "Events"
            WHERE "Visibility" = 0 -- Assuming 0 maps to Public
            ORDER BY "DateTime" ASC; -- Order by date
            """;

        using var connection = _connectionProvider.CreateConnection();
        return await connection.QueryAsync<Event>(sql);
    }

    public async Task<IEnumerable<Event>> GetEventsForUserAsync(Guid userId)
    {
        // Query events where the user is either the organizer OR a participant
        const string sql = """
            SELECT DISTINCT e."Id", e."Name", e."Description", e."DateTime", e."Location", e."Capacity", e."Visibility", e."OrganizerId"
            FROM "Events" e
            LEFT JOIN "Participants" p ON e."Id" = p."EventId"
            WHERE e."OrganizerId" = @UserId OR p."UserId" = @UserId
            ORDER BY e."DateTime" ASC;
            """;
        // DISTINCT prevents duplicates if user is both organizer and participant

        using var connection = _connectionProvider.CreateConnection();
        return await connection.QueryAsync<Event>(sql, new { UserId = userId });
    }

    public async Task UpdateEventAsync(Event eventToUpdate)
    {
        const string sql = """
            UPDATE "Events" SET
                "Name" = @Name,
                "Description" = @Description,
                "DateTime" = @DateTime,
                "Location" = @Location,
                "Capacity" = @Capacity,
                "Visibility" = @Visibility
            WHERE "Id" = @Id AND "OrganizerId" = @OrganizerId; -- Optional: Ensure only organizer can update
            """;
            // Note: We don't usually update OrganizerId

        using var connection = _connectionProvider.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            eventToUpdate.Id,
            eventToUpdate.Name,
            eventToUpdate.Description,
            eventToUpdate.DateTime,
            eventToUpdate.Location,
            eventToUpdate.Capacity,
            Visibility = (short)eventToUpdate.Visibility,
            eventToUpdate.OrganizerId // Include OrganizerId if using the WHERE clause check
        });
    }
}