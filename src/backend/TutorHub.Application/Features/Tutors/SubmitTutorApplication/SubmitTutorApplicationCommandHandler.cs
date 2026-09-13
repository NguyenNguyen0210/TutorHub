using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.SubmitTutorApplication;

public class SubmitTutorApplicationCommandHandler
    : IRequestHandler<SubmitTutorApplicationCommand, TutorApplicationDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public SubmitTutorApplicationCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<TutorApplicationDto> Handle(
        SubmitTutorApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
            throw new NotFoundException("User", userId);

        if (user.Role != UserRole.Tutor)
            throw new BadRequestException(
                "Only users with the Tutor role can submit a Tutor application.");

        // Guard: at most one Pending application
        var hasPending = await _context.TutorApplications
            .AnyAsync(a => a.UserId == userId
                && a.Status == TutorApplicationStatus.Pending,
                cancellationToken);

        if (hasPending)
            throw new ConflictException(
                "You already have a pending application under review. " +
                "Please wait for Admin to complete the review.");

        // Guard: already approved
        var hasApproved = await _context.TutorApplications
            .AnyAsync(a => a.UserId == userId
                && a.Status == TutorApplicationStatus.Approved,
                cancellationToken);

        if (hasApproved)
            throw new ConflictException(
                "Your Tutor application has already been approved. " +
                "You cannot submit another application.");

        var application = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Bio = request.Bio.Trim(),
            Education = request.Education.Trim(),
            ExperienceYears = request.ExperienceYears,
            TeachingMode = request.TeachingMode,
            Address = request.Address?.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            SubmittedAt = _clock.UtcNow
        };

        _context.TutorApplications.Add(application);

        // Enqueue Outbox Message in same DB transaction (DEC-S7-001, DEC-S7-002)
        _context.AddOutboxMessage(new TutorApplicationSubmittedEvent(application.Id, application.UserId));

        await _context.SaveChangesAsync(cancellationToken);

        return TutorApplicationDto.From(application);
    }
}
