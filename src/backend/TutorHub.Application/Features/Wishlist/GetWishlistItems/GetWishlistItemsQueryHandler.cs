using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.GetWishlistItems;

public class GetWishlistItemsQueryHandler : IRequestHandler<GetWishlistItemsQuery, PagedResult<object>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetWishlistItemsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<object>> Handle(GetWishlistItemsQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.UserId.HasValue)
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var currentUserId = _currentUserService.UserId.Value;
        var page = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 10 : Math.Min(request.PageSize, 50);

        if (request.Type == WishlistItemType.Tutor)
        {
            var baseQuery = _context.WishlistItems
                .AsNoTracking()
                .Where(w => w.UserId == currentUserId && w.ItemType == WishlistItemType.Tutor && w.TutorProfileId != null);

            var totalCount = await baseQuery.CountAsync(cancellationToken);

            var items = await baseQuery
                .OrderByDescending(w => w.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(w => new WishlistTutorDto
                {
                    Id = w.Id,
                    TutorProfileId = w.TutorProfileId!.Value,
                    FullName = w.TutorProfile!.User.FullName,
                    AvatarUrl = w.TutorProfile.User.AvatarUrl,
                    Bio = w.TutorProfile.Bio,
                    Education = w.TutorProfile.Education,
                    ExperienceYears = w.TutorProfile.ExperienceYears,
                    RatingAvg = w.TutorProfile.RatingAvg,
                    TotalReviews = w.TutorProfile.TotalReviews,
                    IsVerified = w.TutorProfile.User.TutorApplications.Any(a => a.Status == TutorApplicationStatus.Approved),
                    MinPrice = w.TutorProfile.Services
                        .Where(s => s.Status == ServiceStatus.Published && !s.IsDeleted)
                        .Select(s => (decimal?)s.Price)
                        .Min() ?? 0,
                    Subjects = w.TutorProfile.TutorSubjects
                        .Where(ts => ts.IsActive)
                        .Select(ts => ts.Subject.Name)
                        .ToList(),
                    FavoritedAt = w.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return new PagedResult<object>(items.Cast<object>().ToList(), totalCount, page, pageSize);
        }
        else if (request.Type == WishlistItemType.Service)
        {
            var baseQuery = _context.WishlistItems
                .AsNoTracking()
                .Where(w => w.UserId == currentUserId && w.ItemType == WishlistItemType.Service && w.ServiceId != null);

            var totalCount = await baseQuery.CountAsync(cancellationToken);

            var items = await baseQuery
                .OrderByDescending(w => w.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(w => new WishlistServiceDto
                {
                    Id = w.Id,
                    ServiceId = w.ServiceId!.Value,
                    TutorProfileId = w.Service!.TutorProfileId,
                    TutorName = w.Service.TutorProfile.User.FullName,
                    TutorAvatar = w.Service.TutorProfile.User.AvatarUrl,
                    Title = w.Service.Title,
                    Description = w.Service.Description,
                    Price = w.Service.Price,
                    TotalSessions = w.Service.TotalSessions,
                    SessionDurationMinutes = w.Service.SessionDurationMinutes,
                    CoverImageUrl = w.Service.CoverImageUrl,
                    SubjectName = w.Service.Subject.Name,
                    FavoritedAt = w.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return new PagedResult<object>(items.Cast<object>().ToList(), totalCount, page, pageSize);
        }

        throw new BadRequestException("Loại mục lưu không hợp lệ.");
    }
}
