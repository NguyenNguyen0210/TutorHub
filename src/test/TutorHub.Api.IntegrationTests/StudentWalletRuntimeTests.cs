using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Features.Admin.Users.GetAdminUserById;
using TutorHub.Application.Features.StudentWallets.Commands.CreateVnPayTopUp;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class StudentWalletRuntimeTests : IntegrationTestBase
{
    public StudentWalletRuntimeTests(IntegrationWebApplicationFactory factory) : base(factory) { }

    [Fact]
    public async Task VnPayTopUp_CreatesWalletWithoutAnInvalidInclude()
    {
        var (_, tutor, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var (studentUser, student, _) = await SeedHelper.SeedMarketplaceAsync(Db, tutor, admin.Id);
        SetCurrentUser(studentUser.Id, UserRole.Student);

        var redirect = await SendAsync(new CreateVnPayTopUpCommand(150_000m, "127.0.0.1"));

        redirect.PaymentUrl.Should().NotBeNullOrWhiteSpace();
        (await Db.Wallets.AsNoTracking().CountAsync(w =>
            w.UserId == studentUser.Id && w.StudentProfileId == student.Id)).Should().Be(1);
    }

    [Fact]
    public async Task AdminTutorDetail_ReadsWalletThroughMappedUserNavigation()
    {
        var (tutorUser, _, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(admin.Id, UserRole.Admin);

        var detail = await SendAsync(new GetAdminUserByIdQuery(tutorUser.Id));

        detail.TutorProfile.Should().NotBeNull();
        detail.TutorProfile!.WalletBalance.Should().Be(1_000_000m);
    }
}
