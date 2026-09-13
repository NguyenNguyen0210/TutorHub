using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.LearningRecords.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.LearningRecords.CreateLearningRecord;

public class CreateLearningRecordCommandHandler : IRequestHandler<CreateLearningRecordCommand, LearningRecordDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateLearningRecordCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<LearningRecordDto> Handle(CreateLearningRecordCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserIdOrThrow();

        var session = await _context.Sessions
            .Include(s => s.Enrollment)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken);

        if (session == null)
        {
            throw new NotFoundException("Session", request.SessionId);
        }

        // F-14: tutor-write only, Completed sessions only, write-once. No earning gate.
        if (session.Enrollment.TutorProfile.UserId != userId)
        {
            throw new ForbiddenException("Only the session tutor can write the learning record.");
        }

        if (session.Status != SessionStatus.Completed)
        {
            throw new ConflictException($"Learning records can only be written for Completed sessions. Current status: '{session.Status}'.");
        }

        var exists = await _context.LearningRecords
            .AnyAsync(r => r.SessionId == request.SessionId, cancellationToken);

        if (exists)
        {
            throw new ConflictException("A learning record already exists for this session. Records are write-once.");
        }

        LearningRecord record;
        try
        {
            record = LearningRecord.Create(request.SessionId, session.Enrollment.TutorProfileId, request.Content);
        }
        catch (ArgumentException ex)
        {
            throw new BadRequestException(ex.Message);
        }

        _context.LearningRecords.Add(record);
        await _context.SaveChangesAsync(cancellationToken);

        return new LearningRecordDto(
            Id: record.Id,
            SessionId: record.SessionId,
            TutorProfileId: record.TutorProfileId,
            Content: record.Content,
            CreatedAt: record.CreatedAt
        );
    }
}
