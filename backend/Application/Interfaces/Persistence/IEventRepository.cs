using Core.Entities; // Import Event entity
using System;
using System.Collections.Generic; // For IEnumerable
using System.Threading.Tasks;

namespace Application.Interfaces.Persistence;

public interface IEventRepository
{
    
    Task<Event?> GetEventByIdAsync(Guid id);

    Task<int> GetPublicEventsCountAsync(string? searchTerm = null);

    Task<IEnumerable<Event>> GetPublicEventsAsync(
    string? searchTerm = null,
    int page = 1,
    int pageSize = 12);

    Task<IEnumerable<Event>> GetEventsForUserAsync(Guid userId);

    Task AddEventAsync(Event eventEntity);

    Task UpdateEventAsync(Event eventEntity);

    Task DeleteEventAsync(Guid id);

}