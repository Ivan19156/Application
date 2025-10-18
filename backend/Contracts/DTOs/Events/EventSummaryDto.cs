using System;
// Note: We avoid referencing Core.Entities directly in Contracts if possible.
// If EventVisibility enum is needed here, define it in Contracts too.
// Let's assume for now the API returns strings "Public"/"Private".

namespace Contracts.DTOs.Events;

// DTO for displaying events in a list
public class EventSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty; // Short description
    public DateTimeOffset DateTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public int? Capacity { get; set; }
    public int ParticipantCount { get; set; }
}