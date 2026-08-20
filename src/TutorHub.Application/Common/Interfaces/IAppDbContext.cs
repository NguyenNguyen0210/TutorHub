using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<StudentProfile> StudentProfiles { get; }
    DbSet<TutorProfile> TutorProfiles { get; }
    DbSet<Category> Categories { get; }
    DbSet<Subject> Subjects { get; }
    DbSet<TutorSubject> TutorSubjects { get; }
    DbSet<AvailabilitySlot> AvailabilitySlots { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<Transaction> Transactions { get; }
    DbSet<Wallet> Wallets { get; }
    DbSet<Withdrawal> Withdrawals { get; }
    DbSet<Review> Reviews { get; }
    DbSet<Report> Reports { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
