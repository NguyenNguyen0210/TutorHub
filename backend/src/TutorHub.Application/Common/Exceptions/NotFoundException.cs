using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string error)
        : base("The requested resource could not be found.", HttpStatusCode.NotFound, new List<string> { error })
    {
    }

    public NotFoundException(string entityName, object key)
        : base("The requested resource could not be found.", HttpStatusCode.NotFound, new List<string> { $"Entity \"{entityName}\" ({key}) was not found." })
    {
    }

    public NotFoundException(string message, List<string> errors)
        : base(message, HttpStatusCode.NotFound, errors)
    {
    }
}
