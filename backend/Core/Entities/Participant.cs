using System;

namespace Core.Entities;

public class Participant
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;

}