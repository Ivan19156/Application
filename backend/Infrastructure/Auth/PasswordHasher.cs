using Application.Interfaces.Infrastructure;
using BCryptNet = BCrypt.Net.BCrypt; // Alias to avoid naming conflicts

namespace Infrastructure.Auth;

public class PasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        // Generate salt and hash password using BCrypt.Net-Next
        return BCryptNet.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        // Verify password against the stored hash
        return BCryptNet.Verify(password, hashedPassword);
    }
}