using Application.Interfaces.Persistence;
using Core.Entities;
using Dapper; 
using Infrastructure.Data; 
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
    public async Task<IEnumerable<User>> GetUsersByIdsAsync(IEnumerable<Guid> ids)
    {
        
        if (ids == null || !ids.Any())
        {
            return Enumerable.Empty<User>();
        }

        const string sql = @"SELECT ""Id"", ""Name"", ""Email"", ""PasswordHash"" FROM ""Users"" WHERE ""Id"" = ANY(@Ids);";
        
        using var connection = _connectionProvider.CreateConnection();
        return await connection.QueryAsync<User>(sql, new { Ids = ids });
    }
}