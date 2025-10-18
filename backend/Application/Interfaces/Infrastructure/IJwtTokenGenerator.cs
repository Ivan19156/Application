using Core.Entities; // We need User

namespace Application.Interfaces.Infrastructure;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}