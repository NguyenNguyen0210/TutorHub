using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string message)
        : base("Resource not found", HttpStatusCode.NotFound, new List<string> { message })
    {
    }

    public NotFoundException(string entityName, object key)
        : base("Resource not found", HttpStatusCode.NotFound, new List<string> { $"Entity \"{entityName}\" ({key}) was not found." })
    {
    }
}
