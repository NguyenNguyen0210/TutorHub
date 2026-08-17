using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Tutors.DTOs;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Tutors.ApproveTutor;

public class ApproveTutorCommandHandler : IRequestHandler<ApproveTutorCommand, AdminTutorDto>
{
    private readonly IAppDbContext _context;

    public ApproveTutorCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminTutorDto> Handle(ApproveTutorCommand request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
            .FirstOrDefaultAsync(t => t.Id == request.TutorProfileId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        if (tutor.Status == TutorProfileStatus.Verified)
        {
            throw new BadRequestException("Tutor profile is already verified.");
        }

        tutor.Status = TutorProfileStatus.Verified;
        tutor.RejectionReason = null;
        tutor.ReviewedByAdminId = request.AdminId;
        tutor.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return new AdminTutorDto(
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
            tutor.Status.ToString(),
            tutor.RejectionReason,
            tutor.ReviewedByAdminId,
            tutor.ReviewedAt,
            tutor.RatingAvg,
            tutor.TotalReviews,
            tutor.User.CreatedAt,
            tutor.TutorSubjects.Select(ts => new TutorSubjectDto(
                ts.Id,
                ts.SubjectId,
                ts.Subject.Name,
                ts.Subject.Category,
                ts.OverridePrice,
                ts.IsActive
            )).ToList()
        );
    }
}
