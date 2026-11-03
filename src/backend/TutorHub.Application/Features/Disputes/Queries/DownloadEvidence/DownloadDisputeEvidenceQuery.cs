using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Storage;
using TutorHub.Domain.Enums;
using System.Text.RegularExpressions;

namespace TutorHub.Application.Features.Disputes.Queries.DownloadEvidence;

public record DownloadDisputeEvidenceQuery(Guid DisputeId, Guid EvidenceId) : IRequest<DisputeEvidenceFile>;
public record DisputeEvidenceFile(Stream Content, string FileName);

public class DownloadDisputeEvidenceQueryHandler(IAppDbContext context, ICurrentUserService currentUser, IObjectStorageService storage)
    : IRequestHandler<DownloadDisputeEvidenceQuery, DisputeEvidenceFile>
{
    public async Task<DisputeEvidenceFile> Handle(DownloadDisputeEvidenceQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserIdOrThrow();
        var evidence = await context.DisputeEvidences.AsNoTracking().Include(e => e.Dispute)
            .SingleOrDefaultAsync(e => e.Id == request.EvidenceId && e.DisputeId == request.DisputeId, cancellationToken);
        if (evidence == null) throw new NotFoundException("Evidence", request.EvidenceId);
        if (currentUser.Role != UserRole.Admin && evidence.Dispute.InitiatorUserId != userId && evidence.Dispute.RespondentUserId != userId)
            throw new ForbiddenException("Only participants and reviewers can access this evidence.");

        // Never follow legacy external URLs. Recover only the old generated key
        // shape inside this case, and read bytes from our configured storage.
        var key = evidence.ObjectKey;
        if (key == null && Uri.TryCreate(evidence.FileUrl, UriKind.Absolute, out var legacy))
        {
            var match = Regex.Match(legacy.AbsolutePath, $"(?:^|/)(reports/evidence/{request.DisputeId:N}/[a-f0-9]{{32}}\\.(?:jpg|jpeg|png|webp|pdf|txt))$", RegexOptions.CultureInvariant);
            if (match.Success) key = match.Groups[1].Value;
        }
        if (key == null || !Regex.IsMatch(key, $"^reports/evidence/{request.DisputeId:N}/[a-f0-9]{{32}}\\.(?:jpg|jpeg|png|webp|pdf|txt)$", RegexOptions.CultureInvariant)
            || !await storage.ExistsAsync(key, cancellationToken))
            throw new NotFoundException("Evidence file is unavailable in managed storage.");
        try { return new DisputeEvidenceFile(await storage.DownloadAsync(key, cancellationToken), evidence.FileName); }
        catch (FileNotFoundException) { throw new NotFoundException("Evidence file is unavailable in managed storage."); }
    }
}
