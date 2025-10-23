using Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.Persistence;

public interface IEventTagRepository
{
    Task AddTagsToEventAsync(Guid eventId, IEnumerable<Guid> tagIds);
    Task<IEnumerable<Tag>> GetTagsForEventAsync(Guid eventId);
    Task UpdateTagsForEventAsync(Guid eventId, IEnumerable<Guid> newTagIds);
}
