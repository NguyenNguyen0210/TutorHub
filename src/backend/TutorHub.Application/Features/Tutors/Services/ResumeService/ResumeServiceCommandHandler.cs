using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.Services.DTOs;

namespace TutorHub.Application.Features.Tutors.Services.ResumeService;

public class ResumeServiceCommandHandler : IRequestHandler<ResumeServiceCommand, ServiceDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ResumeServiceCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ServiceDto> Handle(ResumeServiceCommand request, CancellationToken cancellationToken)
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
            throw new ForbiddenException("You do not have permission to resume this service.");
        }

        // Domain transition — throws unless Paused
        service.Resume();

        await _context.SaveChangesAsync(cancellationToken);

        return ServiceDtoMapper.FromService(
            service,
            service.Subject.Name,
            service.Subject.Category.Name
        );
    }
}
