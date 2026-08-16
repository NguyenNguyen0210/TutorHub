using FluentValidation.Results;

namespace TutorHub.Application.Common.Exceptions;

public abstract class AppException : Exception
{
    protected AppException(string message) : base(message) { }
}

public class BadRequestException : AppException
{
    public BadRequestException(string message) : base(message) { }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message) { }

    public NotFoundException(string name, object key) 
        : base($"Entity \"{name}\" ({key}) was not found.") { }
}

public class ConflictException : AppException
{
    public ConflictException(string message) : base(message) { }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "You are not authorized to perform this action.") 
        : base(message) { }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "You do not have permission to access this resource.") 
        : base(message) { }
}

public class ValidationException : AppException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation failures have occurred.")
    {
        Errors = errors;
    }

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : base("One or more validation failures have occurred.")
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(failureGroup => failureGroup.Key, failureGroup => failureGroup.ToArray());
    }
}
