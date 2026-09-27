using TutorHub.Domain.Entities;

namespace TutorHub.Application.Common.Interfaces;

/// <summary>
/// Row-level locks for fast-track dispute resolution (SELECT ... FOR UPDATE).
/// Separated from the handler so the locking SQL stays mockable in unit tests;
/// relational providers cannot run raw SQL under Moq/EF-InMemory.
/// Lock order (dispute → wallet) and the ambient transaction are owned by the caller.
/// </summary>
public interface IFastTrackDisputeLocker
{
    Task LockDisputeAsync(Guid disputeId, CancellationToken cancellationToken);

    Task<TutorWallet?> LockTutorWalletAsync(Guid tutorProfileId, CancellationToken cancellationToken);
}
