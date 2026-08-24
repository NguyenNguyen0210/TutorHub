using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;

namespace TutorHub.Application.Features.Tutors.UpdateMyProfile;

public class UpdateMyProfileCommandHandler : IRequestHandler<UpdateMyProfileCommand, TutorProfileDto>
{
    private readonly IAppDbContext _context;

    public UpdateMyProfileCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<TutorProfileDto> Handle(UpdateMyProfileCommand request, CancellationToken cancellationToken)
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

        // Patch User fields
        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            tutor.User.FullName = request.FullName.Trim();
        }

        if (request.Phone != null)
        {
            tutor.User.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        }

        if (request.AvatarUrl != null)
        {
            tutor.User.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
        }

        // Patch Tutor Profile fields
        if (request.Bio != null)
        {
            tutor.Bio = request.Bio.Trim();
        }

        if (request.Education != null)
        {
            tutor.Education = request.Education.Trim();
        }

        if (request.ExperienceYears.HasValue)
        {
            tutor.ExperienceYears = request.ExperienceYears.Value;
        }

        if (request.HourlyRate.HasValue)
        {
            tutor.HourlyRate = request.HourlyRate.Value;
        }

        if (request.TeachingMode.HasValue)
        {
            tutor.TeachingMode = request.TeachingMode.Value;
        }

        if (request.Address != null)
        {
            tutor.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        }

        if (request.Latitude.HasValue)
        {
            tutor.Latitude = request.Latitude.Value;
        }

        if (request.Longitude.HasValue)
        {
            tutor.Longitude = request.Longitude.Value;
        }

        await _context.SaveChangesAsync(cancellationToken);

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
