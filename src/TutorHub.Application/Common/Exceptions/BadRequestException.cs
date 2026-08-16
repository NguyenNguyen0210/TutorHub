using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class BadRequestException : AppException
{
    public BadRequestException(string message)
        : base("Bad request", HttpStatusCode.BadRequest, new List<string> { message })
    {
    }

    public BadRequestException(string message, List<string> errors)
        : base(message, HttpStatusCode.BadRequest, errors)
    {
    }
}
