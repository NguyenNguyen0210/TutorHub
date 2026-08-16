namespace TutorHub.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
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
        string message,
        List<string>? errors = null,
        string? traceId = null) =>
        new()
        {
            Success = false,
            Message = message,
            Errors = errors,
            TraceId = traceId
        };

    public static ApiResponse<T> FailureResult(
        string message,
        string error,
        string? traceId = null) =>
        new()
        {
            Success = false,
            Message = message,
            Errors = new List<string> { error },
            TraceId = traceId
        };
}
