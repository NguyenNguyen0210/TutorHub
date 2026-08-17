using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Tutors.SubmitProfileReview;

public class SubmitProfileReviewCommandHandler : IRequestHandler<SubmitProfileReviewCommand, TutorProfileDto>
{
    private readonly IAppDbContext _context;

    public SubmitProfileReviewCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<TutorProfileDto> Handle(SubmitProfileReviewCommand request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account.");
        }

        if (tutor.Status == TutorProfileStatus.Verified)
        {
            throw new BadRequestException("Your profile is already verified.");
        }

        if (tutor.Status == TutorProfileStatus.PendingReview)
        {
            throw new BadRequestException("Your profile is already currently pending review.");
        }

        // Business Validation for submission completeness
        var validationErrors = new List<string>();

        if (string.IsNullOrWhiteSpace(tutor.Bio))
        {
            validationErrors.Add("Bio is required before submitting profile for review.");
        }

        if (string.IsNullOrWhiteSpace(tutor.Education))
        {
            validationErrors.Add("Education details are required before submitting profile for review.");
        }

        if (tutor.HourlyRate <= 0)
        {
            validationErrors.Add("Hourly rate must be greater than 0 before submitting profile for review.");
        }

        var hasActiveSubjects = tutor.TutorSubjects.Any(ts => ts.IsActive);
        if (!hasActiveSubjects)
        {
            validationErrors.Add("You must register at least one active subject before submitting profile for review.");
        }

        if (validationErrors.Any())
        {
            throw new BadRequestException("Profile is incomplete.", validationErrors);
        }

        // Transition to PendingReview
        tutor.Status = TutorProfileStatus.PendingReview;
        tutor.RejectionReason = null; // Clear previous rejection reason if any

        await _context.SaveChangesAsync(cancellationToken);

        var subjects = tutor.TutorSubjects
            .Select(ts => new TutorSubjectDto(
                ts.Id,
                ts.SubjectId,
                ts.Subject.Name,
                ts.Subject.Category,
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
