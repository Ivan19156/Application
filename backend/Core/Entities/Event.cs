using System; 
using System.Collections.Generic;

namespace Core.Entities;


public enum EventVisibility
{
    Public,
    Private
}

public class Event
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset DateTime { get; set; } 
    public string Location { get; set; } = string.Empty;
    public int? Capacity { get; set; } 
    public EventVisibility Visibility { get; set; } = EventVisibility.Public; 

    
    public Guid OrganizerId { get; set; }
    
    public User Organizer { get; set; } = null!; 

    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
}