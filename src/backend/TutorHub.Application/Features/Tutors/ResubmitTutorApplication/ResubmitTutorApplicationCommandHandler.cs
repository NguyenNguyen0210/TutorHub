using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.ResubmitTutorApplication;

public class ResubmitTutorApplicationCommandHandler
    : IRequestHandler<ResubmitTutorApplicationCommand, TutorApplicationDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public ResubmitTutorApplicationCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<TutorApplicationDto> Handle(
        ResubmitTutorApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
            throw new NotFoundException("User", userId);

        if (user.Role != UserRole.Tutor)
            throw new BadRequestException(
                "Only users with the Tutor role can resubmit a Tutor application.");

        // F-18: only a Rejected latest application may start a new Pending cycle.
        var latest = await _context.TutorApplications
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.SubmittedAt)
            .ThenByDescending(a => a.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (latest == null)
            throw new BadRequestException(
                "You have no previous application. Use the initial submit endpoint instead.");

        if (latest.Status == TutorApplicationStatus.Pending)
            throw new ConflictException(
                "You already have a pending application under review.");

        if (latest.Status == TutorApplicationStatus.Approved)
            throw new ConflictException(
                "Your Tutor application has already been approved. You cannot resubmit.");

        var application = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Bio = request.Bio.Trim(),
            Education = request.Education.Trim(),
            University = request.University?.Trim() ?? request.Education.Trim(),
            Major = request.Major?.Trim(),
            DegreeLevel = request.DegreeLevel?.Trim(),
            Certifications = request.Certifications?.Trim(),
            Subject = request.Subject?.Trim(),
            SubjectSub = request.SubjectSub?.Trim(),
            ExperienceYears = request.ExperienceYears,
            TeachingMode = request.TeachingMode,
            Address = request.Address?.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Methodology = request.Methodology?.Trim(),
            Achievements = request.Achievements?.Trim(),
            DocumentsJson = request.DocumentsJson,
            SubmittedAt = _clock.UtcNow
        };

        _context.TutorApplications.Add(application);
        _context.AddOutboxMessage(new TutorApplicationSubmittedEvent(application.Id, application.UserId));

        await _context.SaveChangesAsync(cancellationToken);

        return TutorApplicationDto.From(application);
    }
}
