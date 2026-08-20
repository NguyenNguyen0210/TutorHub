using System.Net;
using FluentValidation.Results;

namespace TutorHub.Application.Common.Exceptions;

public class ValidationException : AppException
{
    public ValidationException(List<string> errors)
        : base("Validation failed. One or more validation errors occurred.", HttpStatusCode.BadRequest, errors)
    {
    }

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : base(
            "Validation failed. One or more validation errors occurred.",
            HttpStatusCode.BadRequest,
            failures.Select(f => f.ErrorMessage).Distinct().ToList())
    {
    }

    public ValidationException(string propertyName, string errorMessage)
        : base(
            "Validation failed. One or more validation errors occurred.",
            HttpStatusCode.BadRequest,
            new List<string> { $"{propertyName}: {errorMessage}" })
    {
    }
}
