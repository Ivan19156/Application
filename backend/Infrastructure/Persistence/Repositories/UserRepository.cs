using Application.Interfaces.Persistence;
using Core.Entities;
using Dapper; // Import Dapper namespace
using Infrastructure.Data; // Import DbConnectionProvider
using System;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly DbConnectionProvider _connectionProvider;

    public UserRepository(DbConnectionProvider connectionProvider)
    {
        _connectionProvider = connectionProvider;
    }

    public async Task AddUserAsync(User user)
    {
        const string sql = """
            INSERT INTO "Users" ("Id", "Name", "Email", "PasswordHash")
            VALUES (@Id, @Name, @Email, @PasswordHash);
            """;
        // Note: Table and column names might need quotes if they conflict
        // with PostgreSQL keywords or contain capitals. Adjust "Users" etc. if needed.

        using var connection = _connectionProvider.CreateConnection();
        await connection.ExecuteAsync(sql, user);
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        const string sql = """
            SELECT "Id", "Name", "Email", "PasswordHash"
            FROM "Users"
            WHERE "Email" = @Email;
            """;

        using var connection = _connectionProvider.CreateConnection();
        // QueryFirstOrDefaultAsync returns the first matching user or null
        return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });
    }

    public async Task<User?> GetUserByIdAsync(Guid id)
    {
        const string sql = """
            SELECT "Id", "Name", "Email", "PasswordHash"
            FROM "Users"
            WHERE "Id" = @Id;
            """;

        using var connection = _connectionProvider.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
    }
}