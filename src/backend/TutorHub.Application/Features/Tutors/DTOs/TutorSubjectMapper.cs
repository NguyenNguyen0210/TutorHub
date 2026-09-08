using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Tutors.DTOs;

/// <summary>
/// F-23 (Đợt 4): single mapping point for TutorSubject → TutorSubjectDto.
/// </summary>
public static class TutorSubjectMapper
{
    public static TutorSubjectDto ToDto(TutorSubject tutorSubject)
    {
        return new TutorSubjectDto(
            Id: tutorSubject.Id,
            SubjectId: tutorSubject.SubjectId,
            SubjectName: tutorSubject.Subject.Name,
            CategoryId: tutorSubject.Subject.CategoryId,
            CategoryName: tutorSubject.Subject.Category.Name,
            IsActive: tutorSubject.IsActive
        );
    }

    public static List<TutorSubjectDto> ToList(IEnumerable<TutorSubject> tutorSubjects)
    {
        return tutorSubjects.Select(ToDto).ToList();
    }
}
