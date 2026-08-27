using MediatR;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Subjects.GetPublicSubjectById;

public record GetPublicSubjectByIdQuery(
    Guid Id
) : IRequest<PublicSubjectDto>;
