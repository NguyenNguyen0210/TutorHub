using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Notifications.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Notifications.GetNotification;

public record GetNotificationQuery(Guid Id) : IRequest<NotificationDto>;

public class GetNotificationQueryHandler(IAppDbContext context, ICurrentUserService currentUser)
    : IRequestHandler<GetNotificationQuery, NotificationDto>
{
    public async Task<NotificationDto> Handle(GetNotificationQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserIdOrThrow();
        var item = await context.Notifications.AsNoTracking()
            .Where(n => n.Id == request.Id && n.UserId == userId)
            .Select(n => new NotificationDto {
                Id = n.Id, UserId = n.UserId, Title = n.Title, Message = n.Message,
                Type = n.Type, DeepLink = n.DeepLink, IsRead = n.IsRead, ReadAt = n.ReadAt,
                IsCritical = n.IsCritical, EventId = n.EventId,
                DeduplicationKey = n.DeduplicationKey, CreatedAt = n.CreatedAt
            }).FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Notification", request.Id);

        // Old notifications often stored only a wallet/list URL. Their original event
        // contains the stable object ID; never infer a target from amount or timestamp.
        if (!item.EventId.HasValue) return item;
        var payload = await context.OutboxMessages.AsNoTracking()
            .Where(e => e.EventId == item.EventId.Value && e.EventType == item.Type)
            .Select(e => e.Payload).FirstOrDefaultAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(payload)) return item;
        try
        {
            using var document = JsonDocument.Parse(payload);
            Guid? Id(string name) {
                foreach (var property in document.RootElement.EnumerateObject())
                    if (property.Name.Equals(name, StringComparison.OrdinalIgnoreCase)
                        && property.Value.ValueKind == JsonValueKind.String
                        && Guid.TryParse(property.Value.GetString(), out var value)) return value;
                return null;
            }
            var student = currentUser.Role == UserRole.Student;
            var admin = currentUser.Role == UserRole.Admin;
            var workspace = student ? "student" : "tutor";
            var enrollmentId = Id("EnrollmentId");
            var sessionId = Id("SessionId");
            var withdrawalId = Id("WithdrawalId");
            var topupId = Id("TopUpRequestId");
            var disputeId = Id("DisputeId");
            var applicationId = Id("ApplicationId");
            var bookingId = Id("BookingId");
            if ((item.Type is "RefundCreated" or "RefundCompleted" or "RefundFailed") && Id("TransactionId") is Guid transactionId)
            {
                // Recover authoritative provenance for old late-IPN events that stored
                // a BookingId in EnrollmentId. The notification owner must own the payment.
                var refundBookingId = await context.Transactions.AsNoTracking()
                    .Where(t => t.Id == transactionId && t.Booking.StudentProfile.UserId == userId)
                    .Select(t => (Guid?)t.BookingId).FirstOrDefaultAsync(cancellationToken);
                if (refundBookingId.HasValue)
                {
                    bookingId = refundBookingId;
                    enrollmentId = await context.Enrollments.AsNoTracking()
                        .Where(e => e.BookingId == refundBookingId.Value)
                        .Select(e => (Guid?)e.Id).FirstOrDefaultAsync(cancellationToken);
                }
            }
            item.DeepLink = item.Type switch {
                "RefundCreated" or "RefundCompleted" or "RefundFailed" when bookingId.HasValue && (!enrollmentId.HasValue || enrollmentId == Guid.Empty)
                    => $"/student/wallet?tab=payments&bookingId={bookingId}",
                "PaymentSucceeded" or "EnrollmentActivated" or "EnrollmentCancelled"
                    or "RefundCreated" or "RefundCompleted" or "RefundFailed" when enrollmentId.HasValue
                    => $"/{workspace}/enrollments/{enrollmentId}",
                "SessionScheduled" or "SessionRescheduled" or "SessionCancelled" or "SessionReminderDue"
                    or "GracePeriodStarted" or "GracePeriodClosingSoon" or "SessionIssueReported"
                    or "SessionCompleted" or "EarningCreated" when sessionId.HasValue
                    => $"/{workspace}/sessions/{sessionId}",
                "StudentWalletPaymentSucceeded" when student && bookingId.HasValue
                    => $"/student/wallet?tab=payments&bookingId={bookingId}",
                "StudentTopUpRequested" when admin && topupId.HasValue
                    => $"/admin/student-wallets?tab=topups&recordId={topupId}",
                "StudentTopUpConfirmed" or "StudentTopUpRejected" when student && topupId.HasValue
                    => $"/student/wallet?tab=topups&recordId={topupId}",
                "StudentWithdrawalRequested" when admin && withdrawalId.HasValue
                    => $"/admin/student-wallets?tab=withdrawals&recordId={withdrawalId}",
                "StudentWithdrawalCompleted" or "StudentWithdrawalFailed" when student && withdrawalId.HasValue
                    => $"/student/wallet?tab=withdrawals&recordId={withdrawalId}",
                "WithdrawalRequested" or "WithdrawalCompleted" or "WithdrawalFailed" when withdrawalId.HasValue
                    => $"/{workspace}/wallet?tab=withdrawals&recordId={withdrawalId}",
                "TutorApplicationSubmitted" when admin && applicationId.HasValue
                    => $"/admin/tutor-applications?applicationId={applicationId}",
                "DisputeCreated" or "DisputeResolved" when disputeId.HasValue
                    => admin ? $"/admin/disputes/{disputeId}" : $"/app/disputes/{disputeId}",
                "ReviewCreated" when (Id("TutorProfileId") ?? Id("TutorId")) is Guid tutorId => $"/tutors/{tutorId}#danh-gia",
                _ => item.DeepLink
            };
        }
        catch (JsonException) { /* Keep the saved link if an old event payload cannot be read. */ }
        return item;
    }
}
