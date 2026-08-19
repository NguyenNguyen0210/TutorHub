namespace TutorHub.Application.Features.Bookings.DTOs;

public record PayBookingRequest(
    string? PaymentMethod = "Mock"
);
