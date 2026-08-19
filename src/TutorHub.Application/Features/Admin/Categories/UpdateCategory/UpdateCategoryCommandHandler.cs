using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Categories.DTOs;

namespace TutorHub.Application.Features.Admin.Categories.UpdateCategory;

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, AdminCategoryDto>
{
    private readonly IAppDbContext _context;

    public UpdateCategoryCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminCategoryDto> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories
            .Include(c => c.Subjects)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (category == null)
        {
            throw new NotFoundException("Category", request.Id);
        }

        var normalizedName = request.Name.Trim();

        // Case-insensitive uniqueness check
        var duplicate = await _context.Categories
            .AnyAsync(c => c.Id != request.Id && c.Name.ToLower() == normalizedName.ToLower(), cancellationToken);

        if (duplicate)
        {
            throw new ConflictException("Category name already exists.");
        }

        category.Name = normalizedName;
        category.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        category.IsActive = request.IsActive;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            var innerMsg = ex.InnerException?.Message ?? string.Empty;
            if (innerMsg.Contains("IX_Categories_Name") || innerMsg.Contains("23505"))
            {
                throw new ConflictException("Category name already exists.");
            }
            throw;
        }

        return new AdminCategoryDto(
            category.Id,
            category.Name,
            category.Description,
            category.IsActive,
            category.Subjects.Count
        );
    }
}
