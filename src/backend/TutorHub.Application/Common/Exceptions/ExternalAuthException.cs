using System.Net;

namespace TutorHub.Application.Common.Exceptions;

/// <summary>
/// A provider refused to complete the sign-in: bad client credentials, an expired or
/// already-used authorization code, a missing permission, or an unverified email.
///
/// BadRequest, not InternalServerError. None of these is a fault on our side, and
/// reporting them as 500 would both hide the real reason from the user and make
/// every user-side failure look like an outage on the monitoring dashboard.
/// The message is written to be shown as-is, and never contains the client secret.
/// </summary>
public class ExternalAuthException : AppException
{
    public ExternalAuthException(string error)
        : base("External sign-in could not be completed.", HttpStatusCode.BadRequest, new List<string> { error })
    {
    }
}
