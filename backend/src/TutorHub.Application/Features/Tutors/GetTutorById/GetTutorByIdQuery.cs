using MediatR;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.GetTutorById;

public record GetTutorByIdQuery(Guid TutorProfileId) : IRequest<TutorProfileDto>;
