using MediatR;
using TutorHub.Application.Features.Bookings.DTOs;

namespace TutorHub.Application.Features.Agreements.Commands.CheckoutCustomAgreement;

public record CheckoutCustomAgreementCommand(
    Guid AgreementId
) : IRequest<BookingDto>;
