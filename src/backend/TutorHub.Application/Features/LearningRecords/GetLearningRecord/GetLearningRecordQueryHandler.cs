using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.LearningRecords.DTOs;

namespace TutorHub.Application.Features.LearningRecords.GetLearningRecord;

public class GetLearningRecordQueryHandler : IRequestHandler<GetLearningRecordQuery, LearningRecordDto?>
{
    private readonly IAppDbContext _context;

    public GetLearningRecordQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<LearningRecordDto?> Handle(GetLearningRecordQuery request, CancellationToken cancellationToken)
    {
        var session = await _context.Sessions
            .Include(s => s.Enrollment)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // F-14: student or tutor participant read-only.
        if (session.Enrollment.StudentProfile.UserId != request.UserId &&
            session.Enrollment.TutorProfile.UserId != request.UserId)
        {
            throw new ForbiddenException("You do not have permission to view this learning record.");
        }

        var record = await _context.LearningRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.SessionId == request.SessionId, cancellationToken);

        if (record == null)
        {
            return null;
        }

        return new LearningRecordDto(
            Id: record.Id,
            SessionId: record.SessionId,
            TutorProfileId: record.TutorProfileId,
            Content: record.Content,
            CreatedAt: record.CreatedAt
        );
    }
}
