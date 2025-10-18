using System; // For Guid and DateTimeOffset
using System.Collections.Generic; // For ICollection

namespace Core.Entities;

// Enum for Event Visibility
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
    public DateTimeOffset DateTime { get; set; } // Use DateTimeOffset for better timezone handling
    public string Location { get; set; } = string.Empty;
    public int? Capacity { get; set; } // Nullable int for optional capacity (null means unlimited)
    public EventVisibility Visibility { get; set; } = EventVisibility.Public; // Default to Public

    // --- Relationships ---

    // Foreign key for the organizer
    public Guid OrganizerId { get; set; }
    // Navigation property to the organizer (User)
    public User Organizer { get; set; } = null!; // Required relationship

    // Navigation property for the participants (many-to-many)
    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
}