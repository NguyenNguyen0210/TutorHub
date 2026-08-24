using TutorHub.Domain.Entities;

namespace TutorHub.Domain.UnitTests.Common.Builders;

public class SubjectBuilder
{
    private Guid _id = Guid.NewGuid();
    private string _name = "Mathematics";
    private Guid _categoryId = Guid.NewGuid();
    private bool _isActive = true;

    public SubjectBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public SubjectBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    public SubjectBuilder WithCategoryId(Guid categoryId)
    {
        _categoryId = categoryId;
        return this;
    }

    public SubjectBuilder WithActive(bool isActive)
    {
        _isActive = isActive;
        return this;
    }

    public Subject Build()
    {
        return new Subject
        {
            Id = _id,
            Name = _name,
            CategoryId = _categoryId,
            IsActive = _isActive,
            TutorSubjects = new List<TutorSubject>()
        };
    }
}
