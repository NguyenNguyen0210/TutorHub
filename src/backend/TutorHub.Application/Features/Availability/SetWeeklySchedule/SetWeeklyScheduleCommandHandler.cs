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

    public SetWeeklyScheduleCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AvailabilitySlotDto>> Handle(SetWeeklyScheduleCommand request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account.");
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
            .Select(s => new AvailabilitySlot
            {
                Id = Guid.NewGuid(),
                TutorProfileId = tutor.Id,
                DayOfWeek = s.DayOfWeek,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                IsActive = true
            })
            .ToList();

        _context.AvailabilitySlots.AddRange(newSlots);
        await _context.SaveChangesAsync(cancellationToken);

        return newSlots.Select(s => new AvailabilitySlotDto(
            s.Id,
            s.DayOfWeek,
            s.DayOfWeek.ToString(),
            s.StartTime,
            s.EndTime,
            s.IsActive
        )).ToList();
    }
}
