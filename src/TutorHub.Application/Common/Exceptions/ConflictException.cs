using System.Net;

namespace TutorHub.Application.Common.Exceptions;

public class ConflictException : AppException
{
    public ConflictException(string message)
        : base("Conflict", HttpStatusCode.Conflict, new List<string> { message })
    {
    }
}
