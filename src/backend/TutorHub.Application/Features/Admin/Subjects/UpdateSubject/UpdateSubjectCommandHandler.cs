using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Admin.Subjects.UpdateSubject;

public class UpdateSubjectCommandHandler : IRequestHandler<UpdateSubjectCommand, AdminSubjectDto>
{
    private readonly IAppDbContext _context;

    public UpdateSubjectCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminSubjectDto> Handle(UpdateSubjectCommand request, CancellationToken cancellationToken)
    {
        var subject = await _context.Subjects
            .Include(s => s.TutorSubjects)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (subject == null)
        {
            throw new NotFoundException("Subject", request.Id);
        }

        // 1. Verify Target Category exists
        var targetCategory = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken);

        if (targetCategory == null)
        {
            throw new NotFoundException("Category", request.CategoryId);
        }

        // 2. Rule: Cannot move or activate subject in an inactive category
        if (!targetCategory.IsActive && request.IsActive)
        {
            throw new ConflictException("Cannot move or activate subject in an inactive category.");
        }

        var normalizedName = request.Name.Trim();

        // 3. Case-insensitive uniqueness check in target category
        var duplicate = await _context.Subjects
            .AnyAsync(s => s.Id != request.Id && s.CategoryId == request.CategoryId && s.Name.ToLower() == normalizedName.ToLower(), cancellationToken);

        if (duplicate)
        {
            throw new ConflictException("Subject name already exists in this category.");
        }

        subject.Name = normalizedName;
        subject.CategoryId = targetCategory.Id;
        subject.IsActive = request.IsActive;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            var innerMsg = ex.InnerException?.Message ?? string.Empty;
            if (innerMsg.Contains("IX_Subjects_Name_CategoryId") || innerMsg.Contains("23505"))
            {
                throw new ConflictException("Subject name already exists in this category.");
            }
            throw;
        }

        var bookingsCount = await _context.Bookings.CountAsync(b => b.SubjectId == subject.Id, cancellationToken);

        return new AdminSubjectDto(
            subject.Id,
            subject.Name,
            targetCategory.Id,
            targetCategory.Name,
            subject.IsActive,
            subject.TutorSubjects.Count,
            bookingsCount
        );
    }
}
