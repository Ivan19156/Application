using Application.Interfaces.Persistence;
using Core.Entities;
using Dapper;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Repositories;

public class TagRepository : ITagRepository
{
    private readonly DbConnectionProvider _connectionProvider;

    public TagRepository(DbConnectionProvider connectionProvider)
    {
        _connectionProvider = connectionProvider;
    }

    public async Task AddTagAsync(Tag tag)
    {
        const string sql = """
            INSERT INTO "Tags" ("Id", "Name")
            VALUES (@Id, @Name)
            ON CONFLICT ("Name") DO NOTHING;
            """;
        using var connection = _connectionProvider.CreateConnection();
        await connection.ExecuteAsync(sql, tag);
    }

    public async Task<IEnumerable<Tag>> GetAllTagsAsync()
    {
        const string sql = @"SELECT * FROM ""Tags"" ORDER BY ""Name"";";
        using var connection = _connectionProvider.CreateConnection();
        return await connection.QueryAsync<Tag>(sql);
    }

    public async Task<Tag?> GetTagByIdAsync(Guid id)
    {
        const string sql = @"SELECT * FROM ""Tags"" WHERE ""Id"" = @Id;";
        using var connection = _connectionProvider.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<Tag>(sql, new { Id = id });
    }

    public async Task<Tag?> GetTagByNameAsync(string name)
    {
        const string sql = @"SELECT * FROM ""Tags"" WHERE ""Name"" = @Name;";
        using var connection = _connectionProvider.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<Tag>(sql, new { Name = name });
    }

    public async Task<IEnumerable<Tag>> FindOrCreateTagsAsync(IEnumerable<string> tagNames)
    {
        var upperTagNames = tagNames.Select(n => n.Trim().ToUpper()).Distinct().ToList();
        if (!upperTagNames.Any())
        {
            return Enumerable.Empty<Tag>();
        }
        
        using var connection = _connectionProvider.CreateConnection();
        
        const string findSql = @"SELECT * FROM ""Tags"" WHERE UPPER(""Name"") = ANY(@names);";
        var existingTags = (await connection.QueryAsync<Tag>(findSql, new { names = upperTagNames })).ToList();

        var existingTagNames = existingTags.Select(t => t.Name.ToUpper()).ToHashSet();
        var newTagNames = upperTagNames.Where(n => !existingTagNames.Contains(n)).ToList();

        if (newTagNames.Any())
        {
            var newTags = newTagNames.Select(name => new Tag
            {
                Id = Guid.NewGuid(),
                Name = name.ToLower() 
            }).ToList();
            
            const string insertSql = @"INSERT INTO ""Tags"" (""Id"", ""Name"") VALUES (@Id, @Name);";
            await connection.ExecuteAsync(insertSql, newTags);
            
            existingTags.AddRange(newTags);
        }

        return existingTags;
    }
}
