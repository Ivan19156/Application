using System;
// Assuming Visibility is sent as a string "Public"/"Private"

namespace Contracts.DTOs.Events;

// DTO for updating an event (PATCH - partial updates)
public class UpdateEventDto
{
    public string? Title { get; set; } // Nullable for optional update
    public string? Description { get; set; }
    public DateTimeOffset? Date { get; set; }
    public string? Location { get; set; }
    public int? Capacity { get; set; } // Allow setting back to null (unlimited)
    public string? Visibility { get; set; } // Nullable
}