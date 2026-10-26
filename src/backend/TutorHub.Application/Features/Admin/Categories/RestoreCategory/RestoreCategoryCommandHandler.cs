using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Admin.Categories.RestoreCategory;

public class RestoreCategoryCommandHandler : IRequestHandler<RestoreCategoryCommand, AdminCategoryDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public RestoreCategoryCommandHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<AdminCategoryDto> Handle(RestoreCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .IgnoreQueryFilters()
            .Include(c => c.Subjects)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (category == null)
        {
            throw new NotFoundException("Category", request.Id);
        }

        if (!category.IsDeleted)
        {
            throw new ConflictException("Category is not in trash / not deleted.");
        }

        var duplicateActive = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == category.Name.ToLower() && c.Id != category.Id, cancellationToken);

        if (duplicateActive)
        {
            throw new ConflictException($"An active category with the name '{category.Name}' already exists. Please resolve the naming conflict before restoring.");
        }

        var userId = _currentUserService.UserIdOrThrow();

        category.Restore();

        await _auditLogService.LogAsync(
            action: "CATEGORY_RESTORED",
            entityName: "Category",
            entityId: category.Id.ToString(),
            userId: userId,
            oldValues: new { IsDeleted = true, category.DeletedAt, category.DeleteReason },
            newValues: new { IsDeleted = false },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return new AdminCategoryDto(
            category.Id,
            category.Name,
            category.Description,
            category.IsActive,
            category.Subjects.Count(s => !s.IsDeleted),
            category.IsDeleted,
            category.DeletedAt,
            category.DeleteReason
        );
    }
}
