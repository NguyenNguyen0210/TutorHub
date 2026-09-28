namespace TutorHub.Application.Features.StudentWallets.DTOs;

public record StudentTopUpApiRequest(decimal Amount);

public record AdminConfirmTopUpApiRequest(string? AdminNote = null);

public record AdminRejectTopUpApiRequest(string Reason);

public record AdminFailWithdrawalApiRequest(string Reason);
