using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.StudentWallets.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.StudentWallets.Commands.AdminRejectTopUp;

public class AdminRejectTopUpCommandHandler : IRequestHandler<AdminRejectTopUpCommand, TopUpRequestDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IClock _clock;

    public AdminRejectTopUpCommandHandler(IAppDbContext context, ICurrentUserService currentUserService, IClock clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _clock = clock;
    }

    public async Task<TopUpRequestDto> Handle(AdminRejectTopUpCommand request, CancellationToken cancellationToken)
    {
        var adminId = _currentUserService.UserIdOrThrow();
        var now = _clock.UtcNow;

        var topUp = await _context.TopUpRequests
            .Include(r => r.StudentWallet)
                .ThenInclude(w => w.StudentProfile)
            .FirstOrDefaultAsync(r => r.Id == request.TopUpRequestId, cancellationToken);

        if (topUp == null)
        {
            throw new NotFoundException(nameof(TopUpRequest), request.TopUpRequestId);
        }

        if (topUp.Status != TopUpRequestStatus.Pending)
        {
            throw new BadRequestException($"Cannot reject top-up request in '{topUp.Status}' status. Must be Pending.");
        }

        topUp.Reject(adminId, request.Reason, now);

        // Emit outbox business event
        _context.AddOutboxMessage(new StudentTopUpRejectedEvent(
            topUp.Id,
            topUp.StudentWallet.StudentProfileId,
            topUp.StudentWallet.StudentProfile.UserId,
            request.Reason,
            adminId,
            Guid.NewGuid(),
            1,
            now
        ));

        await _context.SaveChangesAsync(cancellationToken);

        return new TopUpRequestDto
        {
            Id = topUp.Id,
            StudentWalletId = topUp.StudentWalletId,
            Amount = topUp.Amount,
            TransferReference = topUp.TransferReference,
            Status = topUp.Status,
            RequestedAt = topUp.RequestedAt,
            ProcessedAt = topUp.ProcessedAt,
            RejectionReason = topUp.RejectionReason,
            AdminNote = topUp.AdminNote
        };
    }
}
