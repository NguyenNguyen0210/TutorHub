using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Availability.DTOs;

namespace TutorHub.Application.Features.Availability.GetMyAvailabilitySlots;

public class GetMyAvailabilitySlotsQueryHandler : IRequestHandler<GetMyAvailabilitySlotsQuery, List<AvailabilitySlotDto>>
{
    private readonly IAppDbContext _context;

    public GetMyAvailabilitySlotsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AvailabilitySlotDto>> Handle(GetMyAvailabilitySlotsQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account.");
        }

        var slots = await _context.AvailabilitySlots
            .AsNoTracking()
            .Where(a => a.TutorProfileId == tutor.Id)
            .OrderBy(a => a.DayOfWeek)
            .ThenBy(a => a.StartTime)
            .ToListAsync(cancellationToken);

        return slots.Select(s => new AvailabilitySlotDto(
            s.Id,
            s.DayOfWeek,
            s.DayOfWeek.ToString(),
            s.StartTime,
            s.EndTime,
            s.IsActive
        )).ToList();
    }
}
