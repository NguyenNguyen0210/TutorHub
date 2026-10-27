using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.ResumeService;

public class ResumeServiceCommandHandler : IRequestHandler<ResumeServiceCommand, ServiceDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IServiceDetailCacheService _serviceCache;
    private readonly ITutorProfileCacheService _tutorCache;

    public ResumeServiceCommandHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IServiceDetailCacheService? serviceCache = null,
        ITutorProfileCacheService? tutorCache = null)
    {
        _context = context;
        _currentUserService = currentUserService;
        _serviceCache = serviceCache ?? NoOpServiceDetailCacheService.Instance;
        _tutorCache = tutorCache ?? NoOpTutorProfileCacheService.Instance;
    }

    public async Task<ServiceDto> Handle(ResumeServiceCommand request, CancellationToken cancellationToken)
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
            throw new ForbiddenException("You do not have permission to resume this service.");
        }

        // Domain transition — throws unless Paused
        service.Resume();

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
