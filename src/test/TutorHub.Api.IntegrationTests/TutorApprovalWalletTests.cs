using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Features.Admin.TutorApplications.ApproveTutorApplication;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class TutorApprovalWalletTests : IntegrationTestBase
{
    public TutorApprovalWalletTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Approval_CreatesOrReusesUsersWallet(bool hasStudentWallet)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"applicant.{Guid.NewGuid():N}@test.local",
            PasswordHash = SeedHelper.DemoPasswordHash,
            FullName = "Tutor Applicant",
            Role = UserRole.Student,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var admin = new User
        {
            Id = Guid.NewGuid(),
            Email = $"admin.{Guid.NewGuid():N}@test.local",
            PasswordHash = SeedHelper.DemoPasswordHash,
            FullName = "Integration Admin",
            Role = UserRole.Admin,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var student = new StudentProfile { Id = Guid.NewGuid(), UserId = user.Id, User = user };
        var application = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Bio = "Experienced tutor",
            Education = "University",
            ExperienceYears = 2,
            TeachingMode = TeachingMode.Online,
            SubmittedAt = DateTime.UtcNow
        };
        Db.Users.AddRange(user, admin);
        Db.StudentProfiles.Add(student);
        Db.TutorApplications.Add(application);
        if (hasStudentWallet)
        {
            Db.Wallets.Add(new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                StudentProfileId = student.Id,
                AvailableBalance = 125_000m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        await Db.SaveChangesAsync();

        SetCurrentUser(admin.Id, UserRole.Admin);
        await SendAsync(new ApproveTutorApplicationCommand(application.Id));

        var wallet = await Db.Wallets.AsNoTracking().SingleAsync(w => w.UserId == user.Id);
        var tutor = await Db.TutorProfiles.AsNoTracking().SingleAsync(t => t.UserId == user.Id);
        wallet.TutorProfileId.Should().Be(tutor.Id);
        wallet.AvailableBalance.Should().Be(hasStudentWallet ? 125_000m : 0m);
    }
}
