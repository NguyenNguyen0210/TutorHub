using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Sessions.ScheduleSessionsBatch;

public record SessionScheduleItem(Guid SessionId, DateTime StartAt, DateTime EndAt);

public record ScheduleSessionsBatchCommand(List<SessionScheduleItem> Items) : IRequest<List<SessionDto>>;
