using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;
using TutorHub.Application.Common.Caching;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Services.AdminForceUnpublishService;

public class AdminForceUnpublishServiceCommandHandler : IRequestHandler<AdminForceUnpublishServiceCommand, ServiceDto>
{
    private readonly IAppDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IServiceDetailCacheService _serviceCache;
    private readonly ITutorProfileCacheService _tutorCache;

    public AdminForceUnpublishServiceCommandHandler(
        IAppDbContext context,
        IAuditLogService auditLogService,
        ICurrentUserService currentUserService,
        IServiceDetailCacheService? serviceCache = null,
        ITutorProfileCacheService? tutorCache = null)
    {
        _context = context;
        _auditLogService = auditLogService;
        _currentUserService = currentUserService;
        _serviceCache = serviceCache ?? NoOpServiceDetailCacheService.Instance;
        _tutorCache = tutorCache ?? NoOpTutorProfileCacheService.Instance;
    }

    public async Task<ServiceDto> Handle(AdminForceUnpublishServiceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length is < 5 or > 500)
            throw new BadRequestException("Lý do ngừng xuất bản cần từ 5 đến 500 ký tự.");

        var service = await _context.Services
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId, cancellationToken);

        if (service == null)
        {
            throw new NotFoundException("Service", request.ServiceId);
        }

        if (service.Status is not (ServiceStatus.Published or ServiceStatus.Paused))
            throw new ConflictException("Gói học không ở trạng thái có thể ngừng xuất bản.");
        var previousStatus = service.Status.ToString();
        service.Unpublish();

        await _auditLogService.LogAsync(
            action: "SERVICE_FORCE_UNPUBLISHED",
            entityName: "Service",
            entityId: service.Id.ToString(),
            userId: userId,
            oldValues: new { status = previousStatus },
            newValues: new { status = service.Status.ToString(), reason = request.Reason.Trim() },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
        await _serviceCache.InvalidateServiceDetailAsync(service.Id, cancellationToken);
        await _tutorCache.InvalidateTutorProfileAsync(service.TutorProfileId, cancellationToken);

        return ServiceDtoMapper.FromService(
            service,
            service.Subject.Name,
            service.Subject.Category.Name
        );
    }
}
