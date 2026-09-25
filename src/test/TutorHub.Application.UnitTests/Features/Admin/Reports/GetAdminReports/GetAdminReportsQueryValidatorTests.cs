using FluentAssertions;
using FluentValidation.TestHelper;
using TutorHub.Application.Features.Admin.Reports.GetAdminReports;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Admin.Reports.GetAdminReports;

public class GetAdminReportsQueryValidatorTests
{
    private readonly GetAdminReportsQueryValidator _validator = new();

    [Theory]
    [InlineData(1, 10)]
    [InlineData(5, 50)]
    [InlineData(10, 1)]
    public void Validate_WhenValidParameters_ShouldNotHaveErrors(int pageNumber, int pageSize)
    {
        var query = new GetAdminReportsQuery(ReportStatus.Open, pageNumber, pageSize);
        var result = _validator.TestValidate(query);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_WhenInvalidPageNumber_ShouldHaveError(int pageNumber)
    {
        var query = new GetAdminReportsQuery(ReportStatus.Open, pageNumber, 10);
        var result = _validator.TestValidate(query);
        result.ShouldHaveValidationErrorFor(x => x.PageNumber);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(51)]
    [InlineData(100)]
    public void Validate_WhenInvalidPageSize_ShouldHaveError(int pageSize)
    {
        var query = new GetAdminReportsQuery(ReportStatus.Open, 1, pageSize);
        var result = _validator.TestValidate(query);
        result.ShouldHaveValidationErrorFor(x => x.PageSize);
    }
}
