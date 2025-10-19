using Microsoft.AspNetCore.Mvc; 
using Application.Interfaces.Services; 
using Contracts.DTOs.Auth; 
using System.Threading.Tasks; 

namespace WebAPI.Controllers;

[ApiController] 
[Route("api/[controller]")] 
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)] 
    [ProducesResponseType(StatusCodes.Status400BadRequest)] 
    public async Task<IActionResult> Register([FromBody] RegisterUserDto registerDto)
    {
        var (user, errorMessage) = await _authService.RegisterAsync(registerDto);
    
        if (errorMessage != null)
        {
            
            return BadRequest(new { Message = errorMessage });
        }
 
        if (user == null)
        {
           
             return BadRequest(new { Message = "Registration failed for an unknown reason." });
        }

        return CreatedAtAction(nameof(Register), user); 
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)] 
    [ProducesResponseType(StatusCodes.Status400BadRequest)] 
    [ProducesResponseType(StatusCodes.Status401Unauthorized)] 
    public async Task<IActionResult> Login([FromBody] LoginRequestDto loginDto)
    {
        var (response, errorMessage) = await _authService.LoginAsync(loginDto);

        if (errorMessage != null)
        {
            return Unauthorized(new { Message = errorMessage });
        }

        if (response == null)
        {
             return Unauthorized(new { Message = "Login failed for an unknown reason." });
        }

        return Ok(response);
    }
}