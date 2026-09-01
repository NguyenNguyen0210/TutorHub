using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.GetMyProfile;

public class GetMyProfileQueryHandler : IRequestHandler<GetMyProfileQuery, TutorMyProfileDto>
{
    private readonly IAppDbContext _context;

    public GetMyProfileQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<TutorMyProfileDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Category)
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account. You may need to submit an application first.");
        }

        var latestApplication = await _context.TutorApplications
            .AsNoTracking()
            .Where(a => a.UserId == request.UserId)
            .OrderBy(a =>
                a.Status == TutorApplicationStatus.Approved ? 0 :
                a.Status == TutorApplicationStatus.Pending ? 1 : 2)
            .ThenByDescending(a => a.SubmittedAt)
            .FirstOrDefaultAsync(cancellationToken);

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

        return new TutorMyProfileDto(
            ProfileId: tutor.Id,
            UserId: tutor.UserId,
            FullName: tutor.User.FullName,
            Email: tutor.User.Email,
            Phone: tutor.User.Phone,
            AvatarUrl: tutor.User.AvatarUrl,
            Bio: tutor.Bio,
            Education: tutor.Education,
            ExperienceYears: tutor.ExperienceYears,
            TeachingMode: tutor.TeachingMode.ToString(),
            Address: tutor.Address,
            Latitude: tutor.Latitude,
            Longitude: tutor.Longitude,
            HourlyRate: tutor.HourlyRate,
            RatingAvg: tutor.RatingAvg,
            TotalReviews: tutor.TotalReviews,
            Subjects: subjects,
            ApplicationStatus: latestApplication?.Status.ToString(),
            ApplicationRejectionReason: latestApplication?.RejectionReason
        );
    }
}
