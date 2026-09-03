using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Availability.DeleteAvailabilitySlot;

public class DeleteAvailabilitySlotCommandHandler : IRequestHandler<DeleteAvailabilitySlotCommand, bool>
{
    private readonly IAppDbContext _context;

    public DeleteAvailabilitySlotCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteAvailabilitySlotCommand request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account.");
        }

        var slot = await _context.AvailabilitySlots
            .FirstOrDefaultAsync(a => a.Id == request.SlotId && a.TutorProfileId == tutor.Id, cancellationToken);

        if (slot == null)
        {
            throw new NotFoundException("AvailabilitySlot", request.SlotId);
        }

        // 1. Acquire PostgreSQL row-level lock on TutorProfile when running on Npgsql (INV-AVAIL-008)
        if (_context.Database?.ProviderName != null &&
            _context.Database.ProviderName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT 1 FROM \"TutorProfiles\" WHERE \"Id\" = {tutor.Id} FOR UPDATE;",
                cancellationToken);
        }

        // 2. Fetch concrete future scheduled sessions for this tutor (INV-AVAIL-005)
        var nowUtc = DateTime.UtcNow;
        var futureScheduledSessions = await _context.Sessions
            .Where(s => s.Enrollment.TutorProfileId == tutor.Id &&
                        s.Status == SessionStatus.Scheduled &&
                        s.StartAt.HasValue && s.StartAt.Value >= nowUtc)
            .ToListAsync(cancellationToken);

        // 3. Evaluate proposed schedule excluding the slot to be deleted
        var currentSlots = await _context.AvailabilitySlots
            .Where(a => a.TutorProfileId == tutor.Id && a.IsActive)
            .ToListAsync(cancellationToken);

        var proposedSchedule = currentSlots
            .Where(s => s.Id != slot.Id)
            .Select(s => (s.DayOfWeek, s.StartTime, s.EndTime))
            .ToList();

        Availability.Common.AvailabilityMutationPolicy.EnsureNoFutureScheduledSessionsUncovered(
            proposedSchedule,
            futureScheduledSessions);

        // 4. Delete the slot and persist
        _context.AvailabilitySlots.Remove(slot);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
