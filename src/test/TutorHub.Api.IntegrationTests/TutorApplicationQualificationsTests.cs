using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Features.Admin.TutorApplications.ApproveTutorApplication;
using TutorHub.Application.Features.Admin.TutorApplications.RejectTutorApplication;
using TutorHub.Application.Features.Admin.TutorApplications.GetAdminTutorApplications;
using TutorHub.Application.Features.Media.UploadMedia;
using TutorHub.Application.Features.Tutors.GetTutorById;
using TutorHub.Application.Features.Tutors.ResubmitTutorApplication;
using TutorHub.Application.Features.Tutors.SubmitTutorApplication;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.IntegrationTests;

public class TutorApplicationQualificationsTests(IntegrationWebApplicationFactory factory) : IntegrationTestBase(factory)
{
    [Fact]
    public async Task AdminReviewList_ExposesRecordedReviewerAndPreventsReReviewOfApprovedApplication()
    {
        var (applicant, admin) = await CreateApplicant();
        var submitted = await SendAsync(new SubmitTutorApplicationCommand("Applicant introduction", "Submitted education", 2));
        SetCurrentUser(admin.Id, UserRole.Admin);
        var before = await SendAsync(new GetAdminTutorApplicationsQuery(Search: applicant.Email));
        var pending = before.Items.Single(a => a.Id == submitted.Id);
        pending.ReviewedAt.Should().BeNull();
        pending.ReviewedByAdminName.Should().BeNull();

        await SendAsync(new ApproveTutorApplicationCommand(submitted.Id));
        var after = await SendAsync(new GetAdminTutorApplicationsQuery(Search: applicant.Email));
        var approved = after.Items.Single(a => a.Id == submitted.Id);
        approved.Status.Should().Be("Approved");
        approved.ReviewedAt.Should().NotBeNull();
        approved.ReviewedByAdminName.Should().Be(admin.FullName);

        var approveAgain = () => SendAsync(new ApproveTutorApplicationCommand(submitted.Id));
        await approveAgain.Should().ThrowAsync<InvalidOperationException>();
        var rejectApproved = () => SendAsync(new RejectTutorApplicationCommand(submitted.Id, "Cannot reject an approved application"));
        await rejectApproved.Should().ThrowAsync<InvalidOperationException>();
        (await Db.TutorProfiles.CountAsync(p => p.UserId == applicant.Id)).Should().Be(1);
    }

    private async Task<(User Applicant, User Admin)> CreateApplicant()
    {
        var (_, _, admin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        var applicant = new User {
            Id = Guid.NewGuid(), Email = $"applicant.{Guid.NewGuid():N}@test.local",
            FullName = "Applicant", PasswordHash = SeedHelper.DemoPasswordHash,
            Role = UserRole.Tutor, Status = AccountStatus.Active, CreatedAt = DateTime.UtcNow
        };
        Db.Users.Add(applicant);
        await Db.SaveChangesAsync();
        SetCurrentUser(applicant.Id, UserRole.Tutor);
        return (applicant, admin);
    }

    [Fact]
    public async Task SubmittedQualificationsAndPrivateDocuments_AppearOnlyAfterApproval()
    {
        var (applicant, admin) = await CreateApplicant();
        using var pdf = new MemoryStream(Encoding.ASCII.GetBytes("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF"));
        var uploaded = await SendAsync(new UploadMediaCommand(pdf, "Degree.pdf", "application/pdf", pdf.Length, MediaType.Certificate));
        var submitted = await SendAsync(new SubmitTutorApplicationCommand(
            "Applicant introduction", "Bachelor of Physics", 2, University: "Submitted University",
            Major: "Physics", DegreeLevel: "Bachelor", Certifications: "Submitted certificate",
            Methodology: "Submitted teaching method", Achievements: "Submitted results",
            DocumentIds: new() { uploaded.Id }));
        var application = await Db.TutorApplications.AsNoTracking().SingleAsync(a => a.Id == submitted.Id);
        application.University.Should().Be("Submitted University");
        application.Certifications.Should().Be("Submitted certificate");
        using var documents = JsonDocument.Parse(application.DocumentsJson!);
        documents.RootElement[0].GetProperty("mediaId").GetGuid().Should().Be(uploaded.Id);
        application.DocumentsJson.Should().NotContain("storage.test");
        TutorHub.Application.Features.Tutors.DTOs.TutorCredentialDto.FromApplication(application).Should().BeEmpty();
        SetCurrentUser(admin.Id, UserRole.Admin);
        await SendAsync(new ApproveTutorApplicationCommand(application.Id));
        var profileId = await Db.TutorProfiles.Where(t => t.UserId == applicant.Id).Select(t => t.Id).SingleAsync();
        SetCurrentUser(null, null, false);
        var profile = await SendAsync(new GetTutorByIdQuery(profileId));
        profile.Credentials.Should().HaveCount(2);
        profile.Credentials.Should().Contain(c => c.Title == "Submitted certificate");
        profile.Credentials.Should().OnlyContain(c => c.IsApproved && c.ReviewedAt.HasValue);
    }

    [Fact]
    public async Task Submission_CannotAttachAnotherUsersDocument()
    {
        var (_, _, otherAdmin) = await SeedHelper.SeedTutorWithWalletAsync(Db);
        SetCurrentUser(otherAdmin.Id, UserRole.Admin);
        using var pdf = new MemoryStream(Encoding.ASCII.GetBytes("%PDF-1.4\n%%EOF"));
        var other = await SendAsync(new UploadMediaCommand(pdf, "Other.pdf", "application/pdf", pdf.Length, MediaType.Certificate));
        await CreateApplicant();
        var submit = () => SendAsync(new SubmitTutorApplicationCommand(
            "Applicant introduction", "Bachelor of Physics", 2, DocumentIds: new() { other.Id }));
        await submit.Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task RejectedApplicationResubmission_UsesNewQualificationSnapshot()
    {
        var (applicant, admin) = await CreateApplicant();
        var first = await SendAsync(new SubmitTutorApplicationCommand("Applicant introduction", "Old education", 1));
        SetCurrentUser(admin.Id, UserRole.Admin);
        await SendAsync(new RejectTutorApplicationCommand(first.Id, "Please update qualifications"));
        SetCurrentUser(applicant.Id, UserRole.Tutor);
        var next = await SendAsync(new ResubmitTutorApplicationCommand(
            "Updated introduction", "Updated education", 2,
            University: "Updated University", Certifications: "Updated certificate", DocumentIds: new()));
        SetCurrentUser(admin.Id, UserRole.Admin);
        await SendAsync(new ApproveTutorApplicationCommand(next.Id));
        var profileId = await Db.TutorProfiles.Where(t => t.UserId == applicant.Id).Select(t => t.Id).SingleAsync();
        SetCurrentUser(null, null, false);
        var profile = await SendAsync(new GetTutorByIdQuery(profileId));
        profile.Credentials.Should().Contain(c => c.Title == "Updated certificate");
        profile.Credentials.Should().NotContain(c => c.Title == "Old education");
    }
}
