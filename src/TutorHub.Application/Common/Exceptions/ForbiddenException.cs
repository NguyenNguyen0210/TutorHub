using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class ForbiddenException : AppException
{
    public ForbiddenException(string error = "You do not have sufficient permissions to access this resource.")
        : base("Access denied. You do not have permission to perform this action.", HttpStatusCode.Forbidden, new List<string> { error })
    {
    }

    public ForbiddenException(string message, List<string> errors)
        : base(message, HttpStatusCode.Forbidden, errors)
    {
    }
}
