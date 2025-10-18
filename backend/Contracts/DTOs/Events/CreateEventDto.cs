using System;
// Assuming Visibility is sent as a string "Public"/"Private"

namespace Contracts.DTOs.Events;

// DTO for creating a new event
public class CreateEventDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    // Expect combined DateTimeOffset from frontend
    public DateTimeOffset Date { get; set; }
    public string Location { get; set; } = string.Empty;
    public int? Capacity { get; set; }
    // Send string "Public" or "Private"
    public string Visibility { get; set; } = "Public";
}