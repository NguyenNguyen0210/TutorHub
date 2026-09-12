using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Events;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Agreements.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Agreements.Commands.CreateCustomAgreement;

public class CreateCustomAgreementCommandHandler : IRequestHandler<CreateCustomAgreementCommand, CustomAgreementDto>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;

    public CreateCustomAgreementCommandHandler(IAppDbContext context, IClock clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<CustomAgreementDto> Handle(CreateCustomAgreementCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate Tutor Profile & Status (INV-AGREE-001)
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.UserId == request.TutorUserId, cancellationToken);

        if (tutor == null || tutor.User.Role != UserRole.Tutor)
        {
            throw new ForbiddenException("Only registered tutors can create custom agreements.");
        }

        if (tutor.User.Status != AccountStatus.Active)
        {
            throw new ForbiddenException("Only active tutors can create custom agreements.");
        }

        // 2. Validate Student Profile
        var student = await _context.StudentProfiles
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == request.StudentProfileId, cancellationToken);

        if (student == null)
        {
            throw new NotFoundException("StudentProfile", request.StudentProfileId);
        }

        if (student.UserId == tutor.UserId)
        {
            throw new BadRequestException("Tutors cannot create agreements with themselves.");
        }

        // 3. Validate Subject
        var subject = await _context.Subjects
            .FirstOrDefaultAsync(s => s.Id == request.SubjectId, cancellationToken);

        if (subject == null)
        {
            throw new NotFoundException("Subject", request.SubjectId);
        }

        // 4. Validate Service Provenance if provided (DEC-AGREE-004)
        Service? service = null;
        if (request.ServiceId.HasValue)
        {
            service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == request.ServiceId.Value, cancellationToken);

            if (service == null)
            {
                throw new NotFoundException("Service", request.ServiceId.Value);
            }

            if (service.TutorProfileId != tutor.Id)
            {
                throw new BadRequestException("The referenced service does not belong to the proposing tutor.");
            }

            if (service.Status != ServiceStatus.Published)
            {
                throw new BadRequestException("Custom agreements can only reference published services.");
            }

            if (service.SubjectId != request.SubjectId)
            {
                throw new BadRequestException("The subject must match the referenced service subject.");
            }
        }

        // 5. Validate Conversation Provenance if provided (INV-AGREE-002)
        if (request.ConversationId.HasValue)
        {
            var conversation = await _context.Conversations
                .FirstOrDefaultAsync(c => c.Id == request.ConversationId.Value, cancellationToken);

            if (conversation == null)
            {
                throw new NotFoundException("Conversation", request.ConversationId.Value);
            }

            if (conversation.TutorProfileId != tutor.Id || conversation.StudentProfileId != student.Id)
            {
                throw new BadRequestException("Conversation participants must match the agreement student and tutor.");
            }
        }

        var validityDays = request.ValidityDays <= 0 ? 7 : request.ValidityDays;
        var now = _clock.UtcNow;

        // 6. Instantiate Domain Agreement with Immutable Commercial Terms Snapshot (INV-AGREE-007)
        var agreement = new CustomAgreement
        {
            Id = Guid.NewGuid(),
            ServiceId = request.ServiceId,
            ConversationId = request.ConversationId,
            TutorProfileId = tutor.Id,
            StudentProfileId = student.Id,
            SubjectId = request.SubjectId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            TotalPrice = request.TotalPrice,
            TotalSessions = request.TotalSessions,
            SessionDurationMinutes = request.SessionDurationMinutes,
            TeachingMode = request.TeachingMode,
            Status = CustomAgreementStatus.Proposed,
            ExpiresAt = now.AddDays(validityDays),
            CreatedAt = now
        };

        _context.CustomAgreements.Add(agreement);

        // 7. Enqueue CustomOfferCreatedEvent Outbox Message atomically (INV-AGREE-013)
        _context.AddOutboxMessage(new CustomOfferCreatedEvent(
            agreement.Id,
            tutor.Id,
            student.Id,
            student.UserId,
            tutor.UserId,
            new MoneyDto(agreement.TotalPrice, "VND")
        ));

        await _context.SaveChangesAsync(cancellationToken);

        return new CustomAgreementDto(
            Id: agreement.Id,
            ServiceId: agreement.ServiceId,
            ServiceTitle: service?.Title,
            ConversationId: agreement.ConversationId,
            TutorProfileId: tutor.Id,
            TutorUserId: tutor.UserId,
            TutorName: tutor.User.FullName,
            StudentProfileId: student.Id,
            StudentUserId: student.UserId,
            StudentName: student.User.FullName,
            SubjectId: subject.Id,
            SubjectName: subject.Name,
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
