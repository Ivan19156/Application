using Core.Entities; // Import Participant entity
using System;
using System.Threading.Tasks;

namespace Application.Interfaces.Persistence;

public interface IParticipantRepository
{
    // Add a participation record (user joins an event)
    Task AddParticipantAsync(Participant participant);

    // Remove a participation record (user leaves an event)
    Task RemoveParticipantAsync(Guid userId, Guid eventId);

    // Check if a user is already participating in an event
    Task<bool> IsUserParticipatingAsync(Guid userId, Guid eventId);

    // (Optional) Get count of participants for an event
    Task<int> GetParticipantCountAsync(Guid eventId);

    // (Optional) Get list of participant user IDs for an event
    // Task<IEnumerable<Guid>> GetParticipantUserIdsAsync(Guid eventId);
}