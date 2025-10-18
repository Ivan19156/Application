namespace Contracts.DTOs.Auth;

// Represents the data sent back after successful login
public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty; // The JWT
    public UserDto User { get; set; } = null!;       // User details
}