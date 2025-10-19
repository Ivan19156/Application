namespace Core.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public ICollection<Event> OrganizedEvents { get; set; } = new List<Event>();
    public ICollection<Participant> Participations { get; set; } = new List<Participant>();
}