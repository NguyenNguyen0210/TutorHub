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

    public UpdateServiceCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceDto> Handle(UpdateServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await _context.Services
            .Include(s => s.TutorProfile)
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId, cancellationToken);

        if (service == null)
        {
            throw new NotFoundException("Service", request.ServiceId);
        }

        if (service.TutorProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to update this service.");
        }

        // Commercial invariants check when Published
        if (service.Status == ServiceStatus.Published)
        {
            var isChangingCommercialTerms =
                (request.TotalSessions.HasValue && request.TotalSessions.Value != service.TotalSessions) ||
                (request.SessionDurationMinutes.HasValue && request.SessionDurationMinutes.Value != service.SessionDurationMinutes) ||
                (request.Price.HasValue && request.Price.Value != service.Price) ||
                (request.TeachingMode.HasValue && request.TeachingMode.Value != service.TeachingMode);

            if (isChangingCommercialTerms)
            {
                throw new ConflictException("Cannot modify commercial terms (sessions, duration, price, mode) of a published service. Please unpublish the service first.");
            }
        }

        // Apply updates
        if (!string.IsNullOrWhiteSpace(request.Title))
            service.Title = request.Title;

        if (!string.IsNullOrWhiteSpace(request.Description))
            service.Description = request.Description;

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

        service.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new ServiceDto(
            Id: service.Id,
            TutorProfileId: service.TutorProfileId,
            SubjectId: service.SubjectId,
            SubjectName: service.Subject.Name,
            SubjectCategoryName: service.Subject.Category.Name,
            Title: service.Title,
            Description: service.Description,
            LearningScope: service.LearningScope,
            ExpectedOutcome: service.ExpectedOutcome,
            TotalSessions: service.TotalSessions,
            SessionDurationMinutes: service.SessionDurationMinutes,
            Price: service.Price,
            TeachingMode: service.TeachingMode.ToString(),
            TrialLessonUrl: service.TrialLessonUrl,
            Status: service.Status.ToString(),
            CreatedAt: service.CreatedAt,
            UpdatedAt: service.UpdatedAt
        );
    }
}
