using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string message, string errorCode = "NOT_FOUND")
        : base(message, HttpStatusCode.NotFound, errorCode)
    {
    }

    public NotFoundException(string entityName, object key, string errorCode = "NOT_FOUND")
        : base($"Entity \"{entityName}\" ({key}) was not found.", HttpStatusCode.NotFound, errorCode)
    {
    }
}
