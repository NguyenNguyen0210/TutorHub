using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class ConflictException : AppException
{
    public ConflictException(string error)
        : base("A business conflict or duplicate resource was detected.", HttpStatusCode.Conflict, new List<string> { error })
    {
    }

    public ConflictException(string message, List<string> errors)
        : base(message, HttpStatusCode.Conflict, errors)
    {
    }
}
