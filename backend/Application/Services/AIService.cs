using Application.Interfaces.Infrastructure;
using Application.Interfaces.Persistence;
using Application.Interfaces.Services;
using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Services;

public class AIService : IAiService
{
    private readonly IGroqApiClient _groqClient;
    private readonly IEventRepository _eventRepository;
    private readonly IUserRepository _userRepository;
    private readonly IParticipantRepository _participantRepository;
    private readonly IEventTagRepository _eventTagRepository;

    public AIService(
        IGroqApiClient groqClient,
        IEventRepository eventRepository,
        IUserRepository userRepository,
        IParticipantRepository participantRepository,
        IEventTagRepository eventTagRepository)
    {
        _groqClient = groqClient;
        _eventRepository = eventRepository;
        _userRepository = userRepository;
        _participantRepository = participantRepository;
        _eventTagRepository = eventTagRepository;
    }

    public async Task<string> GetAssistanceAsync(string userQuestion, Guid userId)
    {
        var context = await BuildContextAsync(userId);
        var systemPrompt = BuildSystemPrompt(context, userId);

        Console.WriteLine("--- SYSTEM PROMPT (DEBUG) ---");
        Console.WriteLine(systemPrompt);
        Console.WriteLine("--- USER QUESTION (DEBUG) ---");
        Console.WriteLine(userQuestion);

        return await _groqClient.GenerateChatResponseAsync(systemPrompt, userQuestion);
    }

    private async Task<string> BuildContextAsync(Guid userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        var allUserEvents = await _eventRepository.GetEventsForUserAsync(userId);
        var allPublicEvents = await _eventRepository.GetPublicEventsAsync(null, 1, 50);

        var contextBuilder = new StringBuilder();
        contextBuilder.AppendLine($"--- User Information ---");
        contextBuilder.AppendLine($"Current User: {user?.Name} (ID: {userId}).");
        contextBuilder.AppendLine($"Current Date and Time: {DateTimeOffset.UtcNow:yyyy-MM-dd HH:mm} UTC.");

        // --- Список 1: Організовані події ---
        contextBuilder.AppendLine("\n--- Events You Are ORGANIZING ---");
        var organizedEvents = allUserEvents.Where(e => e.OrganizerId == userId).ToList();
        if (organizedEvents.Any())
        {
            foreach (var ev in organizedEvents)
            {
                var tags = await _eventTagRepository.GetTagsForEventAsync(ev.Id);
                var tagNames = tags.Any() ? string.Join(", ", tags.Select(t => t.Name)) : "none";
                
                var participants = await _participantRepository.GetParticipantsForEventAsync(ev.Id);
                var participantNames = participants.Any() 
                    ? string.Join(", ", participants.Select(p => p.Name)) 
                    : "none";

                contextBuilder.AppendLine($"- Event: '{ev.Name}', Date: {ev.DateTime:yyyy-MM-dd HH:mm}, Location: {ev.Location}, Tags: [{tagNames}], Participants: [{participantNames}]");
            }
        }
        else
        {
            contextBuilder.AppendLine("You are not organizing any events.");
        }

        // --- Список 2: Події, до яких користувач приєднався ---
        contextBuilder.AppendLine("\n--- Events You Have JOINED (as a participant) ---");
        var joinedEvents = allUserEvents.Where(e => e.OrganizerId != userId).ToList();
        if (joinedEvents.Any())
        {
            foreach (var ev in joinedEvents)
            {
                var tags = await _eventTagRepository.GetTagsForEventAsync(ev.Id);
                var tagNames = tags.Any() ? string.Join(", ", tags.Select(t => t.Name)) : "none";
                
                var participants = await _participantRepository.GetParticipantsForEventAsync(ev.Id);
                var participantNames = participants.Any() 
                    ? string.Join(", ", participants.Select(p => p.Name)) 
                    : "none";

                contextBuilder.AppendLine($"- Event: '{ev.Name}', Date: {ev.DateTime:yyyy-MM-dd HH:mm}, Location: {ev.Location}, Tags: [{tagNames}], Participants: [{participantNames}]");
            }
        }
        else
        {
            contextBuilder.AppendLine("You have not joined any events.");
        }

        // --- Список 3: Інші публічні події (ТЕПЕР З УЧАСНИКАМИ) ---
        contextBuilder.AppendLine("\n--- Other Available Public Events (for general search) ---");
        var otherPublicEvents = allPublicEvents.Where(e => !allUserEvents.Any(ue => ue.Id == e.Id));
        if (otherPublicEvents.Any())
        {
            foreach (var ev in otherPublicEvents.Take(20))
            {
                var tags = await _eventTagRepository.GetTagsForEventAsync(ev.Id);
                var tagNames = tags.Any() ? string.Join(", ", tags.Select(t => t.Name)) : "none";
                
                // ✅ Тепер додаємо учасників і для публічних подій
                var participants = await _participantRepository.GetParticipantsForEventAsync(ev.Id);
                var participantNames = participants.Any() 
                    ? string.Join(", ", participants.Select(p => p.Name)) 
                    : "none";

                contextBuilder.AppendLine($"- Event: '{ev.Name}', Date: {ev.DateTime:yyyy-MM-dd HH:mm}, Location: {ev.Location}, Tags: [{tagNames}], Participants: [{participantNames}]");
            }
        }
        else
        {
            contextBuilder.AppendLine("There are no other public events available right now.");
        }

        return contextBuilder.ToString();
    }

    private string BuildSystemPrompt(string context, Guid userId)
    {
        return $"""
        You are "EventHorizon", a helpful AI assistant for an event management app.
        Your task is to answer the user's question based *only* on the context provided below.
        Today's date is {DateTimeOffset.UtcNow:yyyy-MM-dd}.
        The user's ID is {userId}.

        **Strict Rules:**
        1.  Base all answers *only* on the information in the CONTEXT sections.
        2.  Do not make up information. If the answer isn't in the context, say "I don't have that information."
        3.  Be concise and friendly.
        4.  When asked about the user's events, check BOTH "Events You Are ORGANIZING" AND "Events You Have JOINED".
        5.  When asked about *other* events (e.g., "any public events", "find events"), you MUST look in the "Other Available Public Events" list.
        6.  When asked "Who's attending [event name]?", look for that event in ALL three sections and provide the Participants list.
        7.  If an event exists but has "Participants: [none]", say "No one has joined this event yet."
        8.  If you cannot find the event by name, say "I couldn't find an event with that name in your available events."
        9. If the question is unclear or unsupported, return a fallback message: “Sorry, I didn’t understand that. Please try rephrasing your question.”


        **Response Style:**
        - Use natural language
        - Be helpful and conversational
        - Format lists of participants clearly
        - Include event details when relevant to the question

        --- CONTEXT ---
        {context}
        --- END OF CONTEXT ---
        """;
    }
}