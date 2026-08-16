using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class UnauthorizedException : AppException
{
    public UnauthorizedException(
        string message = "You are not authorized to perform this action.",
        string errorCode = "UNAUTHORIZED")
        : base(message, HttpStatusCode.Unauthorized, errorCode)
    {
    }
}
