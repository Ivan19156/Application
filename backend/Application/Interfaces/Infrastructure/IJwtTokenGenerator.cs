using Core.Entities; 

namespace Application.Interfaces.Infrastructure;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}