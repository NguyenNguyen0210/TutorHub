using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Subjects.DTOs;

namespace TutorHub.Application.Features.Admin.Subjects.RestoreSubject;

public class RestoreSubjectCommandHandler : IRequestHandler<RestoreSubjectCommand, AdminSubjectDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public RestoreSubjectCommandHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<AdminSubjectDto> Handle(RestoreSubjectCommand request, CancellationToken cancellationToken)
    {
        var subject = await _context.Subjects
            .IgnoreQueryFilters()
            .Include(s => s.Category)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (subject == null)
        {
            throw new NotFoundException("Subject", request.Id);
        }

        if (!subject.IsDeleted)
        {
            throw new ConflictException("Subject is not in trash / not deleted.");
        }

        // Parent category must be active (not soft deleted)
        var parentCategory = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == subject.CategoryId, cancellationToken);

        if (parentCategory == null)
        {
            var isParentDeleted = await _context.Categories
                .IgnoreQueryFilters()
                .AnyAsync(c => c.Id == subject.CategoryId && c.IsDeleted, cancellationToken);

            if (isParentDeleted)
            {
                throw new ConflictException("Cannot restore subject because its parent category is currently deleted. Please restore the category first.");
            }

            throw new NotFoundException("Category", subject.CategoryId);
        }

        var duplicateActive = await _context.Subjects
            .AnyAsync(s => s.CategoryId == subject.CategoryId && s.Name.ToLower() == subject.Name.ToLower() && s.Id != subject.Id, cancellationToken);

        if (duplicateActive)
        {
            throw new ConflictException($"An active subject with the name '{subject.Name}' already exists in this category.");
        }

        var userId = _currentUserService.UserIdOrThrow();

        subject.Restore();

        await _auditLogService.LogAsync(
            action: "SUBJECT_RESTORED",
            entityName: "Subject",
            entityId: subject.Id.ToString(),
            userId: userId,
            oldValues: new { IsDeleted = true, subject.DeletedAt, subject.DeleteReason },
            newValues: new { IsDeleted = false },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        var tutorsCount = await _context.TutorSubjects
            .CountAsync(ts => ts.SubjectId == subject.Id, cancellationToken);
        var bookingsCount = await _context.Bookings
            .CountAsync(b => b.SubjectId == subject.Id, cancellationToken);

        return new AdminSubjectDto(
            subject.Id,
            subject.Name,
            subject.CategoryId,
            parentCategory.Name,
            subject.IsActive,
            tutorsCount,
            bookingsCount,
            subject.IsDeleted,
            subject.DeletedAt,
            subject.DeleteReason
        );
    }
}
