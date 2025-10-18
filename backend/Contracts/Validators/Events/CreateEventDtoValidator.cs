using Contracts.DTOs.Events;
using FluentValidation;
using System; // For DateTimeOffset comparison

namespace Contracts.Validators.Events;

public class CreateEventDtoValidator : AbstractValidator<CreateEventDto>
{
    public CreateEventDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Event title is required.")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters."); // Optional field

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Event date and time are required.")
            // Ensure the date is in the future
            .Must(date => date > DateTimeOffset.UtcNow)
            .WithMessage("Event date must be in the future.");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Location is required.")
            .MaximumLength(255).WithMessage("Location cannot exceed 255 characters.");

        RuleFor(x => x.Capacity)
            .GreaterThanOrEqualTo(1).When(x => x.Capacity.HasValue) // Only validate if a value is provided
            .WithMessage("Capacity must be at least 1 if specified.");

        RuleFor(x => x.Visibility)
            .NotEmpty().WithMessage("Visibility is required.")
            .Must(v => v.Equals("Public", StringComparison.OrdinalIgnoreCase) || v.Equals("Private", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Visibility must be either 'Public' or 'Private'.");
    }
}