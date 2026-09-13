using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Agreements.DTOs;

namespace TutorHub.Application.Features.Agreements.Commands.AcceptCustomAgreement;

public class AcceptCustomAgreementCommandHandler : IRequestHandler<AcceptCustomAgreementCommand, CustomAgreementDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AcceptCustomAgreementCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<CustomAgreementDto> Handle(AcceptCustomAgreementCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var agreement = await _context.CustomAgreements
            .Include(a => a.TutorProfile).ThenInclude(t => t.User)
            .Include(a => a.StudentProfile).ThenInclude(s => s.User)
            .Include(a => a.Subject)
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.Id == request.AgreementId, cancellationToken);

        if (agreement == null)
        {
            throw new NotFoundException("CustomAgreement", request.AgreementId);
        }

        // 1. Granular Student Authorization (INV-AGREE-003)
        if (agreement.StudentProfile.UserId != userId)
        {
            throw new ForbiddenException("Only the designated student participant can accept this custom agreement.");
        }

        // 2. State machine transition & expiration guard (INV-AGREE-005, INV-AGREE-006, INV-AGREE-007)
        try
        {
            agreement.Accept(agreement.StudentProfileId);
        }
        catch (InvalidOperationException ex)
        {
            throw new ConflictException(ex.Message);
        }

        // 3. Atomically Enqueue CustomOfferAcceptedEvent Outbox Message (INV-AGREE-013)
        _context.AddOutboxMessage(new CustomOfferAcceptedEvent(
            agreement.Id,
            agreement.TutorProfileId,
            agreement.StudentProfileId,
            agreement.StudentProfile.UserId,
            agreement.TutorProfile.UserId
        ));

        await _context.SaveChangesAsync(cancellationToken);

        return new CustomAgreementDto(
            Id: agreement.Id,
            ServiceId: agreement.ServiceId,
            ServiceTitle: agreement.Service?.Title,
            ConversationId: agreement.ConversationId,
            TutorProfileId: agreement.TutorProfileId,
            TutorUserId: agreement.TutorProfile.UserId,
            TutorName: agreement.TutorProfile.User.FullName,
            StudentProfileId: agreement.StudentProfileId,
            StudentUserId: agreement.StudentProfile.UserId,
            StudentName: agreement.StudentProfile.User.FullName,
            SubjectId: agreement.SubjectId,
            SubjectName: agreement.Subject.Name,
            Title: agreement.Title,
            Description: agreement.Description,
            TotalPrice: agreement.TotalPrice,
            TotalSessions: agreement.TotalSessions,
            SessionDurationMinutes: agreement.SessionDurationMinutes,
            TeachingMode: agreement.TeachingMode,
            Status: agreement.Status,
            ExpiresAt: agreement.ExpiresAt,
            CreatedAt: agreement.CreatedAt,
            AcceptedAt: agreement.AcceptedAt,
            RejectedAt: agreement.RejectedAt,
            RejectionReason: agreement.RejectionReason,
            CancelledAt: agreement.CancelledAt,
            CancellationReason: agreement.CancellationReason,
            BookingId: null
        );
    }
}
