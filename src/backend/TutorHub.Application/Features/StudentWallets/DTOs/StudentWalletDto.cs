namespace TutorHub.Application.Features.StudentWallets.DTOs;

public class StudentWalletDto
{
    public Guid Id { get; set; }
    public Guid? StudentProfileId { get; set; }
    public Guid? UserId { get; set; }
    public decimal AvailableBalance { get; set; }
    public decimal WithdrawingBalance { get; set; }
    public decimal TotalBalance { get; set; }
    public DateTime UpdatedAt { get; set; }
}
