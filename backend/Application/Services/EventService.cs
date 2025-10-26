using Application.Interfaces.Persistence;
using Application.Interfaces.Services;
using Contracts.DTOs.Events;
using Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services;

public class EventService : IEventService
{
    private readonly IEventRepository _eventRepository;
    private readonly IParticipantRepository _participantRepository;
    private readonly IUserRepository _userRepository;
    private readonly ITagRepository _tagRepository;
    private readonly IEventTagRepository _eventTagRepository;

    public EventService(
        IEventRepository eventRepository,
        IParticipantRepository participantRepository,
        IUserRepository userRepository,
        ITagRepository tagRepository,
        IEventTagRepository eventTagRepository)
    {
        _eventRepository = eventRepository;
        _participantRepository = participantRepository;
        _userRepository = userRepository;
        _tagRepository = tagRepository;
        _eventTagRepository = eventTagRepository;
    }

    public async Task<PaginatedEventsDto> GetPublicEventsAsync(string? searchTerm = null, int page = 1, int pageSize = 12, List<string>? tags = null)
    {
        var totalCount = await _eventRepository.GetPublicEventsCountAsync(searchTerm, tags);
        var events = await _eventRepository.GetPublicEventsAsync(searchTerm, page, pageSize, tags);
        
        var eventDtos = new List<EventSummaryDto>();
        foreach (var ev in events)
        {
            var participantCount = await _participantRepository.GetParticipantCountAsync(ev.Id);
            var eventTags = await _eventTagRepository.GetTagsForEventAsync(ev.Id);

            eventDtos.Add(new EventSummaryDto
            {
                Id = ev.Id,
                Name = ev.Name,
                Description = TruncateDescription(ev.Description),
                DateTime = ev.DateTime,
                Location = ev.Location,
                Capacity = ev.Capacity,
                ParticipantCount = participantCount,
                OrganizerId = ev.OrganizerId, //
                Tags = eventTags.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList()
            });
        }

        return new PaginatedEventsDto
        {
            Events = eventDtos,
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize,
            //HasNextPage = (page * pageSize) < totalCount
        };
    }

    public async Task<(EventDetailsDto? Event, string? ErrorMessage)> GetEventDetailsByIdAsync(Guid id)
    {
        var eventEntity = await _eventRepository.GetEventByIdAsync(id);
        if (eventEntity == null)
        {
            return (null, "Event not found.");
        }

        var organizer = await _userRepository.GetUserByIdAsync(eventEntity.OrganizerId);
        var participants = await _participantRepository.GetParticipantsForEventAsync(id);
        var tags = await _eventTagRepository.GetTagsForEventAsync(id);

        var eventDto = new EventDetailsDto
        {
            Id = eventEntity.Id,
            Name = eventEntity.Name,
            Description = eventEntity.Description,
            DateTime = eventEntity.DateTime,
            Location = eventEntity.Location,
            Capacity = eventEntity.Capacity,
            Visibility = eventEntity.Visibility.ToString(),
            OrganizerId = eventEntity.OrganizerId,
            OrganizerName = organizer?.Name ?? "N/A",
            ParticipantNames = participants.Select(p => p.Name).ToList(),
            Tags = tags.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList()
        };
        
        return (eventDto, null);
    }

    public async Task<IEnumerable<EventSummaryDto>> GetMyEventsAsync(Guid userId)
    {
        var events = await _eventRepository.GetEventsForUserAsync(userId);
        var eventDtos = new List<EventSummaryDto>();
        foreach (var ev in events)
        {
            var participantCount = await _participantRepository.GetParticipantCountAsync(ev.Id);
            var tags = await _eventTagRepository.GetTagsForEventAsync(ev.Id);
            eventDtos.Add(new EventSummaryDto
            {
                Id = ev.Id,
                Name = ev.Name,
                Description = TruncateDescription(ev.Description),
                DateTime = ev.DateTime,
                Location = ev.Location,
                Capacity = ev.Capacity,
                ParticipantCount = participantCount,
                Tags = tags.Select(t => new TagDto { Id = t.Id, Name = t.Name }).ToList()
            });
        }
        return eventDtos;
    }

    public async Task<(EventDetailsDto? CreatedEvent, string? ErrorMessage)> CreateEventAsync(CreateEventDto createDto, Guid organizerId)
    {
        if (createDto.Tags.Count > 5)
        {
            return (null, "An event can have a maximum of 5 tags.");
        }

        if (!Enum.TryParse<EventVisibility>(createDto.Visibility, true, out var visibility))
        {
            return (null, "Invalid visibility value.");
        }
        if (createDto.Date <= DateTimeOffset.UtcNow)
        {
            return (null, "Event date must be in the future.");
        }

        var newEvent = new Event
        {
            Id = Guid.NewGuid(),
            Name = createDto.Title,
            Description = createDto.Description,
            DateTime = createDto.Date,
            Location = createDto.Location,
            Capacity = createDto.Capacity,
            Visibility = visibility,
            OrganizerId = organizerId
        };

        await _eventRepository.AddEventAsync(newEvent);
        
        var tags = await _tagRepository.FindOrCreateTagsAsync(createDto.Tags);
        if (tags.Any())
        {
            await _eventTagRepository.AddTagsToEventAsync(newEvent.Id, tags.Select(t => t.Id));
        }

        var (details, error) = await GetEventDetailsByIdAsync(newEvent.Id);
        return (details, error);
    }

    public async Task<(EventDetailsDto? UpdatedEvent, string? ErrorMessage)> UpdateEventAsync(Guid eventId, UpdateEventDto updateDto, Guid userId)
    {
        if (updateDto.Tags != null && updateDto.Tags.Count > 5)
        {
            return (null, "An event can have a maximum of 5 tags.");
        }
        
        var existingEvent = await _eventRepository.GetEventByIdAsync(eventId);
        if (existingEvent == null)
        {
            return (null, "Event not found.");
        }
        if (existingEvent.OrganizerId != userId)
        {
            return (null, "Forbidden: Only the organizer can edit the event.");
        }

        bool wasModified = false;
        if (updateDto.Title != null) { existingEvent.Name = updateDto.Title; wasModified = true; }
        if (updateDto.Description != null) { existingEvent.Description = updateDto.Description; wasModified = true; }
        if (updateDto.Date != null)
        {
             if (updateDto.Date.Value <= DateTimeOffset.UtcNow) return (null, "Event date must be in the future.");
             existingEvent.DateTime = updateDto.Date.Value; wasModified = true;
        }
        if (updateDto.Location != null) { existingEvent.Location = updateDto.Location; wasModified = true; }
        
        if (updateDto.GetType().GetProperty(nameof(updateDto.Capacity)) != null) 
        {
            if (updateDto.Capacity < 1 && updateDto.Capacity != null) return (null, "Capacity cannot be negative or zero.");
            existingEvent.Capacity = updateDto.Capacity; wasModified = true;
        }

        if (updateDto.Visibility != null)
        {
            if (!Enum.TryParse<EventVisibility>(updateDto.Visibility, true, out var visibility)) return (null, "Invalid visibility value.");
            existingEvent.Visibility = visibility; wasModified = true;
        }

        if (wasModified)
        {
            await _eventRepository.UpdateEventAsync(existingEvent);
        }

        if (updateDto.Tags != null)
        {
            var tags = await _tagRepository.FindOrCreateTagsAsync(updateDto.Tags);
            await _eventTagRepository.UpdateTagsForEventAsync(eventId, tags.Select(t => t.Id));
        }

        var (details, error) = await GetEventDetailsByIdAsync(eventId);
        return (details, error);
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteEventAsync(Guid eventId, Guid userId)
    {
         var existingEvent = await _eventRepository.GetEventByIdAsync(eventId);
         if (existingEvent == null) return (false, "Event not found.");
         if (existingEvent.OrganizerId != userId) return (false, "Forbidden: Only the organizer can delete the event.");
         
         await _eventRepository.DeleteEventAsync(eventId);
         return (true, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> JoinEventAsync(Guid eventId, Guid userId)
    {
         var eventToJoin = await _eventRepository.GetEventByIdAsync(eventId);
         if (eventToJoin == null) return (false, "Event not found.");
         
         if (await _participantRepository.IsUserParticipatingAsync(userId, eventId)) return (false, "Already participating.");
         
         var participantCount = await _participantRepository.GetParticipantCountAsync(eventId);
         if (eventToJoin.Capacity.HasValue && participantCount >= eventToJoin.Capacity.Value) return (false, "Event is full.");
         
         await _participantRepository.AddParticipantAsync(new Participant { UserId = userId, EventId = eventId });
         return (true, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> LeaveEventAsync(Guid eventId, Guid userId)
    {
         if (!await _participantRepository.IsUserParticipatingAsync(userId, eventId)) return (false, "Not participating in this event.");
         
         await _participantRepository.RemoveParticipantAsync(userId, eventId);
         return (true, null);
    }

    private string TruncateDescription(string description, int maxLength = 100)
    {
         if (string.IsNullOrEmpty(description) || description.Length <= maxLength) return description;
         return description.Substring(0, maxLength) + "...";
    }
}

