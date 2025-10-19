using Application.Interfaces.Persistence;
using Core.Entities;
using Dapper;
using Infrastructure.Data;
using System;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Repositories;

public class ParticipantRepository : IParticipantRepository
{
    private readonly DbConnectionProvider _connectionProvider;

    public ParticipantRepository(DbConnectionProvider connectionProvider)
    {
        _connectionProvider = connectionProvider;
    }

    public async Task AddParticipantAsync(Participant participant)
    {
        const string sql = """
            INSERT INTO "Participants" ("UserId", "EventId")
            VALUES (@UserId, @EventId)
            ON CONFLICT ("UserId", "EventId") DO NOTHING; -- Ignore if already participating
            """;
       

        using var connection = _connectionProvider.CreateConnection();
        await connection.ExecuteAsync(sql, participant);
    }

    public async Task<int> GetParticipantCountAsync(Guid eventId)
    {
        const string sql = """
            SELECT COUNT(*) FROM "Participants"
            WHERE "EventId" = @EventId;
            """;
        using var connection = _connectionProvider.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new { EventId = eventId });
    }

    public async Task<bool> IsUserParticipatingAsync(Guid userId, Guid eventId)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1 FROM "Participants"
                WHERE "UserId" = @UserId AND "EventId" = @EventId
            );
            """;
        using var connection = _connectionProvider.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { UserId = userId, EventId = eventId });
    }

    public async Task RemoveParticipantAsync(Guid userId, Guid eventId)
    {
        const string sql = """
            DELETE FROM "Participants"
            WHERE "UserId" = @UserId AND "EventId" = @EventId;
            """;
        using var connection = _connectionProvider.CreateConnection();
        await connection.ExecuteAsync(sql, new { UserId = userId, EventId = eventId });
    }

    public async Task<IEnumerable<User>> GetParticipantsForEventAsync(Guid eventId)
    {
        const string sql = """
            SELECT u."Id", u."Name", u."Email"
            FROM "Participants" p
            JOIN "Users" u ON p."UserId" = u."Id"
            WHERE p."EventId" = @EventId;
            """;
        
        using var connection = _connectionProvider.CreateConnection();
        return await connection.QueryAsync<User>(sql, new { EventId = eventId });
    }
}