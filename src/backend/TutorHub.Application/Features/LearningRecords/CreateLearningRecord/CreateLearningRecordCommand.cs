using MediatR;
using TutorHub.Application.Features.LearningRecords.DTOs;

namespace TutorHub.Application.Features.LearningRecords.CreateLearningRecord;

public record CreateLearningRecordCommand(
    Guid SessionId,
    string Content
) : IRequest<LearningRecordDto>;
