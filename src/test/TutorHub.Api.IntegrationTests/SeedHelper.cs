using Microsoft.EntityFrameworkCore;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Api.IntegrationTests;

/// <summary>
/// Minimal entity seeding with unique identifiers per test (no cleanup needed).
/// </summary>
public static class SeedHelper
{
    public static async Task<(User TutorUser, TutorProfile Tutor, User Admin)> SeedTutorWithWalletAsync(
        AppDbContext db,
        decimal availableBalance = 1_000_000m,
        decimal heldBalance = 0m,
        CancellationToken ct = default)
    {
        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = $"tutor.{Guid.NewGuid():N}@test.local",
            PasswordHash = "TEST-HASH",
            FullName = "Integration Tutor",
            Role = UserRole.Tutor,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var admin = new User
        {
            Id = Guid.NewGuid(),
            Email = $"admin.{Guid.NewGuid():N}@test.local",
            PasswordHash = "TEST-HASH",
            FullName = "Integration Admin",
            Role = UserRole.Admin,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "Integration bio",
            Education = "Integration edu",
            ExperienceYears = 3,
            TeachingMode = TeachingMode.Online
        };

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            PendingBalance = 0,
            AvailableBalance = availableBalance,
            HeldBalance = heldBalance,
            UpdatedAt = DateTime.UtcNow
        };

        db.Users.AddRange(tutorUser, admin);
        db.TutorProfiles.Add(tutor);
        db.Wallets.Add(wallet);
        await db.SaveChangesAsync(ct);

        return (tutorUser, tutor, admin);
    }

    public static async Task<(User StudentUser, StudentProfile Student, Service Service)> SeedMarketplaceAsync(
        AppDbContext db,
        TutorProfile tutor,
        Guid? reviewedByAdminId = null,
        CancellationToken ct = default)
    {
        var studentUser = new User
        {
            Id = Guid.NewGuid(),
            Email = $"student.{Guid.NewGuid():N}@test.local",
            PasswordHash = "TEST-HASH",
            FullName = "Integration Student",
            Role = UserRole.Student,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var student = new StudentProfile
        {
            Id = Guid.NewGuid(),
            UserId = studentUser.Id,
            User = studentUser
        };

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = $"Cat {Guid.NewGuid():N}",
            IsActive = true
        };

        var subject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = $"Subject {Guid.NewGuid():N}",
            CategoryId = category.Id,
            Category = category,
            IsActive = true
        };

        var application = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = tutor.UserId,
            Bio = "Integration bio",
            Education = "Integration edu",
            ExperienceYears = 3,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow
        };
        application.Approve(reviewedByAdminId ?? Guid.NewGuid());

        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            SubjectId = subject.Id,
            Title = "Integration Package",
            Description = "Integration package description",
            TotalSessions = 3,
            SessionDurationMinutes = 60,
            Price = 900_000m,
            TeachingMode = TeachingMode.Online,
            Status = ServiceStatus.Published,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(studentUser);
        db.StudentProfiles.Add(student);
        db.Categories.Add(category);
        db.Subjects.Add(subject);
        db.TutorApplications.Add(application);
        db.Services.Add(service);
        await db.SaveChangesAsync(ct);

        return (studentUser, student, service);
    }

    public static async Task CompleteAndReleasePayoutAsync(AppDbContext db, Session session, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var gross = session.EarningAmount;
        var commissionRate = session.Enrollment.PlatformFeeRate;
        var (commissionAmount, netPayout) = TutorHub.Domain.Services.PlatformFeeCalculator.SplitGross(gross, commissionRate);

        var wallet = await db.Wallets.FirstAsync(w => w.TutorProfileId == session.Enrollment.TutorProfileId, ct);
        session.AutoComplete(now);
        session.Enrollment.RecordCompletedSession(session.Id);

        wallet.DebitPending(gross, now);
        wallet.CreditAvailable(netPayout, now);

        var payoutTx = Transaction.CreatePayout(
            bookingId: session.Enrollment.BookingId,
            sessionId: session.Id,
            disputeId: null,
            gross: gross,
            feeRate: commissionRate,
            feeAmount: commissionAmount,
            netPayout: netPayout,
            paymentGatewayRef: $"AutoPayout-{session.Id:N}",
            now: now);

        db.Transactions.Add(payoutTx);
        await db.SaveChangesAsync(ct);
    }
}
