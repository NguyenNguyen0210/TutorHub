using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.GetMyProfile;

public class GetMyProfileQueryHandler : IRequestHandler<GetMyProfileQuery, TutorProfileDto>
{
    private readonly IAppDbContext _context;

    public GetMyProfileQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<TutorProfileDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Category)
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account.");
        }

        var subjects = tutor.TutorSubjects
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
