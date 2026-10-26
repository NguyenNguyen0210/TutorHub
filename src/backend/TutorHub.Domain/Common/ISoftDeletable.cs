namespace TutorHub.Domain.Common;

/// <summary>
/// Defines a contract for entities supporting soft deletion.
/// </summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
    Guid? DeletedByUserId { get; set; }
    string? DeleteReason { get; set; }

    /// <summary>
    /// Soft deletes the entity and records audit metadata.
    /// </summary>
    void SoftDelete(Guid deletedByUserId, string? reason = null);

    /// <summary>
    /// Restores a soft-deleted entity back to active status.
    /// </summary>
    void Restore();
}
