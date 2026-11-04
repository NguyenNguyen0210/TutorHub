using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Admin.Users.GetAdminUsers;
using TutorHub.Application.Features.Admin.Users.GetAdminUserById;
using TutorHub.Application.Features.Admin.Users.SuspendUser;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;
public class AdminUserReviewTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task Review_UsesGlobalCounts_RealSecurityData_AndPersistedDisciplineAudit()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (student, _, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        student.AccessFailedCount = 2;
        student.LockoutEndAt = DateTime.UtcNow.AddMinutes(10);
        await Db.SaveChangesAsync();
        SetCurrentUser(admin.Id, UserRole.Admin);
        var counts = await SendAsync(new GetAdminUserSummaryQuery());
        counts.Total.Should().Be(counts.Active + counts.Suspended + counts.Banned);
        var found = await SendAsync(new GetAdminUsersQuery(Search: student.Id.ToString(), PageSize: 1));
        found.Items.Should().ContainSingle(u => u.Id == student.Id);
        var before = await SendAsync(new GetAdminUserByIdQuery(student.Id));
        before.AccessFailedCount.Should().Be(2);
        before.LockoutEndAt.Should().NotBeNull();
        before.DisciplineHistory.Should().BeEmpty();
        await SendAsync(new SuspendUserCommand(student.Id, "Reviewed inappropriate conduct with supporting evidence."));
        var detail = await SendAsync(new GetAdminUserByIdQuery(student.Id));
        detail.Status.Should().Be(AccountStatus.Suspended);
        detail.DisciplineHistory.Should().ContainSingle(a => a.Action == "USER_SUSPENDED" && a.AdminName == admin.FullName && a.Reason!.Contains("supporting evidence"));
        var after = await SendAsync(new GetAdminUserSummaryQuery());
        after.Total.Should().Be(counts.Total);
        after.Suspended.Should().Be(counts.Suspended + 1);
        var self = () => SendAsync(new SuspendUserCommand(admin.Id, "Cannot suspend current administrator"));
        await self.Should().ThrowAsync<ConflictException>();
    }
}
