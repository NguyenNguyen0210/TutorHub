using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;

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
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<Withdrawal> Withdrawals => Set<Withdrawal>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Media> Media => Set<Media>();
    public DbSet<AccountStatusAuditLog> AccountStatusAuditLogs => Set<AccountStatusAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
