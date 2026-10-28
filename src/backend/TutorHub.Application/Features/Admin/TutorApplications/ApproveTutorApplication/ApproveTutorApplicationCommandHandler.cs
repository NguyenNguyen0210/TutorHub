using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.TutorApplications.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Application.Common.Concurrency;

namespace TutorHub.Application.Features.Admin.TutorApplications.ApproveTutorApplication;

public class ApproveTutorApplicationCommandHandler
    : IRequestHandler<ApproveTutorApplicationCommand, AdminTutorApplicationDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;

    public ApproveTutorApplicationCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<AdminTutorApplicationDto> Handle(
        ApproveTutorApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        await using var transaction = await PostgresAdvisoryLock.BeginTransactionAsync(_context, cancellationToken);
        await PostgresAdvisoryLock.LockRowAsync(_context,
            $"SELECT 1 FROM \"TutorApplications\" WHERE \"Id\" = {request.ApplicationId} FOR UPDATE",
            cancellationToken);

        var application = await _context.TutorApplications
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (application == null)
            throw new NotFoundException("TutorApplication", request.ApplicationId);

        await PostgresAdvisoryLock.AcquireAsync(
            _context, $"tutor-application:{application.UserId:D}", cancellationToken);

        // Domain invariant — throws if not Pending
        application.Approve(userId);

        // Create TutorProfile from application snapshot
        var profileExists = await _context.TutorProfiles
            .AnyAsync(p => p.UserId == application.UserId, cancellationToken);

        if (profileExists)
            throw new ConflictException(
                "A TutorProfile already exists for this user. " +
                "This may indicate the application was already approved.");

        if (application.User.Role != UserRole.Tutor)
        {
            application.User.Role = UserRole.Tutor;
        }

        var tutorProfileId = Guid.NewGuid();

        var profile = new TutorProfile
        {
            Id = tutorProfileId,
            UserId = application.UserId,
            Bio = application.Bio,
            Education = application.Education,
            ExperienceYears = application.ExperienceYears,
            TeachingMode = application.TeachingMode,
            Address = application.Address,
            Latitude = application.Latitude,
            Longitude = application.Longitude,
        };

        _context.TutorProfiles.Add(profile);

        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == application.UserId, cancellationToken);
        if (wallet == null)
        {
            var now = _clock.UtcNow;
            _context.Wallets.Add(new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = application.UserId,
                TutorProfileId = tutorProfileId,
                CreatedAt = now,
                UpdatedAt = now
            });
        }
        else
        {
            wallet.TutorProfileId = tutorProfileId;
        }

        // Enqueue Outbox Message in same DB transaction
        _context.AddOutboxMessage(new TutorApplicationApprovedEvent(
            application.Id,
            application.UserId,
            userId));

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            if (transaction != null)
                await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            if (transaction != null)
                await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        return AdminTutorApplicationDto.From(application);
    }
}
