using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Payments;
using TutorHub.Application.Features.Payments.DTOs;
using TutorHub.Domain.Enums;

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
            request.Parameters.TryGetValue("vnp_TxnRef", out var rawRef);
            decimal rawAmt = 0;
            if (request.Parameters.TryGetValue("vnp_Amount", out var amtStr) && decimal.TryParse(amtStr, out var amt))
            {
                rawAmt = amt / 100m;
            }

            return new PaymentResultDto(
                Success: false,
                Message: parsed.Error == PaymentCallbackError.InvalidSignature
                    ? "Invalid security checksum signature."
                    : "Invalid payment callback parameters.",
                BookingId: Guid.Empty,
                MerchantReference: rawRef ?? string.Empty,
                TransactionNo: null,
                Amount: rawAmt
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

        if (transaction == null && (parsed.MerchantReference?.StartsWith("TOPUP", StringComparison.OrdinalIgnoreCase) ?? false))
        {
            var topUp = await _context.TopUpRequests.AsNoTracking()
                .FirstOrDefaultAsync(t => t.TransferReference == parsed.MerchantReference, cancellationToken);
            var confirmed = topUp?.Status == TopUpRequestStatus.Confirmed &&
                topUp.Amount == parsed.Amount && parsed.IsSuccessful;
            var topUpMsg = confirmed
                ? "Nạp tiền vào ví học viên thành công! Số dư khả dụng của bạn đã được cập nhật."
                : topUp?.Status == TopUpRequestStatus.Pending && parsed.IsSuccessful
                    ? "Cổng thanh toán đã báo thành công; hệ thống đang xác nhận số dư ví."
                    : "Giao dịch nạp tiền chưa được xác nhận hoặc không thành công.";

            return new PaymentResultDto(
                Success: confirmed,
                Message: topUpMsg,
                BookingId: Guid.Empty,
                MerchantReference: parsed.MerchantReference ?? string.Empty,
                TransactionNo: parsed.ProviderTransactionId,
                Amount: parsed.Amount
            );
        }

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
