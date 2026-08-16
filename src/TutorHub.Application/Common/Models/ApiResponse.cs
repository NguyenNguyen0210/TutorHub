namespace TutorHub.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public string? ErrorCode { get; set; }
    public IDictionary<string, string[]>? Errors { get; set; }
    public string? TraceId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> SuccessResult(T data, string? message = null) =>
        new()
        {
            Success = true,
            Data = data,
            Message = message
        };

    public static ApiResponse<T> FailureResult(
        string errorCode,
        string message,
        IDictionary<string, string[]>? errors = null,
        string? traceId = null) =>
        new()
        {
            Success = false,
            ErrorCode = errorCode,
            Message = message,
            Errors = errors,
            TraceId = traceId
        };
}
