using MediatR;
using TutorHub.Application.Features.Services.DTOs;

namespace TutorHub.Application.Features.Services.GetServiceDetail;

public record GetServiceDetailQuery(Guid Id, Guid? CurrentUserId = null) : IRequest<ServiceDetailDto>;
