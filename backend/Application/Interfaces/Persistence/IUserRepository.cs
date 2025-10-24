using Core.Entities; 
using System;
using System.Threading.Tasks; 

namespace Application.Interfaces.Persistence;

public interface IUserRepository
{
    
    Task<User?> GetUserByEmailAsync(string email);
    Task AddUserAsync(User user);
    Task<User?> GetUserByIdAsync(Guid id);
    Task<IEnumerable<User>> GetUsersByIdsAsync(IEnumerable<Guid> ids);
}