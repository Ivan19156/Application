// using Core.Entities;
// using System;
// using System.Collections.Generic;
// using System.Threading.Tasks;

// namespace Application.Interfaces.Persistence;

// public interface ITagRepository
// {
//     Task<Tag?> GetTagByIdAsync(Guid id);
//     Task<Tag?> GetTagByNameAsync(string name);
//     Task<IEnumerable<Tag>> GetAllTagsAsync();
//     Task AddTagAsync(Tag tag);
//     Task<IEnumerable<Tag>> FindOrCreateTagsAsync(IEnumerable<string> tagNames);
// }


using Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.Persistence;

public interface ITagRepository
{
    Task<Tag?> GetTagByIdAsync(Guid id);
    Task<Tag?> GetTagByNameAsync(string name);
    Task<IEnumerable<Tag>> GetAllTagsAsync();
    // Task AddTagAsync(Tag tag); // 👈 Цей метод непотрібний, видаляємо його
    Task<IEnumerable<Tag>> FindOrCreateTagsAsync(IEnumerable<string> tagNames);
}

