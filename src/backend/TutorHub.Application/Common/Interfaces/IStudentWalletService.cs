using TutorHub.Domain.Entities;

namespace TutorHub.Application.Common.Interfaces;

public interface IStudentWalletService
{
    Task<StudentWallet> GetOrCreateWalletAsync(Guid studentProfileId, DateTime now, CancellationToken cancellationToken = default);

    Task CreditRefundAsync(
        Guid studentProfileId,
        decimal amount,
        string referenceType,
        Guid? referenceId,
        string description,
        DateTime now,
        CancellationToken cancellationToken = default);
}
