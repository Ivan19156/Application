using System;
using System.Collections.Generic;

namespace Contracts.DTOs.Events;

public class UpdateEventDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset? Date { get; set; }
    public string? Location { get; set; }
    public int? Capacity { get; set; }
    public string? Visibility { get; set; }
    public List<string>? Tags { get; set; }
}
