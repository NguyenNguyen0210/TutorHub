using Microsoft.Extensions.Logging;
using TutorHub.Application.Common.Concurrency;
using TutorHub.Application.Common.Files;
using TutorHub.Application.Common.Security;
using TutorHub.Application.Common.Storage;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;

public class UploadDisputeEvidenceCommandHandler : IRequestHandler<UploadDisputeEvidenceCommand, DisputeEvidenceDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;
    private readonly ICurrentUserService _currentUserService;
    private readonly IObjectStorageService _storage;
    private readonly ILogger<UploadDisputeEvidenceCommandHandler> _logger;

    public UploadDisputeEvidenceCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService, IObjectStorageService storage, ILogger<UploadDisputeEvidenceCommandHandler> logger)
    {
        _context = context;
        _clock = clock;
        _storage = storage;
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<DisputeEvidenceDto> Handle(UploadDisputeEvidenceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();
        await using var transaction = await PostgresAdvisoryLock.BeginTransactionAsync(_context, cancellationToken);
        await PostgresAdvisoryLock.LockRowAsync(_context,
            $"SELECT 1 FROM \"Disputes\" WHERE \"Id\" = {request.DisputeId} FOR UPDATE", cancellationToken);

        var dispute = await _context.Disputes
            .FirstOrDefaultAsync(d => d.Id == request.DisputeId, cancellationToken);

        if (dispute == null)
        {
            throw new NotFoundException(nameof(Dispute), request.DisputeId);
        }

        // Must be participant or admin
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException(nameof(User), userId);
        }

        var isParticipant = dispute.InitiatorUserId == userId || dispute.RespondentUserId == userId;
        var isAdmin = user.Role == UserRole.Admin;

        if (!isParticipant && !isAdmin)
        {
            throw new ForbiddenException("You do not have permission to upload evidence for this dispute.");
        }

        if (dispute.Status == DisputeStatus.Resolved || dispute.Status == DisputeStatus.Dismissed)
        {
            throw new BadRequestException("Cannot upload evidence for a closed dispute.");
        }

        if (request.ResponseId.HasValue)
        {
            var response = await _context.DisputeResponses.FirstOrDefaultAsync(x => x.Id == request.ResponseId.Value, cancellationToken);
            if (response == null || response.DisputeId != dispute.Id || response.AuthorUserId != userId)
                throw new ForbiddenException("Evidence must belong to your own response in this dispute.");
        }

        var ext = Path.GetExtension(request.FileName).ToLowerInvariant();
        if (request.Content == null || request.FileSizeBytes <= 0 || request.FileSizeBytes > UploadLimits.EvidenceMaxBytes
            || !request.Content.CanSeek || request.Content.Length != request.FileSizeBytes
            || !FileSignatureValidator.IsValidSignature(request.Content, ext, out var mime)
            || !UploadLimits.EvidenceMimeTypes.Contains(mime))
            throw new BadRequestException("Invalid evidence file. Allowed formats: JPG, PNG, WEBP, PDF, TXT; maximum 10 MB.");

        var key = $"reports/evidence/{dispute.Id:N}/{Guid.NewGuid():N}{ext}";
        var commitAttempted = false;
        try
        {
            request.Content.Position = 0;
            var stored = await _storage.UploadAsync(request.Content, key, mime, cancellationToken);
            if (stored.ObjectKey != key || stored.Size != request.FileSizeBytes)
                throw new InvalidOperationException("Storage returned inconsistent evidence metadata.");
            var evidence = new DisputeEvidence
            {
                Id = Guid.NewGuid(), DisputeId = dispute.Id, ResponseId = request.ResponseId,
                UploadedByUserId = userId, FileName = Path.GetFileName(request.FileName),
                ObjectKey = key, FileUrl = string.Empty, ContentType = mime,
                FileSizeBytes = stored.Size, CreatedAt = _clock.UtcNow
            };
            _context.DisputeEvidences.Add(evidence);
            await _context.SaveChangesAsync(cancellationToken);
            if (transaction != null)
            {
                commitAttempted = true;
                await transaction.CommitAsync(cancellationToken);
            }
            return new DisputeEvidenceDto
            {
                Id = evidence.Id, DisputeId = evidence.DisputeId, ResponseId = evidence.ResponseId,
                UploadedByUserId = userId, FileName = evidence.FileName,
                FileUrl = $"/api/v1/disputes/{dispute.Id}/evidence/{evidence.Id}/download",
                ContentType = mime, FileSizeBytes = evidence.FileSizeBytes, CreatedAt = evidence.CreatedAt
            };
        }
        catch
        {
            // A lost commit acknowledgement has an unknown outcome. Retain the
            // object for reconciliation rather than delete potentially committed evidence.
            if (commitAttempted) { _logger.LogError("Evidence commit outcome requires reconciliation for {ObjectKey}", key); throw; }
            // Cleanup must still run when the HTTP request was cancelled.
            try { await _storage.DeleteAsync(key, CancellationToken.None); }
            catch (Exception cleanupError) { _logger.LogError(cleanupError, "Failed to clean up uncommitted dispute evidence {ObjectKey}", key); }
            throw;
        }
    }
}
