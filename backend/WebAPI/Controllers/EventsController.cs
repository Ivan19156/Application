using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Application.Interfaces.Services; 
using Contracts.DTOs.Events;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")] 
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;
    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier); 
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID claim not found or invalid in token.");
        }
        return userId;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PaginatedEventsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublicEvents(
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 12;

        var result = await _eventService.GetPublicEventsAsync(search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetEventById(Guid id)
    {
        var (eventDto, errorMessage) = await _eventService.GetEventDetailsByIdAsync(id);

        if (errorMessage != null)
        {
            return NotFound(new { Message = errorMessage });
        }
        return Ok(eventDto);
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto createDto)
    {
        var organizerId = GetCurrentUserId();
        var (createdEventDto, errorMessage) = await _eventService.CreateEventAsync(createDto, organizerId);

        if (errorMessage != null)
        {
            return BadRequest(new { Message = errorMessage });
        }
        if (createdEventDto == null)
        {
             return BadRequest(new { Message = "Failed to create event for an unknown reason." });
        }

        return CreatedAtAction(nameof(GetEventById), new { id = createdEventDto.Id }, createdEventDto);
    }

    [HttpPatch("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventDto updateDto)
    {
        var userId = GetCurrentUserId();
        var (updatedEventDto, errorMessage) = await _eventService.UpdateEventAsync(id, updateDto, userId);

        if (errorMessage != null)
        {
            if (errorMessage.StartsWith("Forbidden")) return Forbid();
            if (errorMessage.EndsWith("not found.")) return NotFound(new { Message = errorMessage });
            return BadRequest(new { Message = errorMessage });
        }
        return Ok(updatedEventDto);
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        var userId = GetCurrentUserId();
        var (success, errorMessage) = await _eventService.DeleteEventAsync(id, userId);

        if (!success)
        {
            if (errorMessage != null)
            {
                 if (errorMessage.StartsWith("Forbidden")) return Forbid();
                 if (errorMessage.EndsWith("not found.")) return NotFound(new { Message = errorMessage });
                 return BadRequest(new { Message = errorMessage });
            }
             return BadRequest(new { Message = "Failed to delete event." });
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/join")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> JoinEvent(Guid id)
    {
        var userId = GetCurrentUserId();
        var (success, errorMessage) = await _eventService.JoinEventAsync(id, userId);

        if (!success)
        {
            if (errorMessage != null)
            {
                 if (errorMessage.EndsWith("not found.")) return NotFound(new { Message = errorMessage });
                 return BadRequest(new { Message = errorMessage });
            }
             return BadRequest(new { Message = "Failed to join event." });
        }

        return Ok(new { Message = "Successfully joined the event." });
    }

    [HttpPost("{id:guid}/leave")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LeaveEvent(Guid id)
    {
        var userId = GetCurrentUserId();
        var (success, errorMessage) = await _eventService.LeaveEventAsync(id, userId);

        if (!success)
        {
             if (errorMessage != null)
             {
                 return BadRequest(new { Message = errorMessage });
             }
              return BadRequest(new { Message = "Failed to leave event." });
        }

        return Ok(new { Message = "Successfully left the event." });
    }

    [HttpGet("/api/users/me/events")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<EventSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyEvents()
    {
        var userId = GetCurrentUserId();
        var events = await _eventService.GetMyEventsAsync(userId);
        return Ok(events);
    }
}