using Contracts.DTOs.Auth; // Use DTOs from Contracts
using System.Threading.Tasks;

namespace Application.Interfaces.Services; // Adjust namespace if needed

public interface IAuthService
{
    // Returns the created User DTO or an error message
    Task<(UserDto? User, string? ErrorMessage)> RegisterAsync(RegisterUserDto registerDto);

    // Returns the Login Response DTO (with token and user) or an error message
    Task<(LoginResponseDto? Response, string? ErrorMessage)> LoginAsync(LoginRequestDto loginDto);
}