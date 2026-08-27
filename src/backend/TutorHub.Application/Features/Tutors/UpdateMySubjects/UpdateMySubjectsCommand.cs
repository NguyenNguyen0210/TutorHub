using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.UpdateMySubjects;

public record UpdateMySubjectsCommand(
    Guid UserId,
    List<TutorSubjectItemDto> Subjects
) : IRequest<List<TutorSubjectDto>>;
