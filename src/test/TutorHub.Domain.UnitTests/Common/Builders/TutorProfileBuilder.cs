using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Domain.UnitTests.Common.Builders;

public class TutorProfileBuilder
{
    private Guid _id = Guid.NewGuid();
    private User? _user;
    private Guid? _userId;
    private string _bio = "Experienced educator with 5+ years of teaching experience.";
    private decimal _hourlyRate = 200_000m;
    private int _experienceYears = 5;
    private string _education = "B.Sc. in Mathematics Education";
    private TeachingMode _teachingMode = TeachingMode.Both;
    private string? _address = "123 Nguyen Trai, District 1, HCMC";
    private decimal _ratingAvg = 5.0m;
    private int _totalReviews = 10;

    public TutorProfileBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public TutorProfileBuilder WithUser(User user)
    {
        _user = user;
        _userId = user.Id;
        return this;
    }

    public TutorProfileBuilder WithUserId(Guid userId)
    {
        _userId = userId;
        return this;
    }

    public TutorProfileBuilder WithBio(string bio)
    {
        _bio = bio;
        return this;
    }

    public TutorProfileBuilder WithHourlyRate(decimal hourlyRate)
    {
        _hourlyRate = hourlyRate;
        return this;
    }

    public TutorProfileBuilder WithRatings(decimal ratingAvg, int totalReviews)
    {
        _ratingAvg = ratingAvg;
        _totalReviews = totalReviews;
        return this;
    }

    public TutorProfile Build()
    {
        var user = _user ?? new UserBuilder()
            .WithId(_userId ?? Guid.NewGuid())
            .WithRole(UserRole.Tutor)
            .WithFullName("Default Tutor")
            .Build();

        return new TutorProfile
        {
            Id = _id,
            UserId = user.Id,
            User = user,
            Bio = _bio,
            HourlyRate = _hourlyRate,
            ExperienceYears = _experienceYears,
            Education = _education,
            TeachingMode = _teachingMode,
            Address = _address,
            RatingAvg = _ratingAvg,
            TotalReviews = _totalReviews,
            TutorSubjects = new List<TutorSubject>(),
            AvailabilitySlots = new List<AvailabilitySlot>()
        };
    }
}
