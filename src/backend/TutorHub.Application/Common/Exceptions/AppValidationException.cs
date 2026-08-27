using System.Net;
using FluentValidation.Results;

namespace TutorHub.Application.Common.Exceptions;

public class AppValidationException : AppException
{
    public AppValidationException(List<string> errors)
        : base("Validation failed. One or more validation errors occurred.", HttpStatusCode.BadRequest, errors)
    {
    }

    public AppValidationException(IEnumerable<ValidationFailure> failures)
        : base(
            "Validation failed. One or more validation errors occurred.",
            HttpStatusCode.BadRequest,
            failures.Select(f => f.ErrorMessage).Distinct().ToList())
    {
    }

    public AppValidationException(string propertyName, string errorMessage)
        : base(
            "Validation failed. One or more validation errors occurred.",
            HttpStatusCode.BadRequest,
            new List<string> { $"{propertyName}: {errorMessage}" })
    {
    }
}
