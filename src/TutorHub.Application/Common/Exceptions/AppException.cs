using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public abstract class AppException : Exception
{
    public HttpStatusCode StatusCode { get; }
    public string ErrorCode { get; }

    protected AppException(
        string message,
        HttpStatusCode statusCode = HttpStatusCode.InternalServerError,
        string errorCode = "INTERNAL_SERVER_ERROR")
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }
}
