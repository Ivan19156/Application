using Core.Entities; // Import Event entity
using System;
using System.Collections.Generic; // For IEnumerable
using System.Threading.Tasks;

namespace Application.Interfaces.Persistence;

public interface IEventRepository
{
    // Get a single event by its ID
    Task<Event?> GetEventByIdAsync(Guid id);

    // Get a list of all public events (potentially with filtering/paging later)
    Task<IEnumerable<Event>> GetPublicEventsAsync();

    // Get events organized by or participated in by a specific user
    Task<IEnumerable<Event>> GetEventsForUserAsync(Guid userId);

    // Add a new event
    Task AddEventAsync(Event eventEntity);

    // Update an existing event
    Task UpdateEventAsync(Event eventEntity);

    // Delete an event
    Task DeleteEventAsync(Guid id);

    // Add other event-related methods as needed
}