using System;

namespace Core.Entities;

// Проміжна сутність для зв'язку "багато до багатьох" між Event та Tag
public class EventTag
{
    // Зовнішній ключ для Event
    public Guid EventId { get; set; }
    public Event Event { get; set; } = null!;

    // Зовнішній ключ для Tag
    public Guid TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}

