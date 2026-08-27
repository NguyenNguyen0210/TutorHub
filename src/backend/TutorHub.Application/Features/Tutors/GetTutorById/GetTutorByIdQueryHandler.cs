using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.GetTutorById;

public class GetTutorByIdQueryHandler : IRequestHandler<GetTutorByIdQuery, TutorProfileDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetTutorByIdQueryHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<TutorProfileDto> Handle(GetTutorByIdQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .AsNoTracking()
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Category)
            .FirstOrDefaultAsync(t => t.Id == request.TutorProfileId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        // Access control:
        // If not Verified, only Admin or the Tutor themselves can view the profile
        var isOwner = _currentUserService.UserId.HasValue && _currentUserService.UserId.Value == tutor.UserId;
        var isAdmin = string.Equals(_currentUserService.Role, "Admin", StringComparison.OrdinalIgnoreCase);

        if (tutor.Status != TutorProfileStatus.Verified && !isOwner && !isAdmin)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        var subjects = tutor.TutorSubjects
            .Where(ts => isOwner || isAdmin || ts.IsActive)
            .Select(ts => new TutorSubjectDto(
                ts.Id,
                ts.SubjectId,
                ts.Subject.Name,
                ts.Subject.CategoryId,
                ts.Subject.Category.Name,
                ts.OverridePrice,
                ts.IsActive
            ))
            .ToList();

        return new TutorProfileDto(
            tutor.Id,
            tutor.UserId,
            tutor.User.FullName,
            tutor.User.Email,
            tutor.User.Phone,
            tutor.User.AvatarUrl,
            tutor.Bio,
            tutor.Education,
            tutor.ExperienceYears,
            tutor.HourlyRate,
            tutor.TeachingMode.ToString(),
            tutor.Address,
            tutor.Latitude,
            tutor.Longitude,
            tutor.Status.ToString(),
            tutor.RejectionReason,
            tutor.RatingAvg,
            tutor.TotalReviews,
            subjects
        );
    }
}
