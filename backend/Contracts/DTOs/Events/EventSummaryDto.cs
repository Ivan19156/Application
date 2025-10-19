using System;

namespace Contracts.DTOs.Events;


public class EventSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty; 
    public DateTimeOffset DateTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public int? Capacity { get; set; }
    public int ParticipantCount { get; set; }
}