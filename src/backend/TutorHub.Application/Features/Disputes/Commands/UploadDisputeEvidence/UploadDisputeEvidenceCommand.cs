using MediatR;
using TutorHub.Application.Features.Disputes.DTOs;

namespace TutorHub.Application.Features.Disputes.Commands.UploadDisputeEvidence;

public record UploadDisputeEvidenceCommand(
    Guid DisputeId,
    string FileName,
    string FileUrl,
    string ContentType,
    long FileSizeBytes
) : IRequest<DisputeEvidenceDto>;
