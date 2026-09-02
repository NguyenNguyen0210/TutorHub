using System.Text.Json;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Common.Events;

public static class OutboxExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static void AddOutboxMessage<TEvent>(this IAppDbContext dbContext, TEvent domainEvent) 
        where TEvent : IBusinessEvent
    {
        var payload = JsonSerializer.Serialize(domainEvent, domainEvent.GetType(), JsonOptions);
        
        if (dbContext.OutboxMessages != null)
        {
            dbContext.OutboxMessages.Add(new OutboxMessage
            {
                Id = Guid.NewGuid(),
                EventId = domainEvent.EventId,
                EventType = domainEvent.EventType,
                EventVersion = domainEvent.EventVersion,
                AggregateType = domainEvent.AggregateType,
                AggregateId = domainEvent.AggregateId,
                Payload = payload,
                OccurredAt = domainEvent.OccurredAt,
                CreatedAt = DateTime.UtcNow,
                Status = OutboxMessageStatus.Pending
            });
        }
    }
}
