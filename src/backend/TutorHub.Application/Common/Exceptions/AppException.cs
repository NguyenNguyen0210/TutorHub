using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public abstract class AppException : Exception
{
    public HttpStatusCode StatusCode { get; }
    public List<string> Errors { get; }

    protected AppException(
        string message,
        HttpStatusCode statusCode = HttpStatusCode.InternalServerError,
        List<string>? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        Errors = errors ?? new List<string> { message };
    }
}
