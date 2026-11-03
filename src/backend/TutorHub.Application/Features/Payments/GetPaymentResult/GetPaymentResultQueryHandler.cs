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
            .Where(
                t => t.PaymentGatewayRef == parsed.MerchantReference
                    || t.PaymentGatewayRef == $"{parsed.MerchantReference}|{parsed.ProviderTransactionId}")
            .OrderByDescending(t => t.PaymentGatewayRef == $"{parsed.MerchantReference}|{parsed.ProviderTransactionId}")
            .FirstOrDefaultAsync(cancellationToken);

        if (transaction == null && (parsed.MerchantReference?.StartsWith("TOPUP", StringComparison.OrdinalIgnoreCase) ?? false))
        {
            var topUp = await _context.TopUpRequests.AsNoTracking()
                .FirstOrDefaultAsync(t => t.TransferReference == parsed.MerchantReference, cancellationToken);
            var confirmed = topUp?.Status == TopUpRequestStatus.Confirmed &&
                topUp.Amount == parsed.Amount && parsed.IsSuccessful;
            var pending = topUp?.Status == TopUpRequestStatus.Pending &&
                topUp.Amount == parsed.Amount && parsed.IsSuccessful;
            var topUpMsg = confirmed
                ? "Nạp tiền vào ví học viên thành công! Số dư khả dụng của bạn đã được cập nhật."
                : pending
                    ? "Cổng thanh toán đã báo thành công; hệ thống đang xác nhận số dư ví."
                    : "Giao dịch nạp tiền chưa được xác nhận hoặc không thành công.";

            return new PaymentResultDto(
                Success: confirmed,
                Message: topUpMsg,
                BookingId: Guid.Empty,
                MerchantReference: parsed.MerchantReference ?? string.Empty,
                TransactionNo: parsed.ProviderTransactionId,
                Amount: parsed.Amount,
                Status: confirmed ? "Completed" : pending ? "Pending" : "Failed"
            );
        }

        var bookingId = transaction?.BookingId ?? Guid.Empty;

        var validAttempt = parsed.IsSuccessful && transaction != null
            && transaction.Type == TransactionType.BookingPayment && transaction.Amount == parsed.Amount;
        var refundPending = validAttempt && await _context.Transactions.AsNoTracking().AnyAsync(
            t => t.BookingId == bookingId && t.Type == TransactionType.StudentRefund
                && t.SettlementRequired && t.PaymentGatewayRef == $"LateIpnRefund-{transaction!.Id:N}",
            cancellationToken);
        var confirmedPayment = validAttempt && !refundPending
            && transaction!.Status is TransactionStatus.Held or TransactionStatus.Released
            && await _context.Bookings.AsNoTracking().AnyAsync(
                b => b.Id == bookingId && b.Status == BookingStatus.Paid, cancellationToken)
            && await _context.Enrollments.AsNoTracking().AnyAsync(
                e => e.BookingId == bookingId, cancellationToken);
        var pendingPayment = validAttempt && transaction!.Status == TransactionStatus.Pending;
        var status = confirmedPayment ? "Completed" : refundPending ? "RefundPending" : pendingPayment ? "Pending" : "Failed";
        var message = status switch
        {
            "Completed" => "Thanh toán đã được xác nhận. Khóa học của bạn đã được kích hoạt.",
            "Pending" => "Giao dịch đang chờ xác nhận. Vui lòng kiểm tra lại sau ít phút.",
            "RefundPending" => "Đơn học đã bị hủy. Khoản thanh toán đang được xử lý hoàn tiền.",
            _ => "Chưa thể xác nhận giao dịch thanh toán. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ."
        };

        return new PaymentResultDto(
            Success: confirmedPayment,
            Message: message,
            BookingId: bookingId,
            MerchantReference: parsed.MerchantReference ?? string.Empty,
            TransactionNo: parsed.ProviderTransactionId,
            Amount: parsed.Amount,
            Status: status
        );
    }
}
