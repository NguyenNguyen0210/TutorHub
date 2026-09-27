using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.PauseService;

public class PauseServiceCommandHandler : IRequestHandler<PauseServiceCommand, ServiceDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public PauseServiceCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ServiceDto> Handle(PauseServiceCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var service = await _context.Services
            .Include(s => s.TutorProfile)
            .Include(s => s.Subject)
                .ThenInclude(sub => sub.Category)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId, cancellationToken);

        if (service == null)
        {
            throw new NotFoundException("Service", request.ServiceId);
        }

        if (service.TutorProfile.UserId != userId)
        {
            throw new ForbiddenException("You do not have permission to pause this service.");
        }

        // Domain transition — throws unless Published
        service.Pause();

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceDtoMapper.FromService(
            service,
            service.Subject.Name,
            service.Subject.Category.Name
        );
    }
}
