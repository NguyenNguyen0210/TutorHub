using FluentValidation;

namespace TutorHub.Application.Features.Tutors.Services.PublishService;

public class PublishServiceCommandValidator : AbstractValidator<PublishServiceCommand>
{
    public PublishServiceCommandValidator()
    {
        RuleFor(x => x.ServiceId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}
