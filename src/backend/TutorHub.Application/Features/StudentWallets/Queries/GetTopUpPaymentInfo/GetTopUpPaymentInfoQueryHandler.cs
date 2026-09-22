using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;

namespace TutorHub.Application.Features.StudentWallets.Queries.GetTopUpPaymentInfo;

public class GetTopUpPaymentInfoQueryHandler : IRequestHandler<GetTopUpPaymentInfoQuery, TopUpPaymentInfoDto>
{
    private readonly IAppDbContext _context;

    public GetTopUpPaymentInfoQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<TopUpPaymentInfoDto> Handle(GetTopUpPaymentInfoQuery request, CancellationToken cancellationToken)
    {
        var bankNameSetting = await _context.PlatformSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformBankName", cancellationToken);
        var bankAccountNoSetting = await _context.PlatformSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformBankAccountNo", cancellationToken);
        var bankAccountNameSetting = await _context.PlatformSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformBankAccountName", cancellationToken);
        var bankBranchSetting = await _context.PlatformSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == "PlatformBankBranch", cancellationToken);

        return new TopUpPaymentInfoDto
        {
            BankName = bankNameSetting?.Value ?? "Vietcombank",
            BankAccountNo = bankAccountNoSetting?.Value ?? "1029384756",
            BankAccountName = bankAccountNameSetting?.Value ?? "TUTORHUB JSC",
            BankBranch = bankBranchSetting?.Value ?? "Hội Sở / TP. Hồ Chí Minh",
            Note = "Vui lòng nhập chính xác nội dung chuyển khoản để hệ thống tự động nhận diện và nạp tiền."
        };
    }
}
