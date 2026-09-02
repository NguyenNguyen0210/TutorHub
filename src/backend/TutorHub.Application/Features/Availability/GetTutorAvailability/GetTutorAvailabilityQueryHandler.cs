using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Availability.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Availability.GetTutorAvailability;

public class GetTutorAvailabilityQueryHandler : IRequestHandler<GetTutorAvailabilityQuery, TutorAvailabilityDto>
{
    private readonly IAppDbContext _context;

    public GetTutorAvailabilityQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<TutorAvailabilityDto> Handle(GetTutorAvailabilityQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == request.TutorProfileId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        var isApprovedTutor = await _context.TutorApplications
            .AnyAsync(a => a.UserId == tutor.UserId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

        if (!isApprovedTutor)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var fromDate = request.FromDate ?? today;
        if (fromDate < today)
        {
            fromDate = today;
        }

        var toDate = request.ToDate ?? fromDate.AddDays(7);
        if (toDate < fromDate)
        {
            toDate = fromDate.AddDays(7);
        }

        // Fetch tutor's active weekly availability slots
        var weeklySlots = await _context.AvailabilitySlots
            .AsNoTracking()
            .Where(a => a.TutorProfileId == tutor.Id && a.IsActive)
            .OrderBy(a => a.StartTime)
            .ToListAsync(cancellationToken);

        // Fetch active scheduled sessions in range
        var startDateTimeUtc = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var endDateTimeUtc = toDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var activeSessions = await _context.Sessions
            .AsNoTracking()
            .Where(s => s.Enrollment.TutorProfileId == tutor.Id &&
                        s.Status == SessionStatus.Scheduled &&
                        s.StartAt.HasValue && s.EndAt.HasValue &&
                        s.StartAt.Value <= endDateTimeUtc && s.EndAt.Value >= startDateTimeUtc)
            .OrderBy(s => s.StartAt)
            .ToListAsync(cancellationToken);

        var nowTime = TimeOnly.FromDateTime(DateTime.UtcNow);
        var daysResult = new List<DailyAvailabilityDto>();

        for (var date = fromDate; date <= toDate; date = date.AddDays(1))
        {
            var dayOfWeek = date.DayOfWeek;
            var daySlots = weeklySlots.Where(s => s.DayOfWeek == dayOfWeek).ToList();

            if (!daySlots.Any())
            {
                daysResult.Add(new DailyAvailabilityDto(
                    Date: date,
                    DayOfWeek: dayOfWeek,
                    DayOfWeekName: dayOfWeek.ToString(),
                    HasAvailableSlots: false,
                    AvailableSlots: new List<TimeRangeDto>(),
                    BookedSlots: new List<TimeRangeDto>()
                ));
                continue;
            }

            // Initial available intervals for this day
            var availableIntervals = daySlots.Select(s => (Start: s.StartTime, End: s.EndTime)).ToList();

            // Find sessions on this specific calendar date
            var dayStartUtc = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var dayEndUtc = date.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

            var daySessions = activeSessions
                .Where(s => s.StartAt!.Value < dayEndUtc && s.EndAt!.Value > dayStartUtc)
                .ToList();

            var bookedSlots = new List<TimeRangeDto>();

            foreach (var session in daySessions)
            {
                // Clamp session start/end to this day
                var sStart = session.StartAt!.Value < dayStartUtc ? TimeOnly.MinValue : TimeOnly.FromDateTime(session.StartAt.Value);
                var sEnd = session.EndAt!.Value > dayEndUtc ? TimeOnly.MaxValue : TimeOnly.FromDateTime(session.EndAt.Value);

                bookedSlots.Add(new TimeRangeDto(sStart, sEnd));

                // Subtract session interval from available intervals
                availableIntervals = SubtractInterval(availableIntervals, sStart, sEnd);
            }

            // Filter out past time if current date is today
            if (date == today)
            {
                availableIntervals = availableIntervals
                    .Where(i => i.End > nowTime)
                    .Select(i => (Start: i.Start < nowTime ? nowTime : i.Start, End: i.End))
                    .Where(i => i.Start < i.End)
                    .ToList();
            }

            var availableDtoList = availableIntervals
                .Select(i => new TimeRangeDto(i.Start, i.End))
                .ToList();

            daysResult.Add(new DailyAvailabilityDto(
                Date: date,
                DayOfWeek: dayOfWeek,
                DayOfWeekName: dayOfWeek.ToString(),
                HasAvailableSlots: availableDtoList.Any(),
                AvailableSlots: availableDtoList,
                BookedSlots: bookedSlots
            ));
        }

        return new TutorAvailabilityDto(
            TutorProfileId: tutor.Id,
            FromDate: fromDate,
            ToDate: toDate,
            Days: daysResult
        );
    }

    private static List<(TimeOnly Start, TimeOnly End)> SubtractInterval(
        List<(TimeOnly Start, TimeOnly End)> source,
        TimeOnly subtractStart,
        TimeOnly subtractEnd)
    {
        var result = new List<(TimeOnly Start, TimeOnly End)>();

        foreach (var interval in source)
        {
            // Case 1: No overlap
            if (subtractEnd <= interval.Start || subtractStart >= interval.End)
            {
                result.Add(interval);
            }
            // Case 2: Subtraction covers entire interval
            else if (subtractStart <= interval.Start && subtractEnd >= interval.End)
            {
                // Completely removed
            }
            // Case 3: Subtraction splits interval into two
            else if (subtractStart > interval.Start && subtractEnd < interval.End)
            {
                result.Add((interval.Start, subtractStart));
                result.Add((subtractEnd, interval.End));
            }
            // Case 4: Overlaps start of interval
            else if (subtractStart <= interval.Start && subtractEnd < interval.End)
            {
                result.Add((subtractEnd, interval.End));
            }
            // Case 5: Overlaps end of interval
            else if (subtractStart > interval.Start && subtractEnd >= interval.End)
            {
                result.Add((interval.Start, subtractStart));
            }
        }

        return result;
    }
}
