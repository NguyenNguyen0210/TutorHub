using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class BadRequestException : AppException
{
    public BadRequestException(string message, string errorCode = "BAD_REQUEST")
        : base(message, HttpStatusCode.BadRequest, errorCode)
    {
    }
}
