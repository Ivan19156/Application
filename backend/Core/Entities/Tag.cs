using System;
using System.Collections.Generic;

namespace Core.Entities;

public class Tag
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // Навігаційна властивість для зв'язку "багато до багатьох"
    public ICollection<EventTag> EventTags { get; set; } = new List<EventTag>();
}
