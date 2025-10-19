using Core.Entities; 
using System;
using System.Threading.Tasks;

namespace Application.Interfaces.Persistence;

public interface IParticipantRepository
{
    
    Task AddParticipantAsync(Participant participant);
    Task RemoveParticipantAsync(Guid userId, Guid eventId);
    Task<bool> IsUserParticipatingAsync(Guid userId, Guid eventId);  
    Task<int> GetParticipantCountAsync(Guid eventId);
    // Task<IEnumerable<Guid>> GetParticipantUserIdsAsync(Guid eventId);
    Task<IEnumerable<User>> GetParticipantsForEventAsync(Guid eventId);
}