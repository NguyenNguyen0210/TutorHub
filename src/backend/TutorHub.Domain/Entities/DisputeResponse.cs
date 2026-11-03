namespace TutorHub.Domain.Entities;

/// <summary>An immutable explanation submitted by a dispute participant.</summary>
public class DisputeResponse
{
    public Guid Id { get; set; }
    public Guid DisputeId { get; set; }
    public Dispute Dispute { get; set; } = default!;
    public Guid AuthorUserId { get; set; }
    public User AuthorUser { get; set; } = default!;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
