using Application.Interfaces.Infrastructure;
using Application.Interfaces.Persistence;
using Application.Interfaces.Services; 
using Contracts.DTOs.Auth;
using Core.Entities;
using System;
using System.Threading.Tasks;

namespace Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    
    public async Task<(UserDto? User, string? ErrorMessage)> RegisterAsync(RegisterUserDto registerDto)
{
    var existingUser = await _userRepository.GetUserByEmailAsync(registerDto.Email);
    if (existingUser != null)
    {
        return (null, "Email already exists.");
    }

    var passwordHash = _passwordHasher.HashPassword(registerDto.Password);

    var newUser = new User
    {
        Id = Guid.NewGuid(), 
        Name = registerDto.Name.Trim(), 
        Email = registerDto.Email.ToLower().Trim(), 
        PasswordHash = passwordHash
        
    };

    
    try
    {
        await _userRepository.AddUserAsync(newUser);
    }
    catch (Exception ex)
    {
        
        Console.WriteLine($"Error adding user to database: {ex.Message}"); 
        return (null, "An error occurred during registration."); 
    }

    var userDto = new UserDto
    {
        Id = newUser.Id,
        Name = newUser.Name,
        Email = newUser.Email
    };

    return (userDto, null);
}
    public async Task<(LoginResponseDto? Response, string? ErrorMessage)> LoginAsync(LoginRequestDto loginDto)
{
    var user = await _userRepository.GetUserByEmailAsync(loginDto.Email.ToLower().Trim());
    if (user == null)
    {
        return (null, "Invalid email or password."); 
    }

    bool isPasswordValid;
    try
    {
        isPasswordValid = _passwordHasher.VerifyPassword(loginDto.Password, user.PasswordHash);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error verifying password for {loginDto.Email}: {ex.Message}");
        return (null, "An error occurred during login."); 
    }

    if (!isPasswordValid)
    {
        return (null, "Invalid email or password."); 
    }

    string token;
        try
        {
            token = _jwtTokenGenerator.GenerateToken(user);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error generating token for {loginDto.Email}: {ex.Message}");
            return (null, "An error occurred during login."); 
        }
    
        var userDto = new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email 
        };

        var response = new LoginResponseDto
        {
            Token = token,
            User = userDto
        };
    
    return (response, null);
}
}