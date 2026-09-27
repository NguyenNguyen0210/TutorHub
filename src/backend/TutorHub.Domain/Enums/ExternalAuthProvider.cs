namespace TutorHub.Domain.Enums;

/// <summary>
/// External identity providers TutorHub can accept a sign-in from.
/// Numeric values are persisted (see <c>ExternalLogin.Provider</c>), so append only.
/// </summary>
public enum ExternalAuthProvider
{
    Google = 0,
    Facebook = 1
}
