namespace TutorHub.Application.Features.StudentWallets.DTOs;

public class TopUpPaymentInfoDto
{
    public string BankName { get; set; } = "Vietcombank";
    public string BankAccountNo { get; set; } = "1029384756";
    public string BankAccountName { get; set; } = "TUTORHUB JSC";
    public string BankBranch { get; set; } = "Hội Sở / TP. Hồ Chí Minh";
    public string Note { get; set; } = "Vui lòng nhập chính xác nội dung chuyển khoản để hệ thống tự động nhận diện và nạp tiền.";
}
