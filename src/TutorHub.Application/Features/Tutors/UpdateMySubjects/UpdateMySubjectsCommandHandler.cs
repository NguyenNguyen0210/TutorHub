using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Tutors.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Tutors.UpdateMySubjects;

public class UpdateMySubjectsCommandHandler : IRequestHandler<UpdateMySubjectsCommand, List<TutorSubjectDto>>
{
    private readonly IAppDbContext _context;

    public UpdateMySubjectsCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<TutorSubjectDto>> Handle(UpdateMySubjectsCommand request, CancellationToken cancellationToken)
    {
        var tutor = await _context.TutorProfiles
            .Include(t => t.TutorSubjects)
            .FirstOrDefaultAsync(t => t.UserId == request.UserId, cancellationToken);

        if (tutor == null)
        {
            throw new NotFoundException("Tutor profile not found for this user account.");
        }

        // Validate that all subject IDs exist in the system
        var requestedSubjectIds = request.Subjects.Select(s => s.SubjectId).Distinct().ToList();
        var existingSubjects = await _context.Subjects
            .Where(s => requestedSubjectIds.Contains(s.Id) && s.IsActive)
            .ToListAsync(cancellationToken);

        var existingSubjectIds = existingSubjects.Select(s => s.Id).ToHashSet();
        var invalidSubjectIds = requestedSubjectIds.Where(id => !existingSubjectIds.Contains(id)).ToList();

        if (invalidSubjectIds.Any())
        {
            throw new BadRequestException($"The following subject IDs are invalid or inactive: {string.Join(", ", invalidSubjectIds)}");
        }

        // Synchronize tutor subjects
        var existingTutorSubjectsMap = tutor.TutorSubjects.ToDictionary(ts => ts.SubjectId);

        foreach (var item in request.Subjects)
        {
            if (existingTutorSubjectsMap.TryGetValue(item.SubjectId, out var existingTs))
            {
                existingTs.OverridePrice = item.OverridePrice;
                existingTs.IsActive = item.IsActive;
            }
            else
            {
                var newTs = new TutorSubject
                {
                    Id = Guid.NewGuid(),
                    TutorProfileId = tutor.Id,
                    SubjectId = item.SubjectId,
                    OverridePrice = item.OverridePrice,
                    IsActive = item.IsActive
                };
                _context.TutorSubjects.Add(newTs);
            }
        }

        // Remove subjects not included in the request
        var requestedIdsSet = request.Subjects.Select(s => s.SubjectId).ToHashSet();
        var subjectsToRemove = tutor.TutorSubjects.Where(ts => !requestedIdsSet.Contains(ts.SubjectId)).ToList();
        foreach (var toRemove in subjectsToRemove)
        {
            _context.TutorSubjects.Remove(toRemove);
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Fetch refreshed subjects with metadata
        var updatedSubjects = await _context.TutorSubjects
            .Include(ts => ts.Subject)
            .Where(ts => ts.TutorProfileId == tutor.Id)
            .ToListAsync(cancellationToken);

        return updatedSubjects
            .Select(ts => new TutorSubjectDto(
                ts.Id,
                ts.SubjectId,
                ts.Subject.Name,
                ts.Subject.Category,
                ts.OverridePrice,
                ts.IsActive
            ))
            .ToList();
    }
}
