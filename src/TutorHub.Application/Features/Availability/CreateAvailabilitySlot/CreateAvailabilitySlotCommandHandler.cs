using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Availability.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Availability.CreateAvailabilitySlot;

public class CreateAvailabilitySlotCommandHandler : IRequestHandler<CreateAvailabilitySlotCommand, AvailabilitySlotDto>
{
    private readonly IAppDbContext _context;

    public CreateAvailabilitySlotCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AvailabilitySlotDto> Handle(CreateAvailabilitySlotCommand request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account.");
        }

        // Check for overlapping slots on the same DayOfWeek
        var existingSlots = await _context.AvailabilitySlots
            .Where(a => a.TutorProfileId == tutor.Id && a.DayOfWeek == request.DayOfWeek && a.IsActive)
            .ToListAsync(cancellationToken);

        var isOverlapping = existingSlots.Any(s =>
            request.StartTime < s.EndTime && s.StartTime < request.EndTime);

        if (isOverlapping)
        {
            throw new BadRequestException($"The requested slot ({request.StartTime:HH\\:mm} - {request.EndTime:HH\\:mm}) overlaps with an existing availability slot on {request.DayOfWeek}.");
        }

        var newSlot = new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            TutorProfileId = tutor.Id,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            IsActive = true
        };

        _context.AvailabilitySlots.Add(newSlot);
        await _context.SaveChangesAsync(cancellationToken);

        return new AvailabilitySlotDto(
            newSlot.Id,
            newSlot.DayOfWeek,
            newSlot.DayOfWeek.ToString(),
            newSlot.StartTime,
            newSlot.EndTime,
            newSlot.IsActive
        );
    }
}
