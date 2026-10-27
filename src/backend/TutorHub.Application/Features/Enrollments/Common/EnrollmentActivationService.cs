using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Settings;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Services;

namespace TutorHub.Application.Features.Enrollments.Common;

/// <summary>
/// Shared activation of a paid Booking into an active Enrollment: snapshots the
/// platform fee, allocates N Sessions, credits the tutor wallet's
/// Pending escrow with the GROSS amount, and enqueues the outbox events. Kept in
/// one place so every payment-confirmation path activates identically.
/// </summary>
public interface IEnrollmentActivationService
{
    Task<Enrollment> ActivateAsync(Booking booking, DateTime now, CancellationToken cancellationToken);
}

public class EnrollmentActivationService : IEnrollmentActivationService
{
    private readonly IAppDbContext _context;
    private readonly PlatformFeeOptions _feeOptions;

    public EnrollmentActivationService(IAppDbContext context, IOptions<PlatformFeeOptions> feeOptions)
    {
        _context = context;
        _feeOptions = feeOptions.Value;
    }

    public async Task<Enrollment> ActivateAsync(Booking booking, DateTime now, CancellationToken cancellationToken)
    {
        if (booking.ServiceId == Guid.Empty)
        {
            throw new InvalidOperationException("Booking is missing ServiceId commercial reference.");
        }

        // Snapshot fee from PlatformFeeOptions (non-retroactive).
        // NO FALLBACK: a missing or malformed setting must fail loudly instead of
        // silently snapshotting a guessed rate.
        if (!_feeOptions.Rate.HasValue)
        {
            throw new InvalidOperationException(
                "Platform fee rate configuration 'PlatformFeeRate' is missing. Configure it in .env or appsettings.json before accepting payments.");
        }

        var feeRate = _feeOptions.Rate.Value;
        if (feeRate < 0m || feeRate >= 1m)
        {
            throw new InvalidOperationException(
                $"Platform fee rate configuration 'PlatformFeeRate' has invalid value '{feeRate}'. Expected an invariant-culture decimal in [0,1).");
        }

        var enrollment = new Enrollment
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            StudentProfileId = booking.StudentProfileId,
            TutorProfileId = booking.TutorProfileId,
            ServiceId = booking.ServiceId,
            SubjectId = booking.SubjectId,
            TotalPrice = booking.TotalPrice,
            TotalSessions = booking.TotalSessions,
            SessionDurationMinutes = booking.SessionDurationMinutes,
            TeachingMode = booking.TeachingMode,
            PlatformFeeRate = feeRate,
            CreatedAt = now
        };

        // N Unscheduled sessions with immutable pro-rata earning slices.
        var allocations = EnrollmentSessionAllocator.Allocate(booking.TotalPrice, booking.TotalSessions);
        for (var i = 0; i < booking.TotalSessions; i++)
        {
            enrollment.Sessions.Add(new Session
            {
                Id = Guid.NewGuid(),
                EnrollmentId = enrollment.Id,
                SessionNumber = i + 1,
                SessionPrice = allocations[i],
                CreatedAt = now
            });
        }

        _context.Enrollments.Add(enrollment);
        booking.Enrollment = enrollment;
        enrollment.Activate();

        // Escrow holds the GROSS enrollment amount; the platform fee is only
        // removed when each session is released.
        var wallet = await _context.Wallets
            .FromSqlInterpolated($"SELECT * FROM \"Wallets\" WHERE \"TutorProfileId\" = {booking.TutorProfileId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);
        if (wallet == null)
        {
            wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                TutorProfileId = booking.TutorProfileId,
                PendingBalance = 0,
                AvailableBalance = 0,
                UpdatedAt = now
            };
            _context.Wallets.Add(wallet);
        }
        wallet.CreditPending(booking.TotalPrice, now);

        _context.AddOutboxMessage(new PaymentSucceededEvent(
            booking.Id,
            booking.StudentProfile.UserId,
            new MoneyDto(booking.TotalPrice),
            enrollment.Id));

        _context.AddOutboxMessage(new EnrollmentActivatedEvent(
            enrollment.Id,
            enrollment.StudentProfileId,
            enrollment.TutorProfileId,
            booking.StudentProfile.UserId,
            booking.TutorProfile.UserId));

        return enrollment;
    }
}
