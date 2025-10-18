using Npgsql; // Import the PostgreSQL driver namespace
using System.Data;

namespace Infrastructure.Data;

// Provides IDbConnection instances for Dapper
public class DbConnectionProvider
{
    private readonly string _connectionString;

    public DbConnectionProvider(string connectionString)
    {
        _connectionString = connectionString ?? throw new ArgumentNullException(nameof(connectionString));
    }

    // Creates and returns a new NpgsqlConnection
    public IDbConnection CreateConnection()
    {
        return new NpgsqlConnection(_connectionString);
    }
}