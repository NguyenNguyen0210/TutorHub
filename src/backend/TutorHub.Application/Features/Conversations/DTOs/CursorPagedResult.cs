namespace TutorHub.Application.Features.Conversations.DTOs;

public class CursorPagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public string? NextCursor { get; set; }
    public bool HasMore { get; set; }

    public static CursorPagedResult<T> Create(IReadOnlyList<T> items, string? nextCursor, bool hasMore)
    {
        return new CursorPagedResult<T>
        {
            Items = items,
            NextCursor = nextCursor,
            HasMore = hasMore
        };
    }
}
