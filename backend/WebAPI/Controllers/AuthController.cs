using Microsoft.AspNetCore.Mvc; // Required for API controllers
using Application.Interfaces.Services; // Interface for AuthService
using Contracts.DTOs.Auth; // DTOs for request/response
using System.Threading.Tasks; // For async operations

namespace WebAPI.Controllers;

[ApiController] // Indicates this is an API controller
[Route("api/[controller]")] // Sets the base route to /api/auth
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    // Inject the IAuthService using constructor injection
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)] // Success response type
    [ProducesResponseType(StatusCodes.Status400BadRequest)] // Error response type
    public async Task<IActionResult> Register([FromBody] RegisterUserDto registerDto)
    {
        // Call the service method
        var (user, errorMessage) = await _authService.RegisterAsync(registerDto);

        // Check if there was an error (e.g., email already exists)
        if (errorMessage != null)
        {
            // Return a 400 Bad Request with the error message
            return BadRequest(new { Message = errorMessage });
        }

        // Check if user is somehow null even without an error (defensive check)
        if (user == null)
        {
            // This shouldn't happen based on AuthService logic, but handle it
             return BadRequest(new { Message = "Registration failed for an unknown reason." });
        }


        // Return a 201 Created status with the new user's details
        // Optionally, provide a URL to the newly created resource if applicable
        return CreatedAtAction(nameof(Register), user); // Return UserDto
    }

    // POST /api/auth/login
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)] // Success
    [ProducesResponseType(StatusCodes.Status400BadRequest)] // Invalid input
    [ProducesResponseType(StatusCodes.Status401Unauthorized)] // Invalid credentials
    public async Task<IActionResult> Login([FromBody] LoginRequestDto loginDto)
    {
        // Call the service method
        var (response, errorMessage) = await _authService.LoginAsync(loginDto);

        // Check for errors (e.g., invalid credentials)
        if (errorMessage != null)
        {
            // Return 401 Unauthorized for login failures
            return Unauthorized(new { Message = errorMessage });
        }

         // Check if response is somehow null even without an error
        if (response == null)
        {
             return Unauthorized(new { Message = "Login failed for an unknown reason." });
        }


        // Return 200 OK with the LoginResponseDto (containing token and user details)
        return Ok(response);
    }
}