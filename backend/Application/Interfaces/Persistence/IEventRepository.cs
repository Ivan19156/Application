using Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.Persistence;

public interface IEventRepository
{
    Task<Event?> GetEventByIdAsync(Guid id);
    Task<IEnumerable<Event>> GetPublicEventsAsync(string? searchTerm = null, int page = 1, int pageSize = 12, List<string>? tags = null);
    Task<int> GetPublicEventsCountAsync(string? searchTerm = null, List<string>? tags = null);
    Task<IEnumerable<Event>> GetEventsForUserAsync(Guid userId);
    Task AddEventAsync(Event eventEntity);
    Task UpdateEventAsync(Event eventEntity);
    Task DeleteEventAsync(Guid id);
}


