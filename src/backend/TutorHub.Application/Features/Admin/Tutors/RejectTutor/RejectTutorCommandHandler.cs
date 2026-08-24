using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Tutors.DTOs;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Tutors.RejectTutor;

public class RejectTutorCommandHandler : IRequestHandler<RejectTutorCommand, AdminTutorDto>
{
    private readonly IAppDbContext _context;

    public RejectTutorCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminTutorDto> Handle(RejectTutorCommand request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.TutorSubjects)
                .ThenInclude(ts => ts.Subject)
                    .ThenInclude(s => s.Category)
            .FirstOrDefaultAsync(t => t.Id == request.TutorProfileId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("TutorProfile", request.TutorProfileId);
        }

        tutor.Status = TutorProfileStatus.Rejected;
        tutor.RejectionReason = request.Reason.Trim();
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
                ts.Subject.CategoryId,
                ts.Subject.Category.Name,
                ts.OverridePrice,
                ts.IsActive
            )).ToList()
        );
    }
}
