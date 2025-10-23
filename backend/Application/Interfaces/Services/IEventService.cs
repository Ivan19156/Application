// using System;
// using System.Collections.Generic;
// using System.Threading.Tasks;
// using Contracts.DTOs.Events; 

// namespace Application.Interfaces.Services;

// public interface IEventService
// {
//     Task<PaginatedEventsDto> GetPublicEventsAsync(string? searchTerm = null, int page = 1, int pageSize = 12);
//      Task<(EventDetailsDto? Event, string? ErrorMessage)> GetEventDetailsByIdAsync(Guid id);
//     Task<IEnumerable<EventSummaryDto>> GetMyEventsAsync(Guid userId);
//     Task<(EventDetailsDto? CreatedEvent, string? ErrorMessage)> CreateEventAsync(CreateEventDto createDto, Guid organizerId);
//     Task<(EventDetailsDto? UpdatedEvent, string? ErrorMessage)> UpdateEventAsync(Guid eventId, UpdateEventDto updateDto, Guid userId);
//     Task<(bool Success, string? ErrorMessage)> DeleteEventAsync(Guid eventId, Guid userId);
//     Task<(bool Success, string? ErrorMessage)> JoinEventAsync(Guid eventId, Guid userId);
//     Task<(bool Success, string? ErrorMessage)> LeaveEventAsync(Guid eventId, Guid userId);
// }

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Contracts.DTOs.Events;

namespace Application.Interfaces.Services;

public interface IEventService
{
    Task<PaginatedEventsDto> GetPublicEventsAsync(string? searchTerm = null, int page = 1, int pageSize = 12, List<string>? tags = null);
    Task<(EventDetailsDto? Event, string? ErrorMessage)> GetEventDetailsByIdAsync(Guid id);
    Task<IEnumerable<EventSummaryDto>> GetMyEventsAsync(Guid userId);
    Task<(EventDetailsDto? CreatedEvent, string? ErrorMessage)> CreateEventAsync(CreateEventDto createDto, Guid organizerId);
    Task<(EventDetailsDto? UpdatedEvent, string? ErrorMessage)> UpdateEventAsync(Guid eventId, UpdateEventDto updateDto, Guid userId);
    Task<(bool Success, string? ErrorMessage)> DeleteEventAsync(Guid eventId, Guid userId);
    Task<(bool Success, string? ErrorMessage)> JoinEventAsync(Guid eventId, Guid userId);
    Task<(bool Success, string? ErrorMessage)> LeaveEventAsync(Guid eventId, Guid userId);
}

