using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.Services.UpdateService;

public class UpdateServiceCommandHandler : IRequestHandler<UpdateServiceCommand, ServiceDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public UpdateServiceCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<ServiceDto> Handle(UpdateServiceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var service = await _context.Services
            .Include(s => s.TutorProfile)
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId, cancellationToken);

        if (service == null)
        {
            throw new NotFoundException("Service", request.ServiceId);
        }

        if (service.TutorProfile.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to update this service.");
        }

        // Commercial invariants check when Published.
        // ShortDescription/Tags/CoverImageUrl follow the same lock rule as
        // price/sessions: editable while Draft/Unpublished/Paused, frozen while
        // Published (unpublish or pause first).
        if (service.Status == ServiceStatus.Published)
        {
            var isChangingCommercialTerms =
                (request.TotalSessions.HasValue && request.TotalSessions.Value != service.TotalSessions) ||
                (request.SessionDurationMinutes.HasValue && request.SessionDurationMinutes.Value != service.SessionDurationMinutes) ||
                (request.Price.HasValue && request.Price.Value != service.Price) ||
                (request.TeachingMode.HasValue && request.TeachingMode.Value != service.TeachingMode);

            var isChangingShowcaseFields =
                (request.ShortDescription != null && request.ShortDescription != service.ShortDescription) ||
                (request.Tags != null && ServiceDtoMapper.SerializeTags(request.Tags) != service.TagsJson) ||
                (request.CoverImageUrl != null && request.CoverImageUrl != service.CoverImageUrl);

            if (isChangingCommercialTerms || isChangingShowcaseFields)
            {
                throw new ConflictException("Cannot modify commercial terms or showcase fields (short description, tags, cover image) of a published service. Please unpublish or pause the service first.");
            }
        }

        // Apply updates
        if (!string.IsNullOrWhiteSpace(request.Title))
            service.Title = request.Title;

        if (!string.IsNullOrWhiteSpace(request.Description))
            service.Description = request.Description;

        if (request.ShortDescription != null)
            service.ShortDescription = request.ShortDescription;

        if (request.Tags != null)
            service.TagsJson = ServiceDtoMapper.SerializeTags(request.Tags);

        if (request.LearningScope != null)
            service.LearningScope = request.LearningScope;

        if (request.ExpectedOutcome != null)
            service.ExpectedOutcome = request.ExpectedOutcome;

        if (request.TotalSessions.HasValue)
            service.TotalSessions = request.TotalSessions.Value;

        if (request.SessionDurationMinutes.HasValue)
            service.SessionDurationMinutes = request.SessionDurationMinutes.Value;

        if (request.Price.HasValue)
            service.Price = request.Price.Value;

        if (request.TeachingMode.HasValue)
            service.TeachingMode = request.TeachingMode.Value;

        if (request.TrialLessonUrl != null)
            service.TrialLessonUrl = request.TrialLessonUrl;

        if (request.CoverImageUrl != null)
            service.CoverImageUrl = request.CoverImageUrl;

        service.UpdatedAt = _clock.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceDtoMapper.FromService(
            service,
            service.Subject.Name,
            service.Subject.Category.Name
        );
    }
}
