using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Bookings.DTOs;

public record BookingDto(
    Guid Id,
    Guid StudentProfileId,
    string StudentName,
    string StudentEmail,
    string? StudentPhone,
    Guid TutorProfileId,
    string TutorName,
    string TutorEmail,
    string? TutorPhone,
    Guid SubjectId,
    string SubjectName,
    DateTime StartAt,
    DateTime EndAt,
    decimal HourlyRate,
    decimal TotalAmount,
    BookingStatus Status,
    DateTime? HoldingExpiresAt,
    DateTime? ConfirmedAt,
    DateTime? CompletedAt,
    DateTime? CancelledAt,
    CancelledBy? CancelledBy,
    string? CancellationReason,
    DateTime CreatedAt,
    TransactionDto? Transaction
);
