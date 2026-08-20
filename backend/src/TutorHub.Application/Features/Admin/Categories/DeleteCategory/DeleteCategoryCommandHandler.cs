using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;

namespace TutorHub.Application.Features.Admin.Categories.DeleteCategory;

public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, Unit>
{
    private readonly IAppDbContext _context;

    public DeleteCategoryCommandHandler(IAppDbContext context)
    {
        _context = context;
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

        // Safe Deletion Rule: Cannot delete category containing subjects (409 Conflict)
        if (category.Subjects.Any())
        {
            throw new ConflictException("Cannot delete category that contains subjects. Please remove or reassign all subjects first, or deactivate the category.");
        }

        _context.Categories.Remove(category);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            throw new ConflictException("Cannot delete category because it is referenced by other records.");
        }

        return Unit.Value;
    }
}
