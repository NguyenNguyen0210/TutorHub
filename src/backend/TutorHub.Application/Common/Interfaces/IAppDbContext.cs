using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<StudentProfile> StudentProfiles { get; }
    DbSet<TutorProfile> TutorProfiles { get; }
    DbSet<TutorApplication> TutorApplications { get; }
    DbSet<Category> Categories { get; }
    DbSet<Subject> Subjects { get; }
    DbSet<TutorSubject> TutorSubjects { get; }
    DbSet<Service> Services { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<Enrollment> Enrollments { get; }
    DbSet<Session> Sessions { get; }
    DbSet<Transaction> Transactions { get; }
    DbSet<Wallet> Wallets { get; }
    DbSet<Withdrawal> Withdrawals { get; }
    DbSet<WalletTransaction> WalletTransactions { get; }
    DbSet<TopUpRequest> TopUpRequests { get; }
    DbSet<Review> Reviews { get; }
    DbSet<Report> Reports { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Media> Media { get; }

    // Backward-compatibility aliases
    DbSet<Wallet> TutorWallets => Wallets;
    DbSet<Withdrawal> TutorWithdrawals => Withdrawals;
    DbSet<WalletTransaction> TutorWalletTransactions => WalletTransactions;
    DbSet<Wallet> StudentWallets => Wallets;
    DbSet<WalletTransaction> StudentWalletTransactions => WalletTransactions;
    DbSet<Withdrawal> StudentWithdrawals => Withdrawals;

    DbSet<Conversation> Conversations { get; }
    DbSet<Message> Messages { get; }
    DbSet<OutboxMessage> OutboxMessages { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<EmailDelivery> EmailDeliveries { get; }
    DbSet<Dispute> Disputes { get; }
    DbSet<DisputeEvidence> DisputeEvidences { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<LearningRecord> LearningRecords { get; }
    DbSet<ExternalLogin> ExternalLogins { get; }
    DbSet<IdempotencyRecord> IdempotencyRecords { get; }

    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
