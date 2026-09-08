namespace TutorHub.Application.Common.Events;

public record MoneyDto(
    decimal Amount,
    string Currency = "VND"
);
