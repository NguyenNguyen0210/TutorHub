using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "You do not have permission to access this resource.")
        : base("Forbidden", HttpStatusCode.Forbidden, new List<string> { message })
    {
    }
}
