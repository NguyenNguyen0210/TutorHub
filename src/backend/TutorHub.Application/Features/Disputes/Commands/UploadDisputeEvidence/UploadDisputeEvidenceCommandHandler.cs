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

    public UploadDisputeEvidenceCommandHandler(IAppDbContext context, IClock clock, ICurrentUserService currentUserService)
    {
        _context = context;
        _clock = clock;
        _currentUserService = currentUserService;
    }

    public async Task<DisputeEvidenceDto> Handle(UploadDisputeEvidenceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

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

        var evidence = new DisputeEvidence
        {
            Id = Guid.NewGuid(),
            DisputeId = dispute.Id,
            UploadedByUserId = userId,
            FileName = request.FileName,
            FileUrl = request.FileUrl,
            ContentType = request.ContentType,
            FileSizeBytes = request.FileSizeBytes,
            CreatedAt = _clock.UtcNow
        };

        _context.DisputeEvidences.Add(evidence);
        await _context.SaveChangesAsync(cancellationToken);

        return new DisputeEvidenceDto
        {
            Id = evidence.Id,
            DisputeId = evidence.DisputeId,
            UploadedByUserId = evidence.UploadedByUserId,
            FileName = evidence.FileName,
            FileUrl = evidence.FileUrl,
            ContentType = evidence.ContentType,
            FileSizeBytes = evidence.FileSizeBytes,
            CreatedAt = evidence.CreatedAt
        };
    }
}
