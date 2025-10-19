using Core.Entities; // Import User entity from Core layer
using System;
using System.Threading.Tasks; // For async operations

namespace Application.Interfaces.Persistence;

public interface IUserRepository
{
    
    Task<User?> GetUserByEmailAsync(string email);
    Task AddUserAsync(User user);
    Task<User?> GetUserByIdAsync(Guid id);
    Task<IEnumerable<User>> GetUsersByIdsAsync(IEnumerable<Guid> ids);
}