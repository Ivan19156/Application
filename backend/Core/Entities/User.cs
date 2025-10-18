namespace Core.Entities;

public class User
{
    // Properties based on requirements (login, organizer relation)
    public Guid Id { get; set; } // Using Guid for unique IDs
    public string Name { get; set; } = string.Empty; // User's name
    public string Email { get; set; } = string.Empty; // Unique email for login
    public string PasswordHash { get; set; } = string.Empty; // Store hashed password, not plain text

    // Navigation properties (optional for Dapper, but good practice)
    // A user can organize many events
    public ICollection<Event> OrganizedEvents { get; set; } = new List<Event>();

    // A user can participate in many events (via Participant table)
    public ICollection<Participant> Participations { get; set; } = new List<Participant>();
}