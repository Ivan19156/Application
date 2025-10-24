using System;
using System.Threading.Tasks;

namespace Application.Interfaces.Services;

public interface IAiService
{
    Task<string> GetAssistanceAsync(string userQuestion, Guid userId);
}
