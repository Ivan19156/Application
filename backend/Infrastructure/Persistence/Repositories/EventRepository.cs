using Application.Interfaces.Persistence;
using Core.Entities;
using Dapper;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq; 
using System.Text;
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
        const string sql = """
            SELECT "Id", "Name", "Description", "DateTime", "Location", "Capacity", "Visibility", "OrganizerId"
            FROM "Events"
            WHERE "Id" = @Id;
            """;

        using var connection = _connectionProvider.CreateConnection();
        
        return await connection.QueryFirstOrDefaultAsync<Event>(sql, new { Id = id });
    }

public async Task<int> GetPublicEventsCountAsync(string? searchTerm = null)
{
    using var connection = _connectionProvider.CreateConnection();

    const string baseSql = """
        SELECT COUNT(*)
        FROM "Events"
        WHERE "Visibility" = 0
        """;

    if (string.IsNullOrWhiteSpace(searchTerm))
    {
        return await connection.ExecuteScalarAsync<int>(baseSql);
    }

    const string searchSql = baseSql + """
          AND (
            "Name" ILIKE @SearchPattern
            OR "Description" ILIKE @SearchPattern
            OR "Location" ILIKE @SearchPattern
          )
        """;

    return await connection.ExecuteScalarAsync<int>(
        searchSql, 
        new { SearchPattern = $"%{searchTerm}%" }
    );
}

public async Task<IEnumerable<Event>> GetPublicEventsAsync(
    string? searchTerm = null,
    int page = 1,
    int pageSize = 12)
{
    using var connection = _connectionProvider.CreateConnection();
    var offset = (page - 1) * pageSize;

    if (string.IsNullOrWhiteSpace(searchTerm))
    {
        const string sql = """
            SELECT "Id", "Name", "Description", "DateTime", "Location", "Capacity", "Visibility", "OrganizerId"
            FROM "Events"
            WHERE "Visibility" = 0
            ORDER BY "DateTime" ASC
            LIMIT @PageSize OFFSET @Offset;
            """;

        return await connection.QueryAsync<Event>(sql, new { PageSize = pageSize, Offset = offset });
    }
    else
    {
        const string sql = """
            SELECT "Id", "Name", "Description", "DateTime", "Location", "Capacity", "Visibility", "OrganizerId"
            FROM "Events"
            WHERE "Visibility" = 0
              AND (
                "Name" ILIKE @SearchPattern
                OR "Description" ILIKE @SearchPattern
                OR "Location" ILIKE @SearchPattern
              )
            ORDER BY "DateTime" ASC
            LIMIT @PageSize OFFSET @Offset;
            """;

        return await connection.QueryAsync<Event>(
            sql,
            new { 
                SearchPattern = $"%{searchTerm}%",
                PageSize = pageSize,
                Offset = offset
            }
        );
    }
}

    public async Task<IEnumerable<Event>> GetEventsForUserAsync(Guid userId)
    {
        const string sql = """
            SELECT DISTINCT e."Id", e."Name", e."Description", e."DateTime", e."Location", e."Capacity", e."Visibility", e."OrganizerId"
            FROM "Events" e
            LEFT JOIN "Participants" p ON e."Id" = p."EventId"
            WHERE e."OrganizerId" = @UserId OR p."UserId" = @UserId
            ORDER BY e."DateTime" ASC;
            """;

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
            eventToUpdate.OrganizerId
        });
    }
}