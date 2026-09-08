using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Bookings.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Agreements.Commands.CheckoutCustomAgreement;

public class CheckoutCustomAgreementCommandHandler : IRequestHandler<CheckoutCustomAgreementCommand, BookingDto>
{
    private readonly IAppDbContext _context;

    public CheckoutCustomAgreementCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<BookingDto> Handle(CheckoutCustomAgreementCommand request, CancellationToken cancellationToken)
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

        // 1. Granular Student Authorization (INV-AGREE-003)
        if (agreement.StudentProfile.UserId != request.StudentUserId)
        {
            throw new ForbiddenException("Only the designated student participant can checkout this custom agreement.");
        }

        // 2. Precursor Requirement: Agreement must be in 'Accepted' status (INV-AGREE-005, INV-AGREE-011)
        if (agreement.Status != CustomAgreementStatus.Accepted)
        {
            throw new ConflictException($"Agreement cannot be checked out in status '{agreement.Status}'. It must be in 'Accepted' status.");
        }

        // 3. Idempotency & Concurrency Protection (INV-AGREE-009, INV-AGREE-014)
        var existingBooking = await _context.Bookings
            .Include(b => b.StudentProfile).ThenInclude(s => s.User)
            .Include(b => b.TutorProfile).ThenInclude(t => t.User)
            .Include(b => b.Subject)
            .FirstOrDefaultAsync(b => b.CustomAgreementId == agreement.Id, cancellationToken);

        var now = DateTime.UtcNow;

        if (existingBooking != null)
        {
            // Wave 3: Paid is the only post-payment state; learning progress
            // lives on Enrollment, so a Paid booking means "already ordered".
            if (existingBooking.Status == BookingStatus.Paid)
            {
                throw new ConflictException("This custom agreement has already been paid and ordered.");
            }

            // If active holding, return existing booking idempotently
            if (existingBooking.Status == BookingStatus.Holding && existingBooking.HoldingExpiresAt > now)
            {
                return MapToDto(existingBooking);
            }

            // If expired holding, refresh the 15-minute hold window
            if (existingBooking.Status == BookingStatus.Holding && existingBooking.HoldingExpiresAt <= now)
            {
                existingBooking.HoldingExpiresAt = now.AddMinutes(15);
                await _context.SaveChangesAsync(cancellationToken);
                return MapToDto(existingBooking);
            }
        }

        // 4. Create Canonical Booking with Immutable Commercial Terms Snapshot (INV-AGREE-008, INV-AGREE-010)
        // DEC-S8-020: Enrollment.ServiceId is required, so a custom agreement without a
        // linked Service gets a hidden Unpublished snapshot Service (never listed publicly).
        Guid? bookingServiceId = agreement.ServiceId;
        if (!bookingServiceId.HasValue)
        {
            var hiddenService = new Service
            {
                Id = Guid.NewGuid(),
                TutorProfileId = agreement.TutorProfileId,
                SubjectId = agreement.SubjectId,
                Title = $"[Custom] {agreement.Title}",
                Description = agreement.Description,
                TotalSessions = agreement.TotalSessions,
                SessionDurationMinutes = agreement.SessionDurationMinutes,
                Price = agreement.TotalPrice,
                TeachingMode = agreement.TeachingMode,
                Status = ServiceStatus.Unpublished,
                CreatedAt = now
            };
            _context.Services.Add(hiddenService);
            bookingServiceId = hiddenService.Id;
        }

        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            CustomAgreementId = agreement.Id,
            ServiceId = bookingServiceId,
            StudentProfileId = agreement.StudentProfileId,
            TutorProfileId = agreement.TutorProfileId,
            SubjectId = agreement.SubjectId,
            TotalPrice = agreement.TotalPrice,
            TotalSessions = agreement.TotalSessions,
            SessionDurationMinutes = agreement.SessionDurationMinutes,
            TeachingMode = agreement.TeachingMode,
            Status = BookingStatus.Holding,
            HoldingExpiresAt = now.AddMinutes(15),
            CreatedAt = now
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync(cancellationToken);

        // Load navigations for complete DTO mapping
        booking.StudentProfile = agreement.StudentProfile;
        booking.TutorProfile = agreement.TutorProfile;
        booking.Subject = agreement.Subject;

        return MapToDto(booking);
    }

    private static BookingDto MapToDto(Booking b)
    {
        // F-23 (Đợt 4): centralized mapping (all call paths load full navs above).
        return BookingMapper.ToDto(b, transaction: null);
    }
}
