using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Subjects.DTOs;
using TutorHub.Domain.Entities;

namespace TutorHub.Application.Features.Admin.Subjects.CreateSubject;

public class CreateSubjectCommandHandler : IRequestHandler<CreateSubjectCommand, AdminSubjectDto>
{
    private readonly IAppDbContext _context;

    public CreateSubjectCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminSubjectDto> Handle(CreateSubjectCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify Category exists and is Active
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken);

        if (category == null)
        {
            throw new NotFoundException("Category", request.CategoryId);
        }

        if (!category.IsActive)
        {
            throw new ConflictException("Cannot add subject to an inactive category.");
        }

        var normalizedName = request.Name.Trim();

        // 2. Case-insensitive uniqueness check within the same category
        var exists = await _context.Subjects
            .AnyAsync(s => s.CategoryId == request.CategoryId && s.Name.ToLower() == normalizedName.ToLower(), cancellationToken);

        if (exists)
        {
            throw new ConflictException("Subject name already exists in this category.");
        }

        var subject = new Subject
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            CategoryId = category.Id,
            IsActive = true
        };

        _context.Subjects.Add(subject);

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

        return new AdminSubjectDto(
            subject.Id,
            subject.Name,
            category.Id,
            category.Name,
            subject.IsActive,
            0,
            0
        );
    }
}
