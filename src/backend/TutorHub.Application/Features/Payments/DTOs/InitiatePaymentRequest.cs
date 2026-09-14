namespace TutorHub.Application.Features.Payments.DTOs;

public record InitiatePaymentRequest(
    Guid BookingId
);
