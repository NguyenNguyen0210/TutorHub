using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class BadRequestException : AppException
{
    public BadRequestException(string error)
        : base("Invalid request. Please check the submitted data.", HttpStatusCode.BadRequest, new List<string> { error })
    {
    }

    public BadRequestException(string message, List<string> errors)
        : base(message, HttpStatusCode.BadRequest, errors)
    {
    }

    public BadRequestException(List<string> errors)
        : base("Invalid request. Please check the submitted data.", HttpStatusCode.BadRequest, errors)
    {
    }
}
