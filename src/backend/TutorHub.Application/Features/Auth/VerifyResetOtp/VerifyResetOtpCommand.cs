using MediatR;

namespace TutorHub.Application.Features.Auth.VerifyResetOtp;

public record VerifyResetOtpCommand(
    string Email,
    string Otp
) : IRequest<string>;
