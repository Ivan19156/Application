using System;

namespace Contracts.DTOs.Events;

public class TagDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
