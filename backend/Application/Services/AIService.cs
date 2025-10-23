using Application.Interfaces.Infrastructure;
using Application.Interfaces.Persistence;
using Application.Interfaces.Services;
using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public class AIService : IAiService
{
    private readonly IGroqApiClient _groqClient;
    private readonly IEventRepository _eventRepository;
    private readonly IUserRepository _userRepository;
    private readonly IParticipantRepository _participantRepository;
    private readonly ILogger<AIService> _logger;

    public AIService(
        IGroqApiClient groqClient,
        IEventRepository eventRepository,
        IUserRepository userRepository,
        IParticipantRepository participantRepository,
        ILogger<AIService> logger)
    {
        _groqClient = groqClient;
        _eventRepository = eventRepository;
        _userRepository = userRepository;
        _participantRepository = participantRepository;
        _logger = logger;
    }

    public async Task<string> GetAssistanceAsync(string userQuestion, Guid userId)
    {
        try
        {
            
            var context = await BuildContextAsync(userId);
                        
            var systemPrompt = BuildSystemPrompt(context);

            return await _groqClient.GenerateChatResponseAsync(systemPrompt, userQuestion);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting AI assistance for user {UserId}", userId);
            throw;
        }
    }

    private async Task<string> BuildContextAsync(Guid userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        var myEvents = await _eventRepository.GetEventsForUserAsync(userId);
        
        var publicEvents = await _eventRepository.GetPublicEventsAsync(
            searchTerm: null, 
            page: 1, 
            pageSize: 15  
        );

        var contextBuilder = new StringBuilder();
        var now = DateTimeOffset.UtcNow;
        
        contextBuilder.AppendLine("=== USER INFORMATION ===");
        contextBuilder.AppendLine($"Current User: {user?.Name} (ID: {user?.Id})");
        contextBuilder.AppendLine($"Current Date: {now:yyyy-MM-dd HH:mm} UTC");
        contextBuilder.AppendLine();

        contextBuilder.AppendLine("=== MY EVENTS (Joined or Organized) ===");
        if (myEvents.Any())
        {
            foreach (var ev in myEvents)
            {
                var participantCount = await _participantRepository.GetParticipantCountAsync(ev.Id);
                var isOrganizer = ev.OrganizerId == userId;
                var daysUntil = (ev.DateTime - now).Days;
                
                contextBuilder.AppendLine($"- {ev.Name}");
                contextBuilder.AppendLine($"  Date: {ev.DateTime:yyyy-MM-dd HH:mm} UTC (in {daysUntil} days)");
                contextBuilder.AppendLine($"  Location: {ev.Location}");
                contextBuilder.AppendLine($"  Role: {(isOrganizer ? "Organizer" : "Participant")}");
                contextBuilder.AppendLine($"  Attendees: {participantCount}/{ev.Capacity?.ToString() ?? "Unlimited"}");
                contextBuilder.AppendLine();
            }
        }
        else
        {
            contextBuilder.AppendLine("You have no events (not joined or organized any events yet).");
            contextBuilder.AppendLine();
        }

        contextBuilder.AppendLine("=== AVAILABLE PUBLIC EVENTS ===");
        if (publicEvents.Any())
        {
            var upcomingPublic = publicEvents
                .Where(e => e.DateTime >= now)
                .OrderBy(e => e.DateTime)
                .ToList();

            if (upcomingPublic.Any())
            {
                contextBuilder.AppendLine($"There are {upcomingPublic.Count} upcoming public events:");
                contextBuilder.AppendLine();
                
                foreach (var ev in upcomingPublic)
                {
                    var participantCount = await _participantRepository.GetParticipantCountAsync(ev.Id);
                    var daysUntil = (ev.DateTime - now).Days;
                    var isUserJoined = myEvents.Any(m => m.Id == ev.Id);
                    
                    contextBuilder.AppendLine($"- {ev.Name}");
                    contextBuilder.AppendLine($"  Date: {ev.DateTime:yyyy-MM-dd HH:mm} UTC (in {daysUntil} days)");
                    contextBuilder.AppendLine($"  Location: {ev.Location}");
                    contextBuilder.AppendLine($"  Attendees: {participantCount}/{ev.Capacity?.ToString() ?? "Unlimited"}");
                    contextBuilder.AppendLine($"  Status: {(isUserJoined ? "You are already joined" : "Available to join")}");
                    
                    if (!string.IsNullOrEmpty(ev.Description))
                    {
                        var shortDesc = ev.Description.Length > 80 
                            ? ev.Description.Substring(0, 77) + "..." 
                            : ev.Description;
                        contextBuilder.AppendLine($"  Description: {shortDesc}");
                    }
                    contextBuilder.AppendLine();
                }
            }
            else
            {
                contextBuilder.AppendLine("No upcoming public events available.");
                contextBuilder.AppendLine();
            }
        }
        else
        {
            contextBuilder.AppendLine("No public events available.");
            contextBuilder.AppendLine();
        }

        return contextBuilder.ToString();
    }

    private string BuildSystemPrompt(string context)
    {
        return $"""
        You are a helpful AI assistant for an event management app.
        
        Your task is to answer the user's question based on the context below.
        
        **What you can help with:**
        - Information about user's events (events they joined or organized)
        - Information about available public events
        - Event details like dates, locations, and participant counts
        - Suggestions for events to join
        
        **Rules:**
        1. Answer ONLY based on the context provided
        2. If the answer is not in the context, say "I don't have that information"
        3. Be concise and friendly
        4. When mentioning dates, you can say "in X days"
        5. Don't make up information
        6. If the question is unclear or you can't understand what the user is asking, respond with: "Sorry, I didn't understand that. Please try rephrasing your question."
        
        --- CONTEXT ---
        {context}
        --- END OF CONTEXT ---
        
        Now answer the user's question.
        """;
    }
}

