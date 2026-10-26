using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Search;
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
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<TutorWallet> TutorWallets => Set<TutorWallet>();
    public DbSet<TutorWithdrawal> TutorWithdrawals => Set<TutorWithdrawal>();
    public DbSet<TutorWallet> Wallets => TutorWallets;
    public DbSet<TutorWithdrawal> Withdrawals => TutorWithdrawals;
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Media> Media => Set<Media>();
    public DbSet<TutorWalletTransaction> TutorWalletTransactions => Set<TutorWalletTransaction>();
    public DbSet<TutorWalletTransaction> WalletTransactions => TutorWalletTransactions;
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<EmailDelivery> EmailDeliveries => Set<EmailDelivery>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<DisputeEvidence> DisputeEvidences => Set<DisputeEvidence>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<LearningRecord> LearningRecords => Set<LearningRecord>();
    public DbSet<StudentWallet> StudentWallets => Set<StudentWallet>();
    public DbSet<StudentWalletTransaction> StudentWalletTransactions => Set<StudentWalletTransaction>();
    public DbSet<TopUpRequest> TopUpRequests => Set<TopUpRequest>();
    public DbSet<StudentWithdrawal> StudentWithdrawals => Set<StudentWithdrawal>();
    public DbSet<ExternalLogin> ExternalLogins => Set<ExternalLogin>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();

    public override int SaveChanges()
    {
        EnforceTransactionIntegrity();
        return base.SaveChanges();
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        EnforceTransactionIntegrity();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        EnforceTransactionIntegrity();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        EnforceTransactionIntegrity();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    /// <summary>
    /// Financial data integrity guards for settled transactions and audit logs.
    ///
    /// Invoked from EVERY SaveChanges entry point (sync, sync-bool, async,
    /// async-bool) to ensure settled historical records cannot be modified or deleted.
    /// </summary>
    private void EnforceTransactionIntegrity()
    {
        // Enforce immutability on settled transactions
        var deletedTransactions = ChangeTracker.Entries<Transaction>()
            .Where(e => e.State == EntityState.Deleted)
            .ToList();
        if (deletedTransactions.Count > 0)
        {
            var ids = string.Join(",", deletedTransactions.Select(e => e.Entity.Id));
            throw new InvalidOperationException($"Transaction records cannot be deleted. Ids: {ids}.");
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
                // Terminal statuses (Released, Succeeded, Failed, Refunded) cannot be modified
                return origStatus == TransactionStatus.Released
                    || origStatus == TransactionStatus.Succeeded
                    || origStatus == TransactionStatus.Failed
                    || origStatus == TransactionStatus.Refunded;
            })
            .ToList();

        if (modifiedTerminalTransactions.Count > 0)
        {
            var ids = string.Join(",", modifiedTerminalTransactions.Select(e => e.Entity.Id));
            var props = string.Join(";", modifiedTerminalTransactions.SelectMany(e =>
                e.Properties.Where(p => p.IsModified).Select(p => $"{e.Entity.Id.ToString()[..8]}.{p.Metadata.Name}='{p.CurrentValue}'(was '{p.OriginalValue}')")));
            throw new InvalidOperationException($"Settled historical financial records are immutable and cannot be modified. Ids: {ids}. Props: {props}.");
        }

        // Financial adjustments must point directly to original earning transaction
        var addedAdjustments = ChangeTracker.Entries<Transaction>()
            .Where(e => e.State == EntityState.Added && e.Entity.RelatedTransactionId.HasValue)
            .ToList();

        foreach (var entry in addedAdjustments)
        {
            TransactionType? relatedType = entry.Entity.RelatedTransaction?.Type;
            if (relatedType == null)
            {
                var relatedId = entry.Entity.RelatedTransactionId!.Value;
                relatedType = Transactions
                    .AsNoTracking()
                    .Where(t => t.Id == relatedId)
                    .Select(t => (TransactionType?)t.Type)
                    .FirstOrDefault();
                if (relatedType == null)
                {
                    var tracked = ChangeTracker.Entries<Transaction>()
                        .FirstOrDefault(e => e.Entity.Id == relatedId);
                    relatedType = tracked?.Entity.Type;
                }
            }

            if (relatedType == null || relatedType != TransactionType.SessionPayoutCredit)
            {
                throw new InvalidOperationException("Financial adjustments must point directly to the original earning transaction; chaining is forbidden.");
            }
        }

        // AuditLog records are append-only
        var modifiedAuditLogs = ChangeTracker.Entries<AuditLog>()
            .Where(e => e.State == EntityState.Modified || e.State == EntityState.Deleted)
            .ToList();
        if (modifiedAuditLogs.Count > 0)
        {
            throw new InvalidOperationException("AuditLog records are append-only and cannot be modified or deleted.");
        }

        // StudentWalletTransaction records are append-only
        var modifiedStudentWalletTxs = ChangeTracker.Entries<StudentWalletTransaction>()
            .Where(e => e.State == EntityState.Modified || e.State == EntityState.Deleted)
            .ToList();
        if (modifiedStudentWalletTxs.Count > 0)
        {
            var ids = string.Join(",", modifiedStudentWalletTxs.Select(e => e.Entity.Id));
            throw new InvalidOperationException($"StudentWalletTransaction records are append-only and cannot be modified or deleted. Ids: {ids}.");
        }

        // TutorWalletTransaction records are append-only
        var modifiedTutorWalletTxs = ChangeTracker.Entries<TutorWalletTransaction>()
            .Where(e => e.State == EntityState.Modified || e.State == EntityState.Deleted)
            .ToList();
        if (modifiedTutorWalletTxs.Count > 0)
        {
            var ids = string.Join(",", modifiedTutorWalletTxs.Select(e => e.Entity.Id));
            throw new InvalidOperationException($"TutorWalletTransaction records are append-only and cannot be modified or deleted. Ids: {ids}.");
        }

        // Enforce append-only / terminal immutability on TopUpRequest
        var deletedTopUpRequests = ChangeTracker.Entries<TopUpRequest>()
            .Where(e => e.State == EntityState.Deleted)
            .ToList();
        if (deletedTopUpRequests.Count > 0)
        {
            var ids = string.Join(",", deletedTopUpRequests.Select(e => e.Entity.Id));
            throw new InvalidOperationException($"TopUpRequest records cannot be deleted. Ids: {ids}.");
        }

        var modifiedTerminalTopUps = ChangeTracker.Entries<TopUpRequest>()
            .Where(e => e.State == EntityState.Modified)
            .Where(e =>
            {
                var origStatus = (TopUpRequestStatus)e.OriginalValues[nameof(TopUpRequest.Status)]!;
                return origStatus == TopUpRequestStatus.Confirmed || origStatus == TopUpRequestStatus.Rejected;
            })
            .ToList();

        if (modifiedTerminalTopUps.Count > 0)
        {
            var ids = string.Join(",", modifiedTerminalTopUps.Select(e => e.Entity.Id));
            throw new InvalidOperationException($"Settled TopUpRequest records are immutable and cannot be modified. Ids: {ids}.");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Maps VietnameseSearch.UnaccentImmutable to public.unaccent_immutable(text)
        // (EnableVietnameseSearch migration). Search predicates using it translate to
        // lower(unaccent_immutable(col)) LIKE ..., matching the GIN trigram indexes.
        modelBuilder.HasDbFunction(typeof(VietnameseSearch).GetMethod(nameof(VietnameseSearch.UnaccentImmutable))!)
            .HasName("unaccent_immutable");
    }
}
