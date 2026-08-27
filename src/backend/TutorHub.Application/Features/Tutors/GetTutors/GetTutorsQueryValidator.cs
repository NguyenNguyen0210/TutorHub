using FluentValidation;

namespace TutorHub.Application.Features.Tutors.GetTutors;

public class GetTutorsQueryValidator : AbstractValidator<GetTutorsQuery>
{
    public GetTutorsQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1).WithMessage("Page number must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100.");

        RuleFor(x => x.MinPrice)
            .GreaterThanOrEqualTo(0).When(x => x.MinPrice.HasValue)
            .WithMessage("Min price must be 0 or greater.");

        RuleFor(x => x.MaxPrice)
            .GreaterThanOrEqualTo(0).When(x => x.MaxPrice.HasValue)
            .WithMessage("Max price must be 0 or greater.");

        RuleFor(x => x.MinRating)
            .InclusiveBetween(0, 5).When(x => x.MinRating.HasValue)
            .WithMessage("Min rating must be between 0 and 5.");
    }
}
