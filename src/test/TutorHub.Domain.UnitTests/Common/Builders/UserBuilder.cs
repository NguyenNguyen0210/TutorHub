using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Domain.UnitTests.Common.Builders;

public class UserBuilder
{
    private Guid _id = Guid.NewGuid();
    private string _email = "testuser@example.com";
    private string _passwordHash = "$2a$11$mocked_password_hash_value_12345";
    private string _fullName = "Nguyen Van A";
    private string? _phone = "0987654321";
    private UserRole _role = UserRole.Student;
    private bool _isActive = true;
    private TutorProfile? _tutorProfile;
    private StudentProfile? _studentProfile;

    public UserBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public UserBuilder WithEmail(string email)
    {
        _email = email;
        return this;
    }

    public UserBuilder WithPasswordHash(string hash)
    {
        _passwordHash = hash;
        return this;
    }

    public UserBuilder WithFullName(string fullName)
    {
        _fullName = fullName;
        return this;
    }

    public UserBuilder WithRole(UserRole role)
    {
        _role = role;
        return this;
    }

    public UserBuilder WithActive(bool isActive)
    {
        _isActive = isActive;
        return this;
    }

    public UserBuilder WithTutorProfile(TutorProfile? tutorProfile)
    {
        _tutorProfile = tutorProfile;
        return this;
    }

    public UserBuilder WithStudentProfile(StudentProfile? studentProfile)
    {
        _studentProfile = studentProfile;
        return this;
    }

    public User Build()
    {
        return new User
        {
            Id = _id,
            Email = _email,
            PasswordHash = _passwordHash,
            FullName = _fullName,
            Phone = _phone,
            Role = _role,
            IsActive = _isActive,
            TutorProfile = _tutorProfile,
            StudentProfile = _studentProfile,
            CreatedAt = DateTime.UtcNow
        };
    }
}
