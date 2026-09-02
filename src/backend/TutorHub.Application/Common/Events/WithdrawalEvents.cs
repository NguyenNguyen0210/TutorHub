using MediatR;

namespace TutorHub.Application.Common.Events;

public sealed record WithdrawalRequestedEvent(
    Guid WithdrawalId,
    Guid TutorProfileId,
    Guid TutorUserId,
    decimal Amount
) : INotification;

public sealed record WithdrawalCompletedEvent(
    Guid WithdrawalId,
    Guid TutorProfileId,
    Guid TutorUserId,
    decimal Amount
) : INotification;

public sealed record WithdrawalFailedEvent(
    Guid WithdrawalId,
    Guid TutorProfileId,
    Guid TutorUserId,
    decimal Amount,
    string FailureReason
) : INotification;
