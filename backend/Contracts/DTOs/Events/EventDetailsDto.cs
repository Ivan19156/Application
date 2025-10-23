// using System;
// using System.Collections.Generic;

// namespace Contracts.DTOs.Events;

// public class EventDetailsDto
// {
//     public Guid Id { get; set; }
//     public string Name { get; set; } = string.Empty;
//     public string Description { get; set; } = string.Empty; 
//     public DateTimeOffset DateTime { get; set; }
//     public string Location { get; set; } = string.Empty;
//     public int? Capacity { get; set; }
//     public string Visibility { get; set; } = "Public"; 
//     public Guid OrganizerId { get; set; }
//     public string OrganizerName { get; set; } = string.Empty;
//     public List<string> ParticipantNames { get; set; } = new List<string>();
//     public int ParticipantCount { get; set; }
// }

using System;
using System.Collections.Generic;

namespace Contracts.DTOs.Events;

public class EventDetailsDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset DateTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public int? Capacity { get; set; }
    public string Visibility { get; set; } = "Public";
    public Guid OrganizerId { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public List<string> ParticipantNames { get; set; } = new List<string>();
    public int ParticipantCount => ParticipantNames.Count;
    public List<TagDto> Tags { get; set; } = new List<TagDto>();
}
