using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Admin.Services.AdminForceUnpublishService;

public class AdminForceUnpublishServiceCommandHandler : IRequestHandler<AdminForceUnpublishServiceCommand, ServiceDto>
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;

    public AdminForceUnpublishServiceCommandHandler(
        IAppDbContext context,
        IAuditLogService auditLogService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
    }

    public async Task<ServiceDto> Handle(AdminForceUnpublishServiceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var service = await _context.Services
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId, cancellationToken);

        if (service == null)
        {
            throw new NotFoundException("Service", request.ServiceId);
        }

        // Domain state transition — throws if Draft or already Unpublished
        service.Unpublish();

        await _auditLogService.LogAsync(
            action: "SERVICE_FORCE_UNPUBLISHED",
            entityName: "Service",
            entityId: service.Id.ToString(),
            userId: userId,
            oldValues: new { status = "Published" },
            newValues: new { status = service.Status.ToString() },
            cancellationToken: cancellationToken);

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
