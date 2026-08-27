namespace TutorHub.Application.Features.Payments.DTOs;

public record VnPayIpnResponseDto(
    string RspCode,
    string Message
);
