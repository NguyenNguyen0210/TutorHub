using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Availability.Common;
using TutorHub.Application.Features.Availability.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Availability.SetWeeklySchedule;

public class SetWeeklyScheduleCommandHandler : IRequestHandler<SetWeeklyScheduleCommand, List<AvailabilitySlotDto>>
{
    private readonly IAppDbContext _context;
    private readonly IClock _clock;

    public SetWeeklyScheduleCommandHandler(IAppDbContext context, IClock clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<List<AvailabilitySlotDto>> Handle(SetWeeklyScheduleCommand request, CancellationToken cancellationToken)
    {
        await using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account.");
        }

        // 1. Acquire row-level lock on TutorProfile (FOR UPDATE - INV-AVAIL-008)
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM \"TutorProfiles\" WHERE \"Id\" = {tutor.Id} FOR UPDATE;",
            cancellationToken);

        // 2. Fetch concrete future scheduled sessions for this tutor (INV-AVAIL-005)
        var nowUtc = _clock.UtcNow;
        var futureScheduledSessions = await _context.Sessions
            .Where(s => s.Enrollment.TutorProfileId == tutor.Id &&
                        s.Status == SessionStatus.Scheduled &&
                        s.StartAt.HasValue && s.StartAt.Value >= nowUtc)
            .ToListAsync(cancellationToken);

        // 3. Evaluate proposed schedule against future scheduled sessions (Patch A & Patch D)
        var proposedSchedule = request.Schedule
            .Select(s => (s.DayOfWeek, s.StartTime, s.EndTime))
            .ToList();

        AvailabilityMutationPolicy.EnsureNoFutureScheduledSessionsUncovered(
            proposedSchedule,
            futureScheduledSessions);

        // 4. Atomically replace existing slots with the desired schedule (Patch A, INV-AVAIL-006)
        var existingSlots = await _context.AvailabilitySlots
            .Where(a => a.TutorProfileId == tutor.Id)
            .ToListAsync(cancellationToken);

        _context.AvailabilitySlots.RemoveRange(existingSlots);

        var newSlots = request.Schedule
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .Select(s =>
            {
                // F-23: validated construction lives in the domain.
                try
                {
                    return AvailabilitySlot.Create(tutor.Id, s.DayOfWeek, s.StartTime, s.EndTime);
                }
                catch (ArgumentException ex)
                {
                    throw new BadRequestException(ex.Message);
                }
            })
            .ToList();

        _context.AvailabilitySlots.AddRange(newSlots);
        await _context.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        return newSlots.Select(s => new AvailabilitySlotDto(
            s.Id,
            s.DayOfWeek,
            s.DayOfWeek.ToString(),
            s.StartTime,
            s.EndTime,
            s.IsActive
        )).ToList();
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
