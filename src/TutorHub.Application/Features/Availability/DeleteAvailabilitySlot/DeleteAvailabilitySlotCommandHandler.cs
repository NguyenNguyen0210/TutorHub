using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

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

        _context.AvailabilitySlots.Remove(slot);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
