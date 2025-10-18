using Core.Entities; // Import User entity from Core layer
using System;
using System.Threading.Tasks; // For async operations

namespace Application.Interfaces.Persistence;

public interface IUserRepository
{
    // Find a user by their unique email address
    Task<User?> GetUserByEmailAsync(string email);

    // Add a new user to the database
    Task AddUserAsync(User user);

    // (Optional) Find a user by their ID
    Task<User?> GetUserByIdAsync(Guid id);

    // Add other user-related methods as needed (e.g., UpdateUserAsync)
}