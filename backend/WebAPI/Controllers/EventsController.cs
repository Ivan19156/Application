using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Application.Interfaces.Services; // Use IEventService
using Contracts.DTOs.Events;         // Use DTOs from Contracts
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")] // Base route /api/events
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService; // Inject the service interface

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    // --- Helper Method to Get Current User ID ---
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier); // Standard claim type for ID
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            // Should not happen if [Authorize] works, but good practice to check
            throw new UnauthorizedAccessException("User ID claim not found or invalid in token.");
        }
        return userId;
    }

    // --- Public Endpoint ---

    // GET /api/events - Fetch public events
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EventSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublicEvents()
    {
        var events = await _eventService.GetPublicEventsAsync();
        return Ok(events); // Service already returns the correct DTO
    }

    // --- Protected Endpoints ---

    // GET /api/events/{id} - Fetch single event details
    [HttpGet("{id:guid}")]
    [Authorize] // Require authentication to view details
    [ProducesResponseType(typeof(EventDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetEventById(Guid id)
    {
        var (eventDto, errorMessage) = await _eventService.GetEventDetailsByIdAsync(id);

        if (errorMessage != null)
        {
            // Assuming "Event not found." corresponds to 404
            return NotFound(new { Message = errorMessage });
        }
        return Ok(eventDto);
    }

    // POST /api/events - Create new event
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
        if (createdEventDto == null) // Defensive check
        {
             return BadRequest(new { Message = "Failed to create event for an unknown reason." });
        }


        // Return 201 Created with location and the created event details DTO
        return CreatedAtAction(nameof(GetEventById), new { id = createdEventDto.Id }, createdEventDto);
    }

    // PATCH /api/events/{id} - Edit event
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

    // DELETE /api/events/{id} - Delete event
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
                 return BadRequest(new { Message = errorMessage }); // Should ideally not happen if checks are right
            }
             return BadRequest(new { Message = "Failed to delete event." }); // Generic fallback
        }

        return NoContent(); // Success
    }

    // POST /api/events/{id}/join - Join event
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
                 // Other errors like "Already participating" or "Event is full" are Bad Request
                 return BadRequest(new { Message = errorMessage });
            }
             return BadRequest(new { Message = "Failed to join event." });
        }

        return Ok(new { Message = "Successfully joined the event." });
    }

    // POST /api/events/{id}/leave - Leave event
    [HttpPost("{id:guid}/leave")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)] // Event might not exist
    public async Task<IActionResult> LeaveEvent(Guid id)
    {
        var userId = GetCurrentUserId();
        var (success, errorMessage) = await _eventService.LeaveEventAsync(id, userId);

        if (!success)
        {
             if (errorMessage != null)
             {
                 // Check for event not found specifically if repository/service distinguishes it
                 // if (errorMessage.EndsWith("not found.")) return NotFound(new { Message = errorMessage });
                 return BadRequest(new { Message = errorMessage }); // e.g., "Not participating"
             }
              return BadRequest(new { Message = "Failed to leave event." });
        }

        return Ok(new { Message = "Successfully left the event." });
    }

    // GET /api/users/me/events - Fetch user's events (calendar)
    [HttpGet("/api/users/me/events")] // Explicit route override
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