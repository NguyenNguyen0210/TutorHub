using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.Services.PublishService;

public class PublishServiceCommandHandler : IRequestHandler<PublishServiceCommand, ServiceDto>
{
    private readonly IAppDbContext _context;

    public PublishServiceCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceDto> Handle(PublishServiceCommand request, CancellationToken cancellationToken)
    {
        // 1. Load service with dependencies
        var service = await _context.Services
            .Include(s => s.TutorProfile)
                .ThenInclude(t => t.User)
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId, cancellationToken);

        if (service == null)
        {
            throw new NotFoundException("Service", request.ServiceId);
        }

        // 2. Verify ownership
        if (service.TutorProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to publish this service.");
        }

        // 3. Verify user account is Active
        if (service.TutorProfile.User.Status != AccountStatus.Active)
        {
            throw new ForbiddenException("Your user account is not active.");
        }

        // 4. Verify approved tutor application
        var isApprovedTutor = await _context.TutorApplications
            .AnyAsync(a => a.UserId == request.UserId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

        if (!isApprovedTutor)
        {
            throw new ForbiddenException("Only approved tutors can publish services.");
        }

        // 5. Validate publishable fields
        if (string.IsNullOrWhiteSpace(service.Title) ||
            string.IsNullOrWhiteSpace(service.Description) ||
            service.TotalSessions <= 0 ||
            service.SessionDurationMinutes <= 0 ||
            service.Price <= 0)
        {
            throw new BadRequestException("Cannot publish service: required fields are missing or invalid.");
        }

        // 6. Domain state transition
        service.Publish();

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
