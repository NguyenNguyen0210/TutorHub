namespace TutorHub.Application.Features.Auth.DTOs;

/// <summary>
/// Body of the external sign-in callback.
///
/// Note there is no email field, and that is the point: the API derives identity
/// from the provider's own token exchange. Accepting an email from the browser
/// would let a caller claim any account.
/// </summary>
public record CompleteExternalLoginRequest(
    string Code,
    string State,
    string? ReturnUrl = null);
