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
    DbSet<AvailabilitySlot> AvailabilitySlots { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<Enrollment> Enrollments { get; }
    DbSet<Session> Sessions { get; }
    DbSet<Transaction> Transactions { get; }
    DbSet<Wallet> Wallets { get; }
    DbSet<Withdrawal> Withdrawals { get; }
    DbSet<Review> Reviews { get; }
    DbSet<Report> Reports { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Media> Media { get; }
    DbSet<AccountStatusAuditLog> AccountStatusAuditLogs { get; }
    DbSet<WalletTransaction> WalletTransactions { get; }
    DbSet<Conversation> Conversations { get; }
    DbSet<Message> Messages { get; }
    DbSet<OutboxMessage> OutboxMessages { get; }
    DbSet<InboxMessage> InboxMessages { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<EmailDelivery> EmailDeliveries { get; }

    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
