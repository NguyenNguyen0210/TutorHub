namespace TutorHub.Application.Features.StudentWallets.DTOs;

public class StudentWalletDto
{
    public Guid Id { get; set; }
    public Guid StudentProfileId { get; set; }
    public decimal AvailableBalance { get; set; }
    public decimal ReservedBalance { get; set; }
    public decimal TotalBalance { get; set; }
    public DateTime UpdatedAt { get; set; }
}
