using Contracts.DTOs.Auth; 
using System.Threading.Tasks;

namespace Application.Interfaces.Services;

public interface IAuthService
{
    
    Task<(UserDto? User, string? ErrorMessage)> RegisterAsync(RegisterUserDto registerDto);
    Task<(LoginResponseDto? Response, string? ErrorMessage)> LoginAsync(LoginRequestDto loginDto);
}