using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Disputes.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Disputes.Commands.SubmitDisputeResponse;

public class SubmitDisputeResponseCommandHandler(IAppDbContext context, ICurrentUserService currentUser, IClock clock)
    : IRequestHandler<SubmitDisputeResponseCommand, DisputeResponseDto>
{
    public async Task<DisputeResponseDto> Handle(SubmitDisputeResponseCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserIdOrThrow();
        await using var tx = await context.Database.BeginTransactionAsync(cancellationToken);
        // Serialize with admin resolution; no statement can be added after closure.
        await context.Database.ExecuteSqlInterpolatedAsync($"SELECT 1 FROM \"Disputes\" WHERE \"Id\" = {request.DisputeId} FOR UPDATE", cancellationToken);
        var dispute = await context.Disputes.FirstOrDefaultAsync(x => x.Id == request.DisputeId, cancellationToken)
            ?? throw new NotFoundException(nameof(Dispute), request.DisputeId);
        if (userId != dispute.InitiatorUserId && userId != dispute.RespondentUserId)
            throw new ForbiddenException("Bạn không có quyền gửi giải trình cho khiếu nại này.");
        var author = await context.Users.FirstAsync(x => x.Id == userId, cancellationToken);
        var content = request.Content.Trim();
        var response = await context.DisputeResponses.FirstOrDefaultAsync(x => x.Id == request.SubmissionId, cancellationToken);
        if (response != null)
        {
            if (response.DisputeId != dispute.Id || response.AuthorUserId != userId || response.Content != content)
                throw new ConflictException("Mã gửi giải trình đã được sử dụng cho nội dung khác.");
        }
        else
        {
            if (dispute.Status is DisputeStatus.Resolved or DisputeStatus.Dismissed)
                throw new ConflictException("Khiếu nại đã kết thúc và không nhận thêm giải trình.");
            response = new DisputeResponse { Id = request.SubmissionId, DisputeId = dispute.Id, AuthorUserId = userId, Content = content, CreatedAt = clock.UtcNow };
            context.DisputeResponses.Add(response);
            await context.SaveChangesAsync(cancellationToken);
        }
        await tx.CommitAsync(cancellationToken);
        return new DisputeResponseDto { Id = response.Id, DisputeId = response.DisputeId, AuthorUserId = userId, AuthorName = author.FullName, AuthorRole = author.Role, Content = response.Content, CreatedAt = response.CreatedAt };
    }
}
