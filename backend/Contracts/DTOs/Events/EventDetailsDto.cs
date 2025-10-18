using System;
using System.Collections.Generic;
// Assuming Visibility is returned as a string "Public"/"Private"

namespace Contracts.DTOs.Events;

// DTO for displaying detailed event information
public class EventDetailsDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty; // Full description
    public DateTimeOffset DateTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public int? Capacity { get; set; }
    public string Visibility { get; set; } = "Public"; // Use string e.g., "Public", "Private"
    public Guid OrganizerId { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public List<string> ParticipantNames { get; set; } = new List<string>();
    public int ParticipantCount => ParticipantNames.Count;
}