using System;

namespace Contracts.DTOs.Auth;

// Represents basic user info safe to send to the client
public class UserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}