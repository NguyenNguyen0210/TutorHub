using MediatR;
using TutorHub.Application.Features.LearningRecords.DTOs;

namespace TutorHub.Application.Features.LearningRecords.GetLearningRecord;

public record GetLearningRecordQuery(
    Guid UserId,
    Guid SessionId
) : IRequest<LearningRecordDto?>;
