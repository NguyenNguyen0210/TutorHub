using System.Net;
using FluentValidation.Results;

namespace TutorHub.Application.Common.Exceptions;

public class ValidationException : AppException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(
        IDictionary<string, string[]> errors,
        string message = "One or more validation failures have occurred.",
        string errorCode = "VALIDATION_ERROR")
        : base(message, HttpStatusCode.BadRequest, errorCode)
    {
        Errors = errors;
    }

    public ValidationException(
        IEnumerable<ValidationFailure> failures,
        string message = "One or more validation failures have occurred.",
        string errorCode = "VALIDATION_ERROR")
        : base(message, HttpStatusCode.BadRequest, errorCode)
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(failureGroup => failureGroup.Key, failureGroup => failureGroup.ToArray());
    }
}
