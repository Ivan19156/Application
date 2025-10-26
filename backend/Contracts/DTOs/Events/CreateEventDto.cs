using System;
using System.Collections.Generic;

namespace Contracts.DTOs.Events;

public class CreateEventDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset Date { get; set; }
    public string Location { get; set; } = string.Empty;
    public int? Capacity { get; set; }
    public string Visibility { get; set; } = "Public";
    public List<string> Tags { get; set; } = new List<string>();
}
