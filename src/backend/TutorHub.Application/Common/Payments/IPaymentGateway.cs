namespace TutorHub.Application.Common.Payments;

/// <summary>
/// Vendor-neutral payment gateway capability. The application expresses payment
/// intent and receives normalized callback results; the concrete provider and
/// its wire protocol live in Infrastructure.
/// </summary>
public interface IPaymentGateway
{
    /// <summary>Builds the provider redirect URL the student is sent to.</summary>
    string CreateRedirect(PaymentRedirectRequest request);

    /// <summary>
    /// Verifies the provider callback integrity and normalizes it into a
    /// provider-agnostic result (merchant reference, amount in major units,
    /// success flag, provider transaction id).
    /// </summary>
    PaymentCallbackResult VerifyAndParseCallback(IReadOnlyDictionary<string, string> parameters);

    /// <summary>
    /// Maps a normalized webhook outcome back to the provider's required
    /// acknowledgement payload (e.g. an RspCode/Message body).
    /// </summary>
    PaymentWebhookAck BuildAcknowledgement(PaymentWebhookOutcome outcome);
}

public enum PaymentCallbackError
{
    InvalidSignature,
    InvalidRequest
}

public enum PaymentWebhookOutcome
{
    Success,
    Duplicate,
    NotFound,
    InvalidAmount,
    InvalidSignature,
    InvalidRequest
}

public record PaymentCallbackResult(
    bool IsVerified,
    PaymentCallbackError? Error,
    string? MerchantReference,
    decimal Amount,
    bool IsSuccessful,
    string? ProviderTransactionId);

public record PaymentWebhookAck(
    string Code,
    string Message);
