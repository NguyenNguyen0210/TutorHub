using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "You are not authorized to perform this action.")
        : base("Unauthorized", HttpStatusCode.Unauthorized, new List<string> { message })
    {
    }
}
