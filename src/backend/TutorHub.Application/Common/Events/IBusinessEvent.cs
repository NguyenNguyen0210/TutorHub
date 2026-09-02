using MediatR;

namespace TutorHub.Application.Common.Events;

public interface IBusinessEvent : INotification
{
    Guid EventId { get; }
    string EventType { get; }
    int EventVersion { get; }
    DateTime OccurredAt { get; }
    string AggregateType { get; }
    Guid AggregateId { get; }
}
