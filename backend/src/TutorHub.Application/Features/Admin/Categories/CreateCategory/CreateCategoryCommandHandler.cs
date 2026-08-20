using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Categories.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Admin.Categories.CreateCategory;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, AdminCategoryDto>
{
    private readonly IAppDbContext _context;

    public CreateCategoryCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminCategoryDto> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var normalizedName = request.Name.Trim();

        // Case-insensitive uniqueness check
        var exists = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == normalizedName.ToLower(), cancellationToken);

        if (exists)
        {
            throw new ConflictException("Category name already exists.");
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsActive = true
        };

        _context.Categories.Add(category);

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
            0
        );
    }
}
