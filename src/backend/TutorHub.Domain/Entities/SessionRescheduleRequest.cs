using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class SessionRescheduleRequest
{
    public Guid Id { get; private set; }
    public Guid SessionId { get; private set; }
    public Session Session { get; private set; } = default!;

    public Guid ProposerUserId { get; private set; } // Always Tutor (INV-RESCHED-001)
    public Guid RecipientUserId { get; private set; } // Always Student (INV-RESCHED-001)

    public DateTime ProposedStartAt { get; private set; }
    public DateTime ProposedEndAt { get; private set; }
    public string? Reason { get; private set; } // DEC-RESCHED-001: optional, max 500 chars

    public RescheduleRequestStatus Status { get; private set; } = RescheduleRequestStatus.Pending;
    public string? RejectionReason { get; private set; }

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; private set; }

    private SessionRescheduleRequest() { } // Required by EF Core

    public static SessionRescheduleRequest Create(
        Guid sessionId,
        Guid tutorUserId,
        Guid studentUserId,
        DateTime proposedStartAt,
        DateTime proposedEndAt,
        string? reason,
        DateTime now)
    {
        return new SessionRescheduleRequest
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            ProposerUserId = tutorUserId,
            RecipientUserId = studentUserId,
            ProposedStartAt = proposedStartAt,
            ProposedEndAt = proposedEndAt,
            Reason = reason,
            Status = RescheduleRequestStatus.Pending,
            CreatedAt = now
        };
    }

    public void Accept(Guid respondingUserId, DateTime now)
    {
        if (Status != RescheduleRequestStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot accept request in '{Status}' status.");
        }

        if (respondingUserId != RecipientUserId)
        {
            throw new InvalidOperationException("Only the Student recipient can accept this reschedule request.");
        }

        Status = RescheduleRequestStatus.Accepted;
        RespondedAt = now;
    }

    public void Reject(Guid respondingUserId, string? rejectionReason, DateTime now)
    {
        if (Status != RescheduleRequestStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot reject request in '{Status}' status.");
        }

        if (respondingUserId != RecipientUserId)
        {
            throw new InvalidOperationException("Only the Student recipient can reject this reschedule request.");
        }

        Status = RescheduleRequestStatus.Rejected;
        RejectionReason = rejectionReason;
        RespondedAt = now;
    }
}
