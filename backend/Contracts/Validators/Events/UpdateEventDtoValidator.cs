using Contracts.DTOs.Events;
using FluentValidation;
using System;

namespace Contracts.Validators.Events;

public class UpdateEventDtoValidator : AbstractValidator<UpdateEventDto>
{
    public UpdateEventDtoValidator()
    {
        // Only validate fields IF they are provided in the PATCH request
        RuleFor(x => x.Title)
            .MaximumLength(200).When(x => x.Title != null)
            .WithMessage("Title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).When(x => x.Description != null)
            .WithMessage("Description cannot exceed 2000 characters.");

        RuleFor(x => x.Date)
            .Must(date => date > DateTimeOffset.UtcNow).When(x => x.Date.HasValue)
            .WithMessage("Event date must be in the future.");

        RuleFor(x => x.Location)
            .MaximumLength(255).When(x => x.Location != null)
            .WithMessage("Location cannot exceed 255 characters.");

        RuleFor(x => x.Capacity)
            .GreaterThanOrEqualTo(1).When(x => x.Capacity.HasValue && x.Capacity != null) // Validate >1 only if not explicitly set to null
            .WithMessage("Capacity must be at least 1 if specified.");

         RuleFor(x => x.Visibility)
            .Must(v => v!.Equals("Public", StringComparison.OrdinalIgnoreCase) || v!.Equals("Private", StringComparison.OrdinalIgnoreCase))
                .When(x => x.Visibility != null)
            .WithMessage("Visibility must be either 'Public' or 'Private'.");
    }
}