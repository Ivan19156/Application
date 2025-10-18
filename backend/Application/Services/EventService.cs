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
    private readonly IUserRepository _userRepository; // Needed for names

    public EventService(
        IEventRepository eventRepository,
        IParticipantRepository participantRepository,
        IUserRepository userRepository)
    {
        _eventRepository = eventRepository;
        _participantRepository = participantRepository;
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<EventSummaryDto>> GetPublicEventsAsync()
    {
        var events = await _eventRepository.GetPublicEventsAsync();
        var eventDtos = new List<EventSummaryDto>();

        foreach (var ev in events)
        {
            var participantCount = await _participantRepository.GetParticipantCountAsync(ev.Id);
            // Simple mapping (consider AutoMapper)
            eventDtos.Add(new EventSummaryDto
            {
                Id = ev.Id,
                Name = ev.Name,
                Description = TruncateDescription(ev.Description),
                DateTime = ev.DateTime,
                Location = ev.Location,
                Capacity = ev.Capacity,
                ParticipantCount = participantCount
            });
        }
        return eventDtos;
    }

     public async Task<(EventDetailsDto? Event, string? ErrorMessage)> GetEventDetailsByIdAsync(Guid id)
    {
        var eventEntity = await _eventRepository.GetEventByIdAsync(id);
        if (eventEntity == null)
        {
            return (null, "Event not found.");
        }

        // Fetch related data (replace mocks with real calls)
        var organizer = await _userRepository.GetUserByIdAsync(eventEntity.OrganizerId);
        // TODO: Need repository method to get participant users/names by EventId
        var participantNames = new List<string>(); // Placeholder
        // var participantUserIds = await _participantRepository.GetParticipantUserIdsAsync(id);
        // var participantUsers = await _userRepository.GetUsersByIdsAsync(participantUserIds);
        // participantNames = participantUsers.Select(u => u.Name).ToList();

        // Mapping (consider AutoMapper)
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
            ParticipantNames = participantNames // Populate with real names
        };
        return (eventDto, null);
    }


    public async Task<IEnumerable<EventSummaryDto>> GetMyEventsAsync(Guid userId)
    {
         var events = await _eventRepository.GetEventsForUserAsync(userId);
         var eventDtos = new List<EventSummaryDto>();
         // Similar mapping as GetPublicEventsAsync
         foreach (var ev in events)
         {
             var participantCount = await _participantRepository.GetParticipantCountAsync(ev.Id);
             eventDtos.Add(new EventSummaryDto { /* ... map properties ... */ Id=ev.Id, Name=ev.Name, Description=TruncateDescription(ev.Description), DateTime=ev.DateTime, Location=ev.Location, Capacity=ev.Capacity, ParticipantCount=participantCount });
         }
         return eventDtos;
    }


    public async Task<(EventDetailsDto? CreatedEvent, string? ErrorMessage)> CreateEventAsync(CreateEventDto createDto, Guid organizerId)
    {
        if (!Enum.TryParse<EventVisibility>(createDto.Visibility, true, out var visibility))
        {
            return (null, "Invalid visibility value.");
        }
         // Basic validation (FluentValidation handles more)
         if(createDto.Date <= DateTimeOffset.UtcNow)
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

        // Fetch details of the created event to return
        var detailsResult = await GetEventDetailsByIdAsync(newEvent.Id);
        return (detailsResult.Event, detailsResult.ErrorMessage); // Return the tuple directly
    }

    public async Task<(EventDetailsDto? UpdatedEvent, string? ErrorMessage)> UpdateEventAsync(Guid eventId, UpdateEventDto updateDto, Guid userId)
    {
        var existingEvent = await _eventRepository.GetEventByIdAsync(eventId);
        if (existingEvent == null)
        {
            return (null, "Event not found.");
        }

        if (existingEvent.OrganizerId != userId)
        {
            return (null, "Forbidden: Only the organizer can edit the event.");
        }

        // Apply updates
        bool updated = false;
        if (updateDto.Title != null) { existingEvent.Name = updateDto.Title; updated = true; }
        if (updateDto.Description != null) { existingEvent.Description = updateDto.Description; updated = true; }
        if (updateDto.Date != null)
        {
             if(updateDto.Date.Value <= DateTimeOffset.UtcNow) return (null, "Event date must be in the future.");
             existingEvent.DateTime = updateDto.Date.Value; updated = true;
        }
        if (updateDto.Location != null) { existingEvent.Location = updateDto.Location; updated = true; }
        if (updateDto.Capacity.HasValue || updateDto.GetType().GetProperty(nameof(updateDto.Capacity))?.GetValue(updateDto) == null && updateDto.Capacity == null)
        {
            if(updateDto.Capacity < 0) return (null, "Capacity cannot be negative.");
            existingEvent.Capacity = updateDto.Capacity; updated = true;
        }
         if (updateDto.Visibility != null)
         {
            if (!Enum.TryParse<EventVisibility>(updateDto.Visibility, true, out var visibility))
            {
                return (null, "Invalid visibility value.");
            }
             existingEvent.Visibility = visibility; updated = true;
         }


        if (updated)
        {
            await _eventRepository.UpdateEventAsync(existingEvent);
        }

        // Fetch updated details
        var detailsResult = await GetEventDetailsByIdAsync(eventId);
        return (detailsResult.Event, detailsResult.ErrorMessage);
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteEventAsync(Guid eventId, Guid userId)
    {
         var existingEvent = await _eventRepository.GetEventByIdAsync(eventId);
         if (existingEvent == null)
         {
             return (false, "Event not found.");
         }

         if (existingEvent.OrganizerId != userId)
         {
             return (false, "Forbidden: Only the organizer can delete the event.");
         }

         await _eventRepository.DeleteEventAsync(eventId);
         return (true, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> JoinEventAsync(Guid eventId, Guid userId)
    {
         var eventToJoin = await _eventRepository.GetEventByIdAsync(eventId);
         if (eventToJoin == null)
         {
             return (false, "Event not found.");
         }
          if (eventToJoin.Visibility == EventVisibility.Private && eventToJoin.OrganizerId != userId)
         {
              // Basic check for private event, real app might need invitation system
              // Allow organizer to join their own private event? debatable.
              // For now, assume only public can be joined freely.
              // Or check if user is already a participant (if loading participants)
              // Let's refine this later. For now, focus on public join.
              // return (false, "Cannot join a private event without invitation.");
         }


         if (await _participantRepository.IsUserParticipatingAsync(userId, eventId))
         {
             return (false, "Already participating.");
         }

         var participantCount = await _participantRepository.GetParticipantCountAsync(eventId);
         if (eventToJoin.Capacity.HasValue && participantCount >= eventToJoin.Capacity.Value)
         {
             return (false, "Event is full.");
         }

         var participant = new Participant { UserId = userId, EventId = eventId };
         await _participantRepository.AddParticipantAsync(participant);
         return (true, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> LeaveEventAsync(Guid eventId, Guid userId)
    {
         if (!await _participantRepository.IsUserParticipatingAsync(userId, eventId))
         {
             return (false, "Not participating in this event.");
         }

         await _participantRepository.RemoveParticipantAsync(userId, eventId);
         return (true, null);
    }

    // Helper
    private string TruncateDescription(string description, int maxLength = 100)
    {
         if (string.IsNullOrEmpty(description) || description.Length <= maxLength)
         {
             return description;
         }
         return description.Substring(0, maxLength) + "...";
    }

}