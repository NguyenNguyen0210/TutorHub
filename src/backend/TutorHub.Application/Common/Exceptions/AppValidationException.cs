using System.Net;
using FluentValidation.Results;

namespace TutorHub.Application.Common.Exceptions;

public class AppValidationException : AppException
{
    public AppValidationException(List<string> errors)
        : base(errors.FirstOrDefault() ?? "Validation failed. One or more validation errors occurred.", HttpStatusCode.BadRequest, errors)
    {
    }

    public AppValidationException(IEnumerable<ValidationFailure> failures)
        : base(
            failures.FirstOrDefault()?.ErrorMessage ?? "Validation failed. One or more validation errors occurred.",
            HttpStatusCode.BadRequest,
            failures.Select(f => f.ErrorMessage).Distinct().ToList())
    {
    }

    public AppValidationException(string propertyName, string errorMessage)
        : base(
            errorMessage,
            HttpStatusCode.BadRequest,
            new List<string> { $"{propertyName}: {errorMessage}" })
    {
    }
}
