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
    private readonly ICurrentUserService _currentUserService;

    public PublishServiceCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ServiceDto> Handle(PublishServiceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

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
        if (service.TutorProfile.UserId != userId)
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
            .AnyAsync(a => a.UserId == userId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

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

        return ServiceDtoMapper.FromService(
            service,
            service.Subject.Name,
            service.Subject.Category.Name
        );
    }
}
