using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Domain.UnitTests.Common.Builders;

public class StudentProfileBuilder
{
    private Guid _id = Guid.NewGuid();
    private User? _user;
    private Guid? _userId;

    public StudentProfileBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public StudentProfileBuilder WithUser(User user)
    {
        _user = user;
        _userId = user.Id;
        return this;
    }

    public StudentProfileBuilder WithUserId(Guid userId)
    {
        _userId = userId;
        return this;
    }

    public StudentProfile Build()
    {
        var user = _user ?? new UserBuilder()
            .WithId(_userId ?? Guid.NewGuid())
            .WithRole(UserRole.Student)
            .WithFullName("Default Student")
            .Build();

        return new StudentProfile
        {
            Id = _id,
            UserId = user.Id,
            User = user,
            Bookings = new List<Booking>()
        };
    }
}
