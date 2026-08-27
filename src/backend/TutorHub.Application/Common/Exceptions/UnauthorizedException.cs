using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string error = "You are not authenticated to perform this action.")
        : base("Authentication failed or credentials are missing/invalid.", HttpStatusCode.Unauthorized, new List<string> { error })
    {
    }

    public UnauthorizedException(string message, List<string> errors)
        : base(message, HttpStatusCode.Unauthorized, errors)
    {
    }
}
