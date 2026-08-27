using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Payments.DTOs;

namespace TutorHub.Application.Features.Payments.ProcessVnPayReturn;

public class ProcessVnPayReturnQueryHandler : IRequestHandler<ProcessVnPayReturnQuery, VnPayReturnResultDto>
{
    private readonly IAppDbContext _context;
    private readonly IVnPayService _vnPayService;

    public ProcessVnPayReturnQueryHandler(IAppDbContext context, IVnPayService vnPayService)
    {
        _context = context;
        _vnPayService = vnPayService;
    }

    public async Task<VnPayReturnResultDto> Handle(ProcessVnPayReturnQuery request, CancellationToken cancellationToken)
    {
        var parameters = request.Parameters;

        // 1. Extract SecureHash and Reference
        if (!parameters.TryGetValue("vnp_SecureHash", out var secureHash) || string.IsNullOrWhiteSpace(secureHash))
        {
            return new VnPayReturnResultDto(
                Success: false,
                Message: "Missing security checksum signature.",
                BookingId: Guid.Empty,
                MerchantReference: string.Empty,
                TransactionNo: null,
                Amount: 0,
                ResponseCode: null
            );
        }

        // 2. Validate Signature
        var isValidSignature = _vnPayService.VerifySignature(parameters, secureHash);
        if (!isValidSignature)
        {
            return new VnPayReturnResultDto(
                Success: false,
                Message: "Invalid security checksum signature.",
                BookingId: Guid.Empty,
                MerchantReference: string.Empty,
                TransactionNo: null,
                Amount: 0,
                ResponseCode: null
            );
        }

        parameters.TryGetValue("vnp_TxnRef", out var txnRef);
        parameters.TryGetValue("vnp_ResponseCode", out var responseCode);
        parameters.TryGetValue("vnp_TransactionNo", out var transactionNo);
        parameters.TryGetValue("vnp_Amount", out var amountStr);

        decimal amount = 0;
        if (decimal.TryParse(amountStr, out var rawAmount))
        {
            amount = rawAmount / 100m;
        }

        // 3. Find booking & transaction in Read-Only mode (NO MUTATION)
        var transaction = await _context.Transactions
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.PaymentGatewayRef == txnRef, cancellationToken);

        var bookingId = transaction?.BookingId ?? Guid.Empty;
        var isSuccess = responseCode == "00";

        var message = isSuccess
            ? "Payment completed successfully and is being confirmed."
            : $"Payment was not completed. VNPay response code: {responseCode}.";

        return new VnPayReturnResultDto(
            Success: isSuccess,
            Message: message,
            BookingId: bookingId,
            MerchantReference: txnRef ?? string.Empty,
            TransactionNo: transactionNo,
            Amount: amount,
            ResponseCode: responseCode
        );
    }
}
