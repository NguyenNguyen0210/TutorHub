using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.GetTutorBusySlots;

public class GetTutorBusySlotsQueryHandler : IRequestHandler<GetTutorBusySlotsQuery, List<TutorBusySlotDto>>
{
    private const int DefaultRangeDays = 14;
    private const int MaxRangeDays = 30;

    private readonly IAppDbContext _context;
    private readonly IClock _clock;

    public GetTutorBusySlotsQueryHandler(IAppDbContext context, IClock clock)
    {
        _context = context;
        _clock = clock;
    }

    public async Task<List<TutorBusySlotDto>> Handle(GetTutorBusySlotsQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(tp => tp.Id == request.TutorProfileId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        var isApproved = await _context.TutorApplications
            .AsNoTracking()
            .AnyAsync(a => a.UserId == tutor.UserId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

        if (!isApproved)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        var now = _clock.UtcNow;
        var from = request.From?.ToUniversalTime() ?? now;

        if (from < now.AddDays(-1))
        {
            from = now.AddDays(-1);
        }

        var maxAllowedTo = from.AddDays(MaxRangeDays);
        var to = request.To?.ToUniversalTime() ?? from.AddDays(DefaultRangeDays);

        if (to <= from)
        {
            to = from.AddDays(DefaultRangeDays);
        }
        else if (to > maxAllowedTo)
        {
            to = maxAllowedTo;
        }

        var busySlots = await _context.Sessions
            .AsNoTracking()
            .Where(s => s.Enrollment.TutorProfileId == request.TutorProfileId &&
                        s.Status == SessionStatus.Scheduled &&
                        s.StartAt.HasValue &&
                        s.EndAt.HasValue &&
                        s.EndAt.Value > from &&
                        s.StartAt.Value < to)
            .OrderBy(s => s.StartAt)
            .Select(s => new TutorBusySlotDto
            {
                StartAt = s.StartAt!.Value,
                EndAt = s.EndAt!.Value
            })
            .ToListAsync(cancellationToken);

        return busySlots;
    }
}

