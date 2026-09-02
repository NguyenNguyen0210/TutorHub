using MediatR;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.GetTutorServices;

public record GetTutorServicesQuery(
    Guid TutorProfileId
) : IRequest<List<ServiceSummaryDto>>;
