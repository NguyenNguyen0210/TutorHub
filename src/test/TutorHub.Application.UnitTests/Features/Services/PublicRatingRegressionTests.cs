using FluentAssertions;
using Moq;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Caching;
using TutorHub.Application.Features.Services.DTOs;
using TutorHub.Application.Features.Services.GetPublicServices;
using TutorHub.Application.Features.Services.GetServiceDetail;
using TutorHub.Application.Features.Tutors.GetTutors;
using TutorHub.Application.UnitTests.TestHelpers;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.UnitTests.Features.Services;

public class PublicRatingRegressionTests
{
    private static (IAppDbContext db, Service service) Fixture(bool withReviews)
    {
        var application = new TutorApplication();
        application.Approve(Guid.NewGuid());
        var tutor = new TutorProfile
        {
            Id = Guid.NewGuid(), UserId = Guid.NewGuid(),
            User = new User { FullName = "Tutor", Status = AccountStatus.Active, TutorApplications = new List<TutorApplication> { application } }
        };
        tutor.ApplyReview(new[] { 5, 5, 5, 5, 5, 5, 5, 5, 5, 4 }); // Stale aggregate: 4.9, ten reviews.
        var category = new Category { Id = Guid.NewGuid(), Name = "Math" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Math", CategoryId = category.Id, Category = category };
        var service = new Service
        {
            Id = Guid.NewGuid(), TutorProfileId = tutor.Id, TutorProfile = tutor, SubjectId = subject.Id,
            Subject = subject, Title = "Math package", Description = "Course", Price = 1000000,
            TotalSessions = 10, Status = ServiceStatus.Published
        };
        tutor.Services.Add(service);
        var reviews = new List<Review>();
        if (withReviews)
        {
            Review Row(int rating, Guid serviceId)
            {
                var enrollment = new Enrollment { Id = Guid.NewGuid(), TutorProfileId = tutor.Id, ServiceId = serviceId,
                    StudentProfile = new StudentProfile { User = new User { FullName = "Student" } } };
                var review = Review.Create(enrollment.Id, rating, "Feedback");
                review.Enrollment = enrollment;
                return review;
            }
            reviews.Add(Row(5, service.Id));
            reviews.Add(Row(3, Guid.NewGuid())); // Another package, same tutor.
            var removed = Row(1, service.Id);
            removed.RemoveByAdmin("Moderated", Guid.NewGuid());
            reviews.Add(removed);
        }
        var db = new Mock<IAppDbContext>();
        db.Setup(x => x.Reviews).Returns(MockDbSetHelper.CreateMockDbSet(reviews).Object);
        db.Setup(x => x.Services).Returns(MockDbSetHelper.CreateMockDbSet(new List<Service> { service }).Object);
        db.Setup(x => x.TutorProfiles).Returns(MockDbSetHelper.CreateMockDbSet(new List<TutorProfile> { tutor }).Object);
        db.Setup(x => x.Enrollments).Returns(MockDbSetHelper.CreateMockDbSet(new List<Enrollment>()).Object);
        return (db.Object, service);
    }

    [Theory]
    [InlineData(false, 0, 0, 0, 0)]
    [InlineData(true, 4, 2, 5, 1)]
    public async Task PublicPages_UseVisibleReviewsRatherThanStaleTutorCounters(bool withReviews, int tutorAverage, int tutorCount, int packageAverage, int packageCount)
    {
        var (db, service) = Fixture(withReviews);
        var detail = await new GetServiceDetailQueryHandler(db).Handle(new GetServiceDetailQuery(service.Id), default);
        var listing = await new GetPublicServicesQueryHandler(db).Handle(new GetPublicServicesQuery(), default);
        var tutors = await new GetTutorsQueryHandler(db).Handle(new GetTutorsQuery(), default);
        detail.Tutor.RatingAvg.Should().Be(tutorAverage);
        detail.Tutor.TotalReviews.Should().Be(tutorCount);
        detail.RatingAvg.Should().Be(packageAverage);
        detail.TotalReviews.Should().Be(packageCount);
        listing.Items.Single().TutorRating.Should().Be(tutorAverage);
        listing.Items.Single().TutorTotalReviews.Should().Be(tutorCount);
        tutors.Items.Single().RatingAvg.Should().Be(tutorAverage);
        tutors.Items.Single().TotalReviews.Should().Be(tutorCount);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task MinimumRating_DoesNotAdmitStaleHighScores(bool withReviews)
    {
        var (db, _) = Fixture(withReviews);
        var packages = await new GetPublicServicesQueryHandler(db).Handle(new GetPublicServicesQuery(MinRating: 4.8m), default);
        var tutors = await new GetTutorsQueryHandler(db).Handle(new GetTutorsQuery(MinRating: 4.8m), default);
        packages.TotalCount.Should().Be(0);
        tutors.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task CachedPackage_DoesNotKeepAnObsoleteTutorRatingAfterReviewsDisappear()
    {
        var (db, service) = Fixture(false);
        var detail = await new GetServiceDetailQueryHandler(db).Handle(new GetServiceDetailQuery(service.Id), default);
        var stale = detail with { Tutor = detail.Tutor with { RatingAvg = 4.9m, TotalReviews = 99 } };
        var cache = new Mock<IServiceDetailCacheService>();
        cache.Setup(x => x.GetServiceDetailAsync(service.Id, It.IsAny<Func<Task<ServiceDetailDto?>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(stale);
        var result = await new GetServiceDetailQueryHandler(db, cache.Object).Handle(new GetServiceDetailQuery(service.Id), default);
        result.Tutor.RatingAvg.Should().Be(0);
        result.Tutor.TotalReviews.Should().Be(0);
    }

    [Fact]
    public async Task PriceCeiling_RemainsInclusiveAsAdvertisedByTheUpdatedLabel()
    {
        var (db, _) = Fixture(false);
        var packages = await new GetPublicServicesQueryHandler(db).Handle(new GetPublicServicesQuery(MaxPrice: 1000000), default);
        packages.Items.Single().Price.Should().Be(1000000);
        var below = await new GetPublicServicesQueryHandler(db).Handle(new GetPublicServicesQuery(MaxPrice: 999999), default);
        below.TotalCount.Should().Be(0);
    }
}
