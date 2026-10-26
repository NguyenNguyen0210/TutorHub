using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Admin.Categories.DeleteCategory;

public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, Unit>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditLogService _auditLogService;

    public DeleteCategoryCommandHandler(
        IAppDbContext context,
        ICurrentUserService currentUserService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _auditLogService = auditLogService;
    }

    public async Task<Unit> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .Include(c => c.Subjects)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (category == null)
        {
            throw new NotFoundException("Category", request.Id);
        }

        if (category.Subjects.Any(s => !s.IsDeleted))
        {
            throw new ConflictException("Cannot delete category because it contains active subjects. Please delete or reassign subjects first.");
        }

        var userId = _currentUserService.UserIdOrThrow();

        category.SoftDelete(userId, request.Reason);

        await _auditLogService.LogAsync(
            action: "CATEGORY_SOFT_DELETED",
            entityName: "Category",
            entityId: category.Id.ToString(),
            userId: userId,
            oldValues: new { category.Name, IsDeleted = false },
            newValues: new { IsDeleted = true, category.DeleteReason, category.DeletedAt },
            cancellationToken: cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
