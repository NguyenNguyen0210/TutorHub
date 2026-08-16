using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class ConflictException : AppException
{
    public ConflictException(string message, string errorCode = "CONFLICT")
        : base(message, HttpStatusCode.Conflict, errorCode)
    {
    }
}
