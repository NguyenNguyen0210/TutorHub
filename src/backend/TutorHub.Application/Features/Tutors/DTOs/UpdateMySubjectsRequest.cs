namespace TutorHub.Application.Features.Tutors.DTOs;

public record UpdateMySubjectsRequest(
    List<TutorSubjectItemDto> Subjects
);
