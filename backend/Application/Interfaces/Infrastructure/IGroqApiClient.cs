using System.Threading.Tasks;

namespace Application.Interfaces.Infrastructure;

public interface IGroqApiClient
{
    Task<string> GenerateChatResponseAsync(string systemPrompt, string userMessage);
}
