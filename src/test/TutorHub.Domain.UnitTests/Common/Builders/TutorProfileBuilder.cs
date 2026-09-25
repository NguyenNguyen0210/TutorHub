using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Domain.UnitTests.Common.Builders;

public class TutorProfileBuilder
{
    private Guid _id = Guid.NewGuid();
    private User? _user;
    private Guid? _userId;
    private string _bio = "Experienced educator with 5+ years of teaching experience.";
    private int _experienceYears = 5;
    private string _education = "B.Sc. in Mathematics Education";
    private TeachingMode _teachingMode = TeachingMode.Both;
    private string? _address = "123 Nguyen Trai, District 1, HCMC";
    private readonly List<int> _ratings = Enumerable.Repeat(5, 10).ToList();

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

    public TutorProfileBuilder WithRatings(decimal ratingAvg, int totalReviews)
    {
        // F-23: stats are domain-owned; rebuild a rating set that reproduces
        // the requested average as closely as integers allow.
        _ratings.Clear();
        var rounded = Math.Max(1, Math.Min(5, (int)Math.Round(ratingAvg)));
        for (var i = 0; i < Math.Max(0, totalReviews); i++)
        {
            _ratings.Add(rounded);
        }

        return this;
    }

    public TutorProfile Build()
    {
        var user = _user ?? new UserBuilder()
            .WithId(_userId ?? Guid.NewGuid())
            .WithRole(UserRole.Tutor)
            .WithFullName("Default Tutor")
            .Build();

        var profile = new TutorProfile
        {
            Id = _id,
            UserId = user.Id,
            User = user,
            Bio = _bio,
            ExperienceYears = _experienceYears,
            Education = _education,
            TeachingMode = _teachingMode,
            Address = _address,
            TutorSubjects = new List<TutorSubject>()
        };
        profile.ApplyReview(_ratings);

        return profile;
    }
}
