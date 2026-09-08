namespace TutorHub.Application.Features.Conversations.DTOs;

public class ConversationDto
{
    public Guid Id { get; set; }

    public Guid StudentProfileId { get; set; }
    public Guid StudentUserId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? StudentAvatarUrl { get; set; }

    public Guid TutorProfileId { get; set; }
    public Guid TutorUserId { get; set; }
    public string TutorName { get; set; } = string.Empty;
    public string? TutorAvatarUrl { get; set; }

    public DateTime CreatedAt { get; set; }
    public Guid? LastMessageId { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public string? LastMessagePreview { get; set; }
    public int UnreadCount { get; set; }
}
