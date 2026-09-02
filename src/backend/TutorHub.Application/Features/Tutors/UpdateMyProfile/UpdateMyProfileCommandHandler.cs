using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.UpdateMyProfile;

public class UpdateMyProfileCommandHandler : IRequestHandler<UpdateMyProfileCommand, TutorMyProfileDto>
{
    private readonly IAppDbContext _context;

    public UpdateMyProfileCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<TutorMyProfileDto> Handle(UpdateMyProfileCommand request, CancellationToken cancellationToken)
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

        var isApproved = await _context.TutorApplications
            .AnyAsync(a => a.UserId == request.UserId && a.Status == TutorApplicationStatus.Approved, cancellationToken);

        if (!isApproved)
        {
            throw new BadRequestException("Your Tutor application is not yet approved. You cannot update profile until approved.");
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
