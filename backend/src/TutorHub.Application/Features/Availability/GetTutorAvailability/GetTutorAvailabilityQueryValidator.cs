using FluentValidation;

namespace TutorHub.Application.Features.Availability.GetTutorAvailability;

public class GetTutorAvailabilityQueryValidator : AbstractValidator<GetTutorAvailabilityQuery>
{
    public GetTutorAvailabilityQueryValidator()
    {
        RuleFor(x => x.TutorProfileId)
            .NotEmpty().WithMessage("TutorProfileId is required.");

        RuleFor(x => x)
            .Must(x => !x.FromDate.HasValue || !x.ToDate.HasValue || x.ToDate.Value >= x.FromDate.Value)
            .WithMessage("ToDate must be greater than or equal to FromDate.")
            .Must(x => !x.FromDate.HasValue || !x.ToDate.HasValue || (x.ToDate.Value.DayNumber - x.FromDate.Value.DayNumber) <= 30)
            .WithMessage("Date range cannot exceed 30 days.");
    }
}
