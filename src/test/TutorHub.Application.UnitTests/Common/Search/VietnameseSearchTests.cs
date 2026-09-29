using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Search;
using TutorHub.Application.Features.Admin.Transactions.GetAdminTransactions;
using TutorHub.Application.Features.Admin.Users.GetAdminUsers;
using TutorHub.Application.Features.Services.GetPublicServices;
using TutorHub.Application.Features.Subjects.GetPublicSubjects;
using TutorHub.Application.Features.Tutors.GetTutors;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Application.UnitTests.Common.Search;

public class VietnameseSearchTests
{
    [Theory]
    [InlineData("Toán", "Toan")]
    [InlineData("Nguyễn", "Nguyen")]
    [InlineData("Đại học", "Dai hoc")]
    [InlineData("Vật lý", "Vat ly")]
    [InlineData("đường", "duong")]
    [InlineData("ĐẶC BIỆT", "DAC BIET")]
    [InlineData("plain ascii", "plain ascii")]
    [InlineData("", "")]
    public void UnaccentImmutable_StripsVietnameseDiacritics(string input, string expected)
    {
        VietnameseSearch.UnaccentImmutable(input).Should().Be(expected);
    }

    [Fact]
    public void UnaccentImmutable_Null_ReturnsNull()
    {
        VietnameseSearch.UnaccentImmutable(null).Should().BeNull();
    }

    [Theory]
    [InlineData("  TOÁN ", "toan")]
    [InlineData("Nguyễn Văn An", "nguyen van an")]
    [InlineData("   ", "")]
    [InlineData(null, "")]
    public void NormalizeTerm_TrimsLowercasesAndStripsDiacritics(string? input, string expected)
    {
        VietnameseSearch.NormalizeTerm(input).Should().Be(expected);
    }

    [Theory]
    [InlineData("100%", @"100\%")]
    [InlineData("a_b", @"a\_b")]
    [InlineData(@"a\b", @"a\\b")]
    [InlineData("plain", "plain")]
    [InlineData("", "")]
    [InlineData("%_%\\", @"\%\_\%\\")]
    public void EscapeLikePattern_EscapesWildcardsAndEscapeChar(string input, string expected)
    {
        VietnameseSearch.EscapeLikePattern(input).Should().Be(expected);
    }

    private static AppDbContext NewInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetPublicSubjects_SearchWithoutDiacritics_MatchesDiacriticName()
    {
        using var context = NewInMemoryContext();
        var category = new Category { Id = Guid.NewGuid(), Name = "Khoa học tự nhiên" };
        context.Categories.Add(category);
        context.Subjects.Add(new Subject { Id = Guid.NewGuid(), Name = "Toán học", CategoryId = category.Id });
        context.Subjects.Add(new Subject { Id = Guid.NewGuid(), Name = "Vật lý", CategoryId = category.Id });
        await context.SaveChangesAsync();

        var handler = new GetPublicSubjectsQueryHandler(context);
        var result = await handler.Handle(new GetPublicSubjectsQuery(Search: "toan"), CancellationToken.None);

        result.Items.Select(i => i.Name).Should().Contain("Toán học");
        result.Items.Select(i => i.Name).Should().NotContain("Vật lý");
    }

    [Fact]
    public async Task GetPublicSubjects_SearchIsCaseInsensitive()
    {
        using var context = NewInMemoryContext();
        var category = new Category { Id = Guid.NewGuid(), Name = "Khoa học tự nhiên" };
        context.Categories.Add(category);
        context.Subjects.Add(new Subject { Id = Guid.NewGuid(), Name = "Toán học", CategoryId = category.Id });
        await context.SaveChangesAsync();

        var handler = new GetPublicSubjectsQueryHandler(context);
        var result = await handler.Handle(new GetPublicSubjectsQuery(Search: "TOÁN"), CancellationToken.None);

        result.Items.Should().ContainSingle().Which.Name.Should().Be("Toán học");
    }

    [Fact]
    public async Task GetPublicSubjects_BlankSearch_PreservesOldBehavior_ReturnsAll()
    {
        using var context = NewInMemoryContext();
        var category = new Category { Id = Guid.NewGuid(), Name = "Khoa học tự nhiên" };
        context.Categories.Add(category);
        context.Subjects.Add(new Subject { Id = Guid.NewGuid(), Name = "Toán học", CategoryId = category.Id });
        context.Subjects.Add(new Subject { Id = Guid.NewGuid(), Name = "Vật lý", CategoryId = category.Id });
        await context.SaveChangesAsync();

        var handler = new GetPublicSubjectsQueryHandler(context);
        var result = await handler.Handle(new GetPublicSubjectsQuery(Search: "   "), CancellationToken.None);

        result.Items.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAdminUsers_SearchWithoutDiacritics_MatchesFullName()
    {
        using var context = NewInMemoryContext();
        context.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "an@example.com",
            PasswordHash = "x",
            FullName = "Nguyễn Văn An",
            Role = UserRole.Student,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        });
        context.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "binh@example.com",
            PasswordHash = "x",
            FullName = "Trần Bình",
            Role = UserRole.Student,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var handler = new GetAdminUsersQueryHandler(context);
        var result = await handler.Handle(new GetAdminUsersQuery(Search: "nguyen"), CancellationToken.None);

        result.Items.Select(i => i.FullName).Should().Contain("Nguyễn Văn An");
        result.Items.Select(i => i.FullName).Should().NotContain("Trần Bình");
    }

    [Fact]
    public async Task GetPublicServices_SearchWithoutDiacritics_MatchesTitleAndTutorName()
    {
        using var context = NewInMemoryContext();
        var category = new Category { Id = Guid.NewGuid(), Name = "Khoa học tự nhiên" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Toán học", CategoryId = category.Id };
        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@example.com",
            PasswordHash = "x",
            FullName = "Nguyễn Văn An",
            Role = UserRole.Tutor,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var application = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            Bio = "bio",
            Education = "Đại học Sư phạm",
            SubmittedAt = DateTime.UtcNow
        };
        application.Approve(Guid.NewGuid());
        var profile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "bio",
            Education = "Đại học Sư phạm"
        };
        var matching = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = profile.Id,
            TutorProfile = profile,
            SubjectId = subject.Id,
            Subject = subject,
            Title = "Luyện thi Toán cấp tốc",
            Description = "Ôn tập toàn diện",
            Status = ServiceStatus.Published
        };
        var otherSubject = new Subject { Id = Guid.NewGuid(), Name = "Vật lý", CategoryId = category.Id };
        var other = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = profile.Id,
            TutorProfile = profile,
            SubjectId = otherSubject.Id,
            Subject = otherSubject,
            Title = "Cơ học cơ bản",
            Description = "Nhập môn vật lý",
            Status = ServiceStatus.Published
        };
        context.Categories.Add(category);
        context.Subjects.AddRange(subject, otherSubject);
        context.Users.Add(tutorUser);
        context.TutorApplications.Add(application);
        context.TutorProfiles.Add(profile);
        context.Services.AddRange(matching, other);
        await context.SaveChangesAsync();

        var handler = new GetPublicServicesQueryHandler(context);

        var byTitle = await handler.Handle(new GetPublicServicesQuery(Search: "toan"), CancellationToken.None);
        byTitle.Items.Select(i => i.Title).Should().Contain("Luyện thi Toán cấp tốc");
        byTitle.Items.Select(i => i.Title).Should().NotContain("Cơ học cơ bản");

        var byTutor = await handler.Handle(new GetPublicServicesQuery(Search: "nguyen"), CancellationToken.None);
        byTutor.Items.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetPublicSubjects_SearchWithPercent_MatchesLiterally_DoesNotActAsWildcard()
    {
        using var context = NewInMemoryContext();
        var category = new Category { Id = Guid.NewGuid(), Name = "Danh mục" };
        context.Categories.Add(category);
        context.Subjects.Add(new Subject { Id = Guid.NewGuid(), Name = "1000 bài tập", CategoryId = category.Id });
        context.Subjects.Add(new Subject { Id = Guid.NewGuid(), Name = "100% chính hãng", CategoryId = category.Id });
        await context.SaveChangesAsync();

        var handler = new GetPublicSubjectsQueryHandler(context);
        var result = await handler.Handle(new GetPublicSubjectsQuery(Search: "100%"), CancellationToken.None);

        result.Items.Select(i => i.Name).Should().Contain("100% chính hãng");
        result.Items.Select(i => i.Name).Should().NotContain("1000 bài tập");
    }

    [Fact]
    public async Task GetPublicSubjects_SearchWithUnderscore_MatchesLiterally()
    {
        using var context = NewInMemoryContext();
        var category = new Category { Id = Guid.NewGuid(), Name = "Danh mục" };
        context.Categories.Add(category);
        context.Subjects.Add(new Subject { Id = Guid.NewGuid(), Name = "a_b", CategoryId = category.Id });
        context.Subjects.Add(new Subject { Id = Guid.NewGuid(), Name = "axb", CategoryId = category.Id });
        await context.SaveChangesAsync();

        var handler = new GetPublicSubjectsQueryHandler(context);
        var result = await handler.Handle(new GetPublicSubjectsQuery(Search: "a_b"), CancellationToken.None);

        result.Items.Should().ContainSingle().Which.Name.Should().Be("a_b");
    }

    [Fact]
    public async Task GetTutors_SearchWithoutDiacritics_MatchesThroughNestedServiceAndSubjectNavs()
    {
        using var context = NewInMemoryContext();
        var category = new Category { Id = Guid.NewGuid(), Name = "Khoa học tự nhiên" };
        var math = new Subject { Id = Guid.NewGuid(), Name = "Toán học", CategoryId = category.Id, Category = category };
        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@example.com",
            PasswordHash = "x",
            FullName = "Nguyễn Văn An",
            Role = UserRole.Tutor,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var application = new TutorApplication
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "bio",
            Education = "Đại học Sư phạm",
            SubmittedAt = DateTime.UtcNow
        };
        application.Approve(Guid.NewGuid());
        var profile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "Luyện thi chuyên nghiệp",
            Education = "Đại học Sư phạm"
        };
        var tutorSubject = new TutorSubject
        {
            Id = Guid.NewGuid(),
            TutorProfileId = profile.Id,
            TutorProfile = profile,
            SubjectId = math.Id,
            Subject = math,
            IsActive = true
        };
        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = profile.Id,
            TutorProfile = profile,
            SubjectId = math.Id,
            Subject = math,
            Title = "Luyện thi cấp tốc",
            Description = "Ôn tập toàn diện",
            Status = ServiceStatus.Published
        };
        context.Categories.Add(category);
        context.Subjects.Add(math);
        context.Users.Add(tutorUser);
        context.TutorApplications.Add(application);
        context.TutorProfiles.Add(profile);
        context.TutorSubjects.Add(tutorSubject);
        context.Services.Add(service);
        await context.SaveChangesAsync();

        var handler = new GetTutorsQueryHandler(context);

        // Via nested Services.Subject.Name / TutorSubjects.Subject.Name (diacritics-insensitive).
        var bySubject = await handler.Handle(new GetTutorsQuery(Search: "toan"), CancellationToken.None);
        bySubject.Items.Should().ContainSingle().Which.FullName.Should().Be("Nguyễn Văn An");

        // Via TutorSubjects.Subject.Category.Name — the Services branch has no category predicate.
        var byCategory = await handler.Handle(new GetTutorsQuery(Search: "tu nhien"), CancellationToken.None);
        byCategory.Items.Should().ContainSingle().Which.FullName.Should().Be("Nguyễn Văn An");

        var miss = await handler.Handle(new GetTutorsQuery(Search: "vat ly"), CancellationToken.None);
        miss.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAdminTransactions_SearchWithoutDiacritics_MatchesThroughBookingNavs()
    {
        using var context = NewInMemoryContext();
        var category = new Category { Id = Guid.NewGuid(), Name = "Khoa học tự nhiên" };
        var math = new Subject { Id = Guid.NewGuid(), Name = "Toán học", CategoryId = category.Id, Category = category };
        var studentUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "student@example.com",
            PasswordHash = "x",
            FullName = "Nguyễn Văn An",
            Role = UserRole.Student,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@example.com",
            PasswordHash = "x",
            FullName = "Trần Bình",
            Role = UserRole.Tutor,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        var studentProfile = new StudentProfile { Id = Guid.NewGuid(), UserId = studentUser.Id, User = studentUser };
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "bio",
            Education = "education"
        };
        var service = new Service
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = math.Id,
            Subject = math,
            Title = "Luyện thi cấp tốc",
            Description = "Ôn tập toàn diện",
            Status = ServiceStatus.Published
        };
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            StudentProfileId = studentProfile.Id,
            StudentProfile = studentProfile,
            TutorProfileId = tutorProfile.Id,
            TutorProfile = tutorProfile,
            SubjectId = math.Id,
            Subject = math,
            ServiceId = service.Id,
            Service = service,
            Status = BookingStatus.Paid,
            TotalPrice = 200_000m,
            TotalSessions = 1,
            SessionDurationMinutes = 60,
            TeachingMode = TeachingMode.Online,
            CreatedAt = DateTime.UtcNow
        };
        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            Booking = booking,
            Amount = 200_000m,
            Type = TransactionType.BookingPayment,
            Status = TransactionStatus.Held,
            CreatedAt = DateTime.UtcNow
        };
        context.Categories.Add(category);
        context.Subjects.Add(math);
        context.Users.AddRange(studentUser, tutorUser);
        context.StudentProfiles.Add(studentProfile);
        context.TutorProfiles.Add(tutorProfile);
        context.Services.Add(service);
        context.Bookings.Add(booking);
        context.Transactions.Add(transaction);
        await context.SaveChangesAsync();

        var handler = new GetAdminTransactionsQueryHandler(context);

        var byStudent = await handler.Handle(new GetAdminTransactionsQuery(Search: "nguyen"), CancellationToken.None);
        byStudent.Items.Should().ContainSingle();

        var bySubject = await handler.Handle(new GetAdminTransactionsQuery(Search: "toan"), CancellationToken.None);
        bySubject.Items.Should().ContainSingle();

        var miss = await handler.Handle(new GetAdminTransactionsQuery(Search: "vat ly"), CancellationToken.None);
        miss.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAdminUsers_SearchMatchesPhone_WithNullPhonesPresent_DoesNotThrow()
    {
        using var context = NewInMemoryContext();
        context.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "an@example.com",
            PasswordHash = "x",
            FullName = "Nguyễn Văn An",
            Phone = null,
            Role = UserRole.Student,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        });
        context.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "binh@example.com",
            PasswordHash = "x",
            FullName = "Trần Bình",
            Phone = "0901234567",
            Role = UserRole.Student,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var handler = new GetAdminUsersQueryHandler(context);

        // Phone nullable-guard: the null-phone row must not break the query.
        var byPhone = await handler.Handle(new GetAdminUsersQuery(Search: "0901"), CancellationToken.None);
        byPhone.Items.Select(i => i.FullName).Should().ContainSingle().Which.Should().Be("Trần Bình");

        var byName = await handler.Handle(new GetAdminUsersQuery(Search: "nguyen"), CancellationToken.None);
        byName.Items.Select(i => i.FullName).Should().ContainSingle().Which.Should().Be("Nguyễn Văn An");
    }
}
