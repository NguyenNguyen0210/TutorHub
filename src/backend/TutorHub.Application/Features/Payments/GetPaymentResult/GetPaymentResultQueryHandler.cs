using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Features.Payments.DTOs;

namespace TutorHub.Application.Features.Payments.GetPaymentResult;

public class GetPaymentResultQueryHandler : IRequestHandler<GetPaymentResultQuery, PaymentResultDto>
{
    private readonly IAppDbContext _context;
    private readonly IPaymentGateway _paymentGateway;

    public GetPaymentResultQueryHandler(IAppDbContext context, IPaymentGateway paymentGateway)
    {
        _context = context;
        _paymentGateway = paymentGateway;
    }

    public async Task<PaymentResultDto> Handle(GetPaymentResultQuery request, CancellationToken cancellationToken)
    {
        var parsed = _paymentGateway.VerifyAndParseCallback(request.Parameters);

        if (!parsed.IsVerified)
        {
            return new PaymentResultDto(
                Success: false,
                Message: parsed.Error == PaymentCallbackError.InvalidSignature
                    ? "Invalid security checksum signature."
                    : "Invalid payment callback parameters.",
                BookingId: Guid.Empty,
                MerchantReference: string.Empty,
                TransactionNo: null,
                Amount: 0
            );
        }

        // Read-Only mode (NO MUTATION). The webhook rewrites the stored gateway
        // reference to a composite form, so match both the raw merchant ref and
        // the composite form.
        var transaction = await _context.Transactions
            .AsNoTracking()
            .FirstOrDefaultAsync(
                t => t.PaymentGatewayRef == parsed.MerchantReference
                    || t.PaymentGatewayRef == $"{parsed.MerchantReference}|{parsed.ProviderTransactionId}",
                cancellationToken);

        var bookingId = transaction?.BookingId ?? Guid.Empty;

        var message = parsed.IsSuccessful
            ? "Payment completed successfully and is being confirmed."
            : "Payment was not completed at the payment gateway.";

        return new PaymentResultDto(
            Success: parsed.IsSuccessful,
            Message: message,
            BookingId: bookingId,
            MerchantReference: parsed.MerchantReference ?? string.Empty,
            TransactionNo: parsed.ProviderTransactionId,
            Amount: parsed.Amount
        );
    }
}
