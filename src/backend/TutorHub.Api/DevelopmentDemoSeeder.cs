using Microsoft.EntityFrameworkCore;
using Npgsql;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Authentication;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Api;

/// <summary>Explicit local CLI bootstrap for a clean clone; never runs in the HTTP host.</summary>
public static class DevelopmentDemoSeeder
{
    public static async Task RunAsync(IHostEnvironment environment, IConfiguration configuration)
    {
        if (!environment.IsDevelopment())
            throw new InvalidOperationException("--seed-demo is available only in Development.");
        var connection = new NpgsqlConnectionStringBuilder(configuration.GetConnectionString("DefaultConnection"));
        if (connection.Host is not ("localhost" or "127.0.0.1" or "::1"))
            throw new InvalidOperationException("--seed-demo requires local PostgreSQL; remote databases are refused.");
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connection.ConnectionString).Options);
        await db.Database.MigrateAsync();
        await using var transaction = await db.Database.BeginTransactionAsync();
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(79132641)");
        var adminId = Guid.Parse("f1d10000-0000-4000-8000-000000000001");
        var tutorId = Guid.Parse("f1d10000-0000-4000-8000-000000000002");
        var studentId = Guid.Parse("f1d10000-0000-4000-8000-000000000003");
        var demoIds = new[] { adminId, tutorId, studentId };
        if (await db.Users.AnyAsync())
        {
            if (await db.Users.CountAsync(u => demoIds.Contains(u.Id)) == 3)
            {
                Console.WriteLine("Demo accounts already exist; existing accounts and money are unchanged.");
                return;
            }
            throw new InvalidOperationException("--seed-demo requires an empty application database. Existing data was not replaced.");
        }
        var now = DateTime.UtcNow;
        var passwordHash = new BcryptPasswordHasher().HashPassword("Demo@12345");
        User Account(Guid id, string email, string name, UserRole role) => new()
        {
            Id = id, Email = email, FullName = name, PasswordHash = passwordHash,
            Role = role, Status = AccountStatus.Active, CreatedAt = now
        };
        var admin = Account(adminId, "admin.demo@tutorhub.local", "Demo Admin", UserRole.Admin);
        var tutorUser = Account(tutorId, "tutor.demo@tutorhub.local", "Demo Gia su", UserRole.Tutor);
        var studentUser = Account(studentId, "student.demo@tutorhub.local", "Demo Hoc vien", UserRole.Student);
        var tutor = new TutorProfile { Id = Guid.NewGuid(), UserId = tutorId, User = tutorUser,
            Bio = "Ho so gia su minh hoa de trai nghiem quy trinh TutorHub.", Education = "Du lieu demo, khong phai van bang nguoi that." };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = studentId, User = studentUser };
        var application = new TutorApplication { Id = Guid.NewGuid(), UserId = tutorId, User = tutorUser,
            Bio = tutor.Bio, Education = tutor.Education, SubmittedAt = now };
        application.Approve(adminId);
        var category = new Category { Id = Guid.NewGuid(), Name = "Demo - Hoc tap", IsActive = true };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Toan co ban", CategoryId = category.Id, Category = category, IsActive = true };
        var service = new Service { Id = Guid.NewGuid(), TutorProfileId = tutor.Id, TutorProfile = tutor,
            SubjectId = subject.Id, Subject = subject, Title = "Demo: On tap Toan co ban",
            Description = "Goi hoc minh hoa gom hai buoi. Co the dat hoc, xep lich, huy buoi va xem hoan tien trong vi demo.",
            TotalSessions = 2, SessionDurationMinutes = 60, Price = 200_000m, CreatedAt = now };
        service.Publish();
        var wallet = new Wallet { Id = Guid.NewGuid(), UserId = studentId, StudentProfileId = student.Id, CreatedAt = now, UpdatedAt = now };
        wallet.CreditAvailable(1_000_000m, now);
        db.Users.AddRange(admin, tutorUser, studentUser);
        db.TutorProfiles.Add(tutor); db.StudentProfiles.Add(student); db.TutorApplications.Add(application);
        db.Categories.Add(category); db.Subjects.Add(subject);
        db.TutorSubjects.Add(new TutorSubject { Id = Guid.NewGuid(), TutorProfileId = tutor.Id, SubjectId = subject.Id, IsActive = true });
        db.Services.Add(service); db.Wallets.Add(wallet);
        db.Wallets.Add(new Wallet { Id = Guid.NewGuid(), UserId = tutorId, TutorProfileId = tutor.Id, CreatedAt = now, UpdatedAt = now });
        db.WalletTransactions.Add(new WalletTransaction { Id = Guid.NewGuid(), WalletId = wallet.Id,
            Type = WalletTransactionType.AdjustmentCredit, Direction = FinancialDirection.Credit, Amount = 1_000_000m,
            BalanceBefore = 0, BalanceAfter = 1_000_000m, ReferenceType = "DevelopmentDemo", ReferenceId = studentId,
            Description = "Fictional demo balance, not a payment or bank deposit.", CreatedByUserId = adminId, CreatedAt = now });
        await db.SaveChangesAsync(); await transaction.CommitAsync();
        Console.WriteLine("Created local fictional demo: admin.demo@tutorhub.local, tutor.demo@tutorhub.local, student.demo@tutorhub.local");
        Console.WriteLine("Demo password: Demo@12345. Student wallet: 1,000,000 demo VND. No real payment was made.");
    }
}
