using System; // For Guid

namespace Core.Entities;

public class Participant
{
    // Foreign key for the User participating
    public Guid UserId { get; set; }
    // Navigation property to the User
    public User User { get; set; } = null!;

    // Foreign key for the Event being participated in
    public Guid EventId { get; set; }
    // Navigation property to the Event
    public Event Event { get; set; } = null!;

    // Optional: You could add a timestamp for when the user joined
    // public DateTimeOffset JoinedAt { get; set; }
}