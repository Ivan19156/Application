using Application.Interfaces.Persistence;
using Core.Entities;
using Dapper;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Repositories;

public class EventTagRepository : IEventTagRepository
{
    private readonly DbConnectionProvider _connectionProvider;

    public EventTagRepository(DbConnectionProvider connectionProvider)
    {
        _connectionProvider = connectionProvider;
    }

    public async Task AddTagsToEventAsync(Guid eventId, IEnumerable<Guid> tagIds)
    {
        if (!tagIds.Any())
        {
            return;
        }

        const string sql = """
            INSERT INTO "EventTags" ("EventId", "TagId")
            VALUES (@EventId, @TagId)
            ON CONFLICT DO NOTHING;
            """;
        
        var parameters = tagIds.Select(tagId => new { EventId = eventId, TagId = tagId });

        using var connection = _connectionProvider.CreateConnection();
        await connection.ExecuteAsync(sql, parameters);
    }

    public async Task<IEnumerable<Tag>> GetTagsForEventAsync(Guid eventId)
    {
        const string sql = """
            SELECT t."Id", t."Name"
            FROM "Tags" t
            JOIN "EventTags" et ON t."Id" = et."TagId"
            WHERE et."EventId" = @EventId;
            """;
        using var connection = _connectionProvider.CreateConnection();
        return await connection.QueryAsync<Tag>(sql, new { EventId = eventId });
    }

    public async Task UpdateTagsForEventAsync(Guid eventId, IEnumerable<Guid> newTagIds)
    {
        using var connection = _connectionProvider.CreateConnection();
        
        // 👇 Змінено з OpenAsync() на Open() 👇
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            const string deleteSql = @"DELETE FROM ""EventTags"" WHERE ""EventId"" = @EventId;";
            await connection.ExecuteAsync(deleteSql, new { EventId = eventId }, transaction);

            if (newTagIds.Any())
            {
                const string insertSql = """
                    INSERT INTO "EventTags" ("EventId", "TagId")
                    VALUES (@EventId, @TagId);
                    """;
                var parameters = newTagIds.Select(tagId => new { EventId = eventId, TagId = tagId });
                await connection.ExecuteAsync(insertSql, parameters, transaction);
            }
            
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}

