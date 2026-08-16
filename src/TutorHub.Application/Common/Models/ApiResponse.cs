namespace TutorHub.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public ApiErrorResponse? Error { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> SuccessResult(T data, string? message = null) =>
        new()
        {
            Success = true,
            Data = data,
            Message = message
        };

    public static ApiResponse<T> FailureResult(string code, string message, IDictionary<string, string[]>? details = null) =>
        new()
        {
            Success = false,
            Error = new ApiErrorResponse(code, message, details)
        };
}

public record ApiErrorResponse(
    string Code,
    string Message,
    IDictionary<string, string[]>? Details = null
);
