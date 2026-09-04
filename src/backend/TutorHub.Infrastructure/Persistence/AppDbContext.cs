using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<TutorProfile> TutorProfiles => Set<TutorProfile>();
    public DbSet<TutorApplication> TutorApplications => Set<TutorApplication>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TutorSubject> TutorSubjects => Set<TutorSubject>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<Withdrawal> Withdrawals => Set<Withdrawal>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Media> Media => Set<Media>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<InboxMessage> InboxMessages => Set<InboxMessage>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<EmailDelivery> EmailDeliveries => Set<EmailDelivery>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<DisputeEvidence> DisputeEvidences => Set<DisputeEvidence>();
    public DbSet<PlatformSetting> PlatformSettings => Set<PlatformSetting>();
    public DbSet<PlatformSettingVersion> PlatformSettingVersions => Set<PlatformSettingVersion>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<CustomAgreement> CustomAgreements => Set<CustomAgreement>();
    public DbSet<SessionRescheduleRequest> SessionRescheduleRequests => Set<SessionRescheduleRequest>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Enforce append-only / immutability on Transaction (DEC-S8-030, INV-LEDGER-007)
        var deletedTransactions = ChangeTracker.Entries<Transaction>()
            .Where(e => e.State == EntityState.Deleted)
            .ToList();
        if (deletedTransactions.Count > 0)
        {
            throw new InvalidOperationException("Transaction records cannot be deleted.");
        }

        var modifiedTerminalTransactions = ChangeTracker.Entries<Transaction>()
            .Where(e => e.State == EntityState.Modified)
            .Where(e =>
            {
                var origStatus = (TransactionStatus)e.OriginalValues[nameof(Transaction.Status)]!;
                var origType = (TransactionType)e.OriginalValues[nameof(Transaction.Type)]!;
                // Historical earnings & fee reversals are strictly immutable
                if (origType == TransactionType.SessionPayoutCredit || origType == TransactionType.PlatformFeeReversal)
                    return true;
                // Terminal statuses (Released, Succeeded) cannot be modified
                return origStatus == TransactionStatus.Released || origStatus == TransactionStatus.Succeeded;
            })
            .ToList();

        if (modifiedTerminalTransactions.Count > 0)
        {
            throw new InvalidOperationException("Settled historical financial records are immutable and cannot be modified.");
        }

        // Anti-chaining validation (DEC-S8-030, INV-LEDGER-007)
        var addedAdjustments = ChangeTracker.Entries<Transaction>()
            .Where(e => e.State == EntityState.Added && e.Entity.RelatedTransactionId.HasValue)
            .ToList();

        foreach (var entry in addedAdjustments)
        {
            if (entry.Entity.RelatedTransaction != null &&
                entry.Entity.RelatedTransaction.Type != TransactionType.SessionPayoutCredit)
            {
                throw new InvalidOperationException("Financial adjustments must point directly to the original earning transaction; chaining is forbidden.");
            }
        }

        // Enforce append-only on AuditLog (DEC-S8-005, INV-LEDGER-006)
        var modifiedAuditLogs = ChangeTracker.Entries<AuditLog>()
            .Where(e => e.State == EntityState.Modified || e.State == EntityState.Deleted)
            .ToList();
        if (modifiedAuditLogs.Count > 0)
        {
            throw new InvalidOperationException("AuditLog records are append-only and cannot be modified or deleted.");
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
