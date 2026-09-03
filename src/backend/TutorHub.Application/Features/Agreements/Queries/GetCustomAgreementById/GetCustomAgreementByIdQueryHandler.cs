using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Agreements.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Agreements.Queries.GetCustomAgreementById;

public class GetCustomAgreementByIdQueryHandler : IRequestHandler<GetCustomAgreementByIdQuery, CustomAgreementDto>
{
    private readonly IAppDbContext _context;

    public GetCustomAgreementByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<CustomAgreementDto> Handle(GetCustomAgreementByIdQuery request, CancellationToken cancellationToken)
    {
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

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", request.UserId);
        }

        // Granular Authorization (Participant or Admin only)
        bool isStudent = agreement.StudentProfile.UserId == request.UserId;
        bool isTutor = agreement.TutorProfile.UserId == request.UserId;
        bool isAdmin = user.Role == UserRole.Admin;

        if (!isStudent && !isTutor && !isAdmin)
        {
            throw new ForbiddenException("You are not authorized to view this custom agreement.");
        }

        // Lazy expiration check (DEC-AGREE-001)
        var oldStatus = agreement.Status;
        agreement.CheckAndApplyExpiration();
        if (agreement.Status != oldStatus)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Trace resulting booking if checked out (INV-AGREE-012)
        var booking = await _context.Bookings
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.CustomAgreementId == agreement.Id, cancellationToken);

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
            BookingId: booking?.Id
        );
    }
}
