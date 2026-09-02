using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.TutorApplications.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.TutorApplications.ApproveTutorApplication;

public class ApproveTutorApplicationCommandHandler
    : IRequestHandler<ApproveTutorApplicationCommand, AdminTutorApplicationDto>
{
    private readonly IAppDbContext _context;

    public ApproveTutorApplicationCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminTutorApplicationDto> Handle(
        ApproveTutorApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var application = await _context.TutorApplications
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken);

        if (application == null)
            throw new NotFoundException("TutorApplication", request.ApplicationId);

        // Domain invariant — throws if not Pending
        application.Approve(request.AdminId);

        // Create TutorProfile from application snapshot
        var profileExists = await _context.TutorProfiles
            .AnyAsync(p => p.UserId == application.UserId, cancellationToken);

        if (profileExists)
            throw new ConflictException(
                "A TutorProfile already exists for this user. " +
                "This may indicate the application was already approved.");

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
            RatingAvg = 0,
            TotalReviews = 0
        };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfileId,
            PendingBalance = 0,
            AvailableBalance = 0,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TutorProfiles.Add(profile);
        _context.Wallets.Add(wallet);

        // Enqueue Outbox Message in same DB transaction (DEC-S7-001, DEC-S7-002)
        _context.AddOutboxMessage(new TutorApplicationApprovedEvent(
            application.Id,
            application.UserId,
            request.AdminId));

        if (_context.Database?.ProviderName != null)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
        else
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return AdminTutorApplicationDto.From(application);
    }
}
