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

        var canonicalTimeZone = TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, canonicalTimeZone);
        var todayLocal = DateOnly.FromDateTime(nowLocal);
        var nowTime = TimeOnly.FromDateTime(nowLocal);

        var fromDate = request.FromDate ?? todayLocal;
        if (fromDate < todayLocal)
        {
            fromDate = todayLocal;
        }

        var toDate = request.ToDate ?? fromDate.AddDays(7);
        if (toDate < fromDate)
        {
            toDate = fromDate.AddDays(7);
        }

        // Fetch tutor's active weekly availability slots (configured in localized canonical timezone)
        var weeklySlots = await _context.AvailabilitySlots
            .AsNoTracking()
            .Where(a => a.TutorProfileId == tutor.Id && a.IsActive)
            .OrderBy(a => a.StartTime)
            .ToListAsync(cancellationToken);

        // Convert localized date boundaries to UTC for querying persisted sessions
        var startDateTimeLocal = fromDate.ToDateTime(TimeOnly.MinValue);
        var endDateTimeLocal = toDate.ToDateTime(TimeOnly.MaxValue);
        var startDateTimeUtc = TimeZoneInfo.ConvertTimeToUtc(startDateTimeLocal, canonicalTimeZone);
        var endDateTimeUtc = TimeZoneInfo.ConvertTimeToUtc(endDateTimeLocal, canonicalTimeZone);

        var activeSessions = await _context.Sessions
            .AsNoTracking()
            .Where(s => s.Enrollment.TutorProfileId == tutor.Id &&
                        s.Status == SessionStatus.Scheduled &&
                        s.StartAt.HasValue && s.EndAt.HasValue &&
                        s.StartAt.Value <= endDateTimeUtc && s.EndAt.Value >= startDateTimeUtc)
            .OrderBy(s => s.StartAt)
            .ToListAsync(cancellationToken);

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

            // Initial available intervals for this day (in tutor local time)
            var availableIntervals = daySlots.Select(s => (Start: s.StartTime, End: s.EndTime)).ToList();

            // Find sessions that overlap with this calendar date in local canonical timezone
            var bookedSlots = new List<TimeRangeDto>();

            foreach (var session in activeSessions)
            {
                var sStartLocal = TimeZoneInfo.ConvertTimeFromUtc(session.StartAt!.Value, canonicalTimeZone);
                var sEndLocal = TimeZoneInfo.ConvertTimeFromUtc(session.EndAt!.Value, canonicalTimeZone);

                var sessionStartDate = DateOnly.FromDateTime(sStartLocal);
                var sessionEndDate = DateOnly.FromDateTime(sEndLocal);

                // Check if session touches this calendar date
                if (sessionStartDate <= date && sessionEndDate >= date)
                {
                    var sStart = sessionStartDate < date ? TimeOnly.MinValue : TimeOnly.FromDateTime(sStartLocal);
                    var sEnd = sessionEndDate > date ? TimeOnly.MaxValue : TimeOnly.FromDateTime(sEndLocal);

                    if (sStart < sEnd)
                    {
                        bookedSlots.Add(new TimeRangeDto(sStart, sEnd));
                        availableIntervals = SubtractInterval(availableIntervals, sStart, sEnd);
                    }
                }
            }

            // Filter out past time if current date is today
            if (date == todayLocal)
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
