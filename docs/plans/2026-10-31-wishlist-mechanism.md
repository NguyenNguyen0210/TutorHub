# Wishlist Mechanism (Tutors & Services) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, robust wishlist mechanism that enables authenticated users (primarily students) to save and manage favorite tutors and learning services across all touchpoints with database persistence, optimistic UI updates, and a dedicated management page.

**Architecture:** A unified PostgreSQL `wishlist_items` table with foreign key cascade rules and a database check constraint, accessed through .NET 8 MediatR CQRS handlers (`ToggleWishlist`, `GetWishlistIds`, `GetWishlistItems`, `RemoveWishlistItem`) in a protected API controller, consumed by frontend React Query custom hooks (`useWishlist`) providing instant client hydration, optimistic UI updates, and a dedicated `/student/wishlist` interface following the Cobalt & Porcelain Editorial design system.

**Tech Stack:** .NET 8 Web API, Entity Framework Core with Npgsql (PostgreSQL), MediatR, FluentValidation, React 18, TanStack React Query, Tailwind CSS, Lucide icons.

---

## File Structure Map

### Backend
- `src/backend/TutorHub.Domain/Enums/WishlistItemType.cs` — Enum defining `Tutor` and `Service` types.
- `src/backend/TutorHub.Domain/Entities/WishlistItem.cs` — Domain entity with UserId, ItemType, nullable TutorProfileId, nullable ServiceId, CreatedAt.
- `src/backend/TutorHub.Domain/Entities/User.cs` — Navigation property `ICollection<WishlistItem> WishlistItems`.
- `src/backend/TutorHub.Domain/Entities/TutorProfile.cs` — Navigation property `ICollection<WishlistItem> WishlistItems`.
- `src/backend/TutorHub.Domain/Entities/Service.cs` — Navigation property `ICollection<WishlistItem> WishlistItems`.
- `src/backend/TutorHub.Infrastructure/Persistence/Configurations/WishlistItemConfiguration.cs` — EF Core Fluent API mapping, check constraint, unique partial indexes, cascade delete.
- `src/backend/TutorHub.Application/Common/Interfaces/IAppDbContext.cs` — Add `DbSet<WishlistItem> WishlistItems`.
- `src/backend/TutorHub.Infrastructure/Persistence/AppDbContext.cs` — Add `DbSet<WishlistItem> WishlistItems`.
- `src/backend/TutorHub.Application/Features/Wishlist/DTOs/WishlistDtos.cs` — DTOs for lightweight IDs and paged cards.
- `src/backend/TutorHub.Application/Features/Wishlist/ToggleWishlist/ToggleWishlistCommand.cs` — MediatR command and handler for toggle logic with self-favorite guard.
- `src/backend/TutorHub.Application/Features/Wishlist/GetWishlistIds/GetWishlistIdsQuery.cs` — MediatR query and handler for lightweight IDs.
- `src/backend/TutorHub.Application/Features/Wishlist/GetWishlistItems/GetWishlistItemsQuery.cs` — MediatR query and handler for paged item cards.
- `src/backend/TutorHub.Application/Features/Wishlist/RemoveWishlistItem/RemoveWishlistItemCommand.cs` — MediatR command and handler for direct removal.
- `src/backend/TutorHub.Api/Controllers/WishlistController.cs` — REST API controller exposing `/api/v1/wishlist` endpoints.

### Tests
- `src/test/TutorHub.Domain.UnitTests/Entities/WishlistItemTests.cs` — Unit tests for domain entity and validation rules.
- `src/test/TutorHub.Application.UnitTests/Features/Wishlist/ToggleWishlistCommandHandlerTests.cs` — Unit tests for toggle logic, self-favorite prevention, not found errors.
- `src/test/TutorHub.Application.UnitTests/Features/Wishlist/GetWishlistQueryHandlerTests.cs` — Unit tests for IDs and paged queries.
- `src/frontend/test/wishlistService.test.mjs` — Unit tests for frontend service URL construction and error formatting.

### Frontend
- `src/frontend/src/services/wishlistService.js` — Axios API calls for wishlist endpoints.
- `src/frontend/src/hooks/useWishlist.js` — React Query custom hook for cached IDs, optimistic toggle, and auth prompting.
- `src/frontend/src/components/discovery/TutorCard.jsx` — Hook integration replacing local `useState(false)`.
- `src/frontend/src/components/discovery/ServiceCard.jsx` — Hook integration replacing local `useState(false)`.
- `src/frontend/src/components/tutor/profile/ProfileHeadline.jsx` — Save tutor button next to share button.
- `src/frontend/src/pages/discovery/ServiceDetail.jsx` — Save service button in header/action box.
- `src/frontend/src/components/layout/PublicTopbar.jsx` — Heart icon shortcut to `/student/wishlist`.
- `src/frontend/src/layouts/StudentLayout.jsx` — Sidebar navigation item "Đã lưu".
- `src/frontend/src/pages/student/StudentWishlist.jsx` — Dedicated management page with Tutors & Services tabs, skeleton loading, empty state, and error handling.
- `src/frontend/src/routes/index.jsx` — Route registration for `/student/wishlist`.

---

## Tasks

### Task 1: Domain Entity, Enum & Navigation Properties

**Files:**
- Create: `src/backend/TutorHub.Domain/Enums/WishlistItemType.cs`
- Create: `src/backend/TutorHub.Domain/Entities/WishlistItem.cs`
- Modify: `src/backend/TutorHub.Domain/Entities/User.cs`
- Modify: `src/backend/TutorHub.Domain/Entities/TutorProfile.cs`
- Modify: `src/backend/TutorHub.Domain/Entities/Service.cs`
- Test: `src/test/TutorHub.Domain.UnitTests/Entities/WishlistItemTests.cs`

- [ ] **Step 1: Write the failing unit tests for WishlistItem**

Create `src/test/TutorHub.Domain.UnitTests/Entities/WishlistItemTests.cs`:
```csharp
using FluentAssertions;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Domain.UnitTests.Entities;

public class WishlistItemTests
{
    [Fact]
    public void CreateTutorWishlistItem_ShouldInitializeCorrectly()
    {
        var userId = Guid.NewGuid();
        var tutorProfileId = Guid.NewGuid();

        var item = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ItemType = WishlistItemType.Tutor,
            TutorProfileId = tutorProfileId,
            CreatedAt = DateTime.UtcNow
        };

        item.UserId.Should().Be(userId);
        item.ItemType.Should().Be(WishlistItemType.Tutor);
        item.TutorProfileId.Should().Be(tutorProfileId);
        item.ServiceId.Should().BeNull();
    }

    [Fact]
    public void CreateServiceWishlistItem_ShouldInitializeCorrectly()
    {
        var userId = Guid.NewGuid();
        var serviceId = Guid.NewGuid();

        var item = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ItemType = WishlistItemType.Service,
            ServiceId = serviceId,
            CreatedAt = DateTime.UtcNow
        };

        item.UserId.Should().Be(userId);
        item.ItemType.Should().Be(WishlistItemType.Service);
        item.ServiceId.Should().Be(serviceId);
        item.TutorProfileId.Should().BeNull();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test src/test/TutorHub.Domain.UnitTests/TutorHub.Domain.UnitTests.csproj --filter FullyQualifiedName~WishlistItemTests`
Expected: FAIL (Compilation error: `WishlistItemType` and `WishlistItem` do not exist).

- [ ] **Step 3: Implement WishlistItemType Enum and WishlistItem Entity**

Create `src/backend/TutorHub.Domain/Enums/WishlistItemType.cs`:
```csharp
namespace TutorHub.Domain.Enums;

public enum WishlistItemType
{
    Tutor = 1,
    Service = 2
}
```

Create `src/backend/TutorHub.Domain/Entities/WishlistItem.cs`:
```csharp
using TutorHub.Domain.Enums;

namespace TutorHub.Domain.Entities;

public class WishlistItem
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public WishlistItemType ItemType { get; set; }

    public Guid? TutorProfileId { get; set; }
    public TutorProfile? TutorProfile { get; set; }

    public Guid? ServiceId { get; set; }
    public Service? Service { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

Modify `src/backend/TutorHub.Domain/Entities/User.cs`:
Add navigation property:
```csharp
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
```

Modify `src/backend/TutorHub.Domain/Entities/TutorProfile.cs`:
Add navigation property:
```csharp
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
```

Modify `src/backend/TutorHub.Domain/Entities/Service.cs`:
Add navigation property:
```csharp
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
```

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `dotnet test src/test/TutorHub.Domain.UnitTests/TutorHub.Domain.UnitTests.csproj --filter FullyQualifiedName~WishlistItemTests`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit changes**

```bash
git add src/backend/TutorHub.Domain/ src/test/TutorHub.Domain.UnitTests/
git commit -m "feat(domain): add WishlistItem entity and WishlistItemType enum"
```

---

### Task 2: Infrastructure Persistence & EF Core Migration

**Files:**
- Create: `src/backend/TutorHub.Infrastructure/Persistence/Configurations/WishlistItemConfiguration.cs`
- Modify: `src/backend/TutorHub.Application/Common/Interfaces/IAppDbContext.cs`
- Modify: `src/backend/TutorHub.Infrastructure/Persistence/AppDbContext.cs`

- [ ] **Step 1: Create EF Core Configuration for WishlistItem**

Create `src/backend/TutorHub.Infrastructure/Persistence/Configurations/WishlistItemConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Infrastructure.Persistence.Configurations;

public class WishlistItemConfiguration : IEntityTypeConfiguration<WishlistItem>
{
    public void Configure(EntityTypeBuilder<WishlistItem> builder)
    {
        builder.ToTable("wishlist_items", t =>
        {
            t.HasCheckConstraint(
                "CK_wishlist_items_type_target",
                "(\"ItemType\" = 1 AND \"TutorProfileId\" IS NOT NULL AND \"ServiceId\" IS NULL) OR (\"ItemType\" = 2 AND \"ServiceId\" IS NOT NULL AND \"TutorProfileId\" IS NULL)");
        });

        builder.HasKey(w => w.Id);

        builder.Property(w => w.ItemType)
            .IsRequired();

        builder.Property(w => w.CreatedAt)
            .IsRequired();

        builder.HasOne(w => w.User)
            .WithMany(u => u.WishlistItems)
            .HasForeignKey(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.TutorProfile)
            .WithMany(t => t.WishlistItems)
            .HasForeignKey(w => w.TutorProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(w => w.Service)
            .WithMany(s => s.WishlistItems)
            .HasForeignKey(w => w.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(w => new { w.UserId, w.TutorProfileId })
            .IsUnique()
            .HasFilter("\"TutorProfileId\" IS NOT NULL");

        builder.HasIndex(w => new { w.UserId, w.ServiceId })
            .IsUnique()
            .HasFilter("\"ServiceId\" IS NOT NULL");
    }
}
```

- [ ] **Step 2: Add DbSet to IAppDbContext and AppDbContext**

Modify `src/backend/TutorHub.Application/Common/Interfaces/IAppDbContext.cs`:
```csharp
    DbSet<WishlistItem> WishlistItems { get; }
```

Modify `src/backend/TutorHub.Infrastructure/Persistence/AppDbContext.cs`:
```csharp
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
```

- [ ] **Step 3: Generate EF Core Migration**

Run: `dotnet ef migrations add AddWishlistItems --project src/backend/TutorHub.Infrastructure --startup-project src/backend/TutorHub.Api --output-dir Persistence/Migrations`
Expected: Migration generated successfully with `wishlist_items` table, check constraint, and indexes.

- [ ] **Step 4: Verify build succeeds**

Run: `dotnet build src/backend/TutorHub.sln`
Expected: Build succeeded with 0 errors.

- [ ] **Step 5: Commit changes**

```bash
git add src/backend/TutorHub.Application/ src/backend/TutorHub.Infrastructure/
git commit -m "feat(infrastructure): add WishlistItem configuration and database migration"
```

---

### Task 3: Application CQRS — DTOs, Commands, Queries & Handlers

**Files:**
- Create: `src/backend/TutorHub.Application/Features/Wishlist/DTOs/WishlistDtos.cs`
- Create: `src/backend/TutorHub.Application/Features/Wishlist/ToggleWishlist/ToggleWishlistCommand.cs`
- Create: `src/backend/TutorHub.Application/Features/Wishlist/ToggleWishlist/ToggleWishlistCommandHandler.cs`
- Create: `src/backend/TutorHub.Application/Features/Wishlist/GetWishlistIds/GetWishlistIdsQuery.cs`
- Create: `src/backend/TutorHub.Application/Features/Wishlist/GetWishlistIds/GetWishlistIdsQueryHandler.cs`
- Create: `src/backend/TutorHub.Application/Features/Wishlist/GetWishlistItems/GetWishlistItemsQuery.cs`
- Create: `src/backend/TutorHub.Application/Features/Wishlist/GetWishlistItems/GetWishlistItemsQueryHandler.cs`
- Create: `src/backend/TutorHub.Application/Features/Wishlist/RemoveWishlistItem/RemoveWishlistItemCommand.cs`
- Create: `src/backend/TutorHub.Application/Features/Wishlist/RemoveWishlistItem/RemoveWishlistItemCommandHandler.cs`
- Test: `src/test/TutorHub.Application.UnitTests/Features/Wishlist/ToggleWishlistCommandHandlerTests.cs`
- Test: `src/test/TutorHub.Application.UnitTests/Features/Wishlist/GetWishlistQueryHandlerTests.cs`

- [ ] **Step 1: Write failing unit tests for ToggleWishlistCommandHandler**

Create `src/test/TutorHub.Application.UnitTests/Features/Wishlist/ToggleWishlistCommandHandlerTests.cs`:
```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wishlist.ToggleWishlist;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;
using Xunit;

namespace TutorHub.Application.UnitTests.Features.Wishlist;

public class ToggleWishlistCommandHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();

    private IAppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<Infrastructure.Persistence.AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new Infrastructure.Persistence.AppDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenItemNotSaved_ShouldSaveAndReturnTrue()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId.ToString());

        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@test.com",
            PasswordHash = "hash",
            FullName = "Tutor One",
            Role = UserRole.Tutor
        };
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "Bio",
            Education = "Edu"
        };
        dbContext.Users.Add(tutorUser);
        dbContext.TutorProfiles.Add(tutorProfile);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var command = new ToggleWishlistCommand(WishlistItemType.Tutor, tutorProfile.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFavorited.Should().BeTrue();
        (await dbContext.WishlistItems.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Handle_WhenItemAlreadySaved_ShouldRemoveAndReturnFalse()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId.ToString());

        var tutorUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "tutor@test.com",
            PasswordHash = "hash",
            FullName = "Tutor One",
            Role = UserRole.Tutor
        };
        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = tutorUser.Id,
            User = tutorUser,
            Bio = "Bio",
            Education = "Edu"
        };
        var existingWish = new WishlistItem
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            ItemType = WishlistItemType.Tutor,
            TutorProfileId = tutorProfile.Id,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Users.Add(tutorUser);
        dbContext.TutorProfiles.Add(tutorProfile);
        dbContext.WishlistItems.Add(existingWish);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var command = new ToggleWishlistCommand(WishlistItemType.Tutor, tutorProfile.Id);

        var result = await handler.Handle(command, CancellationToken.None);

        result.IsFavorited.Should().BeFalse();
        (await dbContext.WishlistItems.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Handle_WhenTutorSavesSelf_ShouldThrowBadRequestException()
    {
        var dbContext = CreateInMemoryDbContext();
        var currentUserId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(currentUserId.ToString());

        var tutorProfile = new TutorProfile
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            Bio = "Bio",
            Education = "Edu"
        };
        dbContext.TutorProfiles.Add(tutorProfile);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        var handler = new ToggleWishlistCommandHandler(dbContext, _currentUserServiceMock.Object);
        var command = new ToggleWishlistCommand(WishlistItemType.Tutor, tutorProfile.Id);

        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<BadRequestException>();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test src/test/TutorHub.Application.UnitTests/TutorHub.Application.UnitTests.csproj --filter FullyQualifiedName~ToggleWishlistCommandHandlerTests`
Expected: FAIL (types do not exist yet).

- [ ] **Step 3: Implement Wishlist DTOs**

Create `src/backend/TutorHub.Application/Features/Wishlist/DTOs/WishlistDtos.cs`:
```csharp
namespace TutorHub.Application.Features.Wishlist.DTOs;

public record WishlistToggleResultDto(bool IsFavorited, string Message);

public record WishlistIdsDto(IReadOnlyList<Guid> TutorIds, IReadOnlyList<Guid> ServiceIds);

public class WishlistTutorDto
{
    public Guid Id { get; set; }
    public Guid TutorProfileId { get; set; }
    public string FullName { get; set; } = default!;
    public string? AvatarUrl { get; set; }
    public string Bio { get; set; } = default!;
    public string Education { get; set; } = default!;
    public int ExperienceYears { get; set; }
    public decimal RatingAvg { get; set; }
    public int TotalReviews { get; set; }
    public bool IsVerified { get; set; }
    public decimal MinPrice { get; set; }
    public List<string> Subjects { get; set; } = new();
    public DateTime FavoritedAt { get; set; }
}

public class WishlistServiceDto
{
    public Guid Id { get; set; }
    public Guid ServiceId { get; set; }
    public Guid TutorProfileId { get; set; }
    public string TutorName { get; set; } = default!;
    public string? TutorAvatar { get; set; }
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int TotalSessions { get; set; }
    public int SessionDurationMinutes { get; set; }
    public string? CoverImageUrl { get; set; }
    public string SubjectName { get; set; } = default!;
    public DateTime FavoritedAt { get; set; }
}
```

- [ ] **Step 4: Implement ToggleWishlistCommand and Handler**

Create `src/backend/TutorHub.Application/Features/Wishlist/ToggleWishlist/ToggleWishlistCommand.cs`:
```csharp
using MediatR;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.ToggleWishlist;

public record ToggleWishlistCommand(WishlistItemType ItemType, Guid ItemId) : IRequest<WishlistToggleResultDto>;
```

Create `src/backend/TutorHub.Application/Features/Wishlist/ToggleWishlist/ToggleWishlistCommandHandler.cs`:
```csharp
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.ToggleWishlist;

public class ToggleWishlistCommandHandler : IRequestHandler<ToggleWishlistCommand, WishlistToggleResultDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ToggleWishlistCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<WishlistToggleResultDto> Handle(ToggleWishlistCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId) || !Guid.TryParse(_currentUserService.UserId, out var currentUserId))
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        if (request.ItemType == WishlistItemType.Tutor)
        {
            var tutor = await _context.TutorProfiles
                .FirstOrDefaultAsync(t => t.Id == request.ItemId, cancellationToken);

            if (tutor == null)
            {
                throw new NotFoundException(nameof(TutorProfile), request.ItemId);
            }

            if (tutor.UserId == currentUserId)
            {
                throw new BadRequestException("Bạn không thể lưu chính hồ sơ gia sư của mình.");
            }

            var existing = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserId == currentUserId && w.TutorProfileId == request.ItemId, cancellationToken);

            if (existing != null)
            {
                _context.WishlistItems.Remove(existing);
                await _context.SaveChangesAsync(cancellationToken);
                return new WishlistToggleResultDto(false, "Đã bỏ lưu gia sư.");
            }

            var newItem = new WishlistItem
            {
                Id = Guid.NewGuid(),
                UserId = currentUserId,
                ItemType = WishlistItemType.Tutor,
                TutorProfileId = request.ItemId,
                CreatedAt = DateTime.UtcNow
            };

            _context.WishlistItems.Add(newItem);
            await _context.SaveChangesAsync(cancellationToken);
            return new WishlistToggleResultDto(true, "Đã lưu gia sư vào danh sách yêu thích.");
        }
        else if (request.ItemType == WishlistItemType.Service)
        {
            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == request.ItemId, cancellationToken);

            if (service == null)
            {
                throw new NotFoundException(nameof(Service), request.ItemId);
            }

            var existing = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.UserId == currentUserId && w.ServiceId == request.ItemId, cancellationToken);

            if (existing != null)
            {
                _context.WishlistItems.Remove(existing);
                await _context.SaveChangesAsync(cancellationToken);
                return new WishlistToggleResultDto(false, "Đã bỏ lưu dịch vụ.");
            }

            var newItem = new WishlistItem
            {
                Id = Guid.NewGuid(),
                UserId = currentUserId,
                ItemType = WishlistItemType.Service,
                ServiceId = request.ItemId,
                CreatedAt = DateTime.UtcNow
            };

            _context.WishlistItems.Add(newItem);
            await _context.SaveChangesAsync(cancellationToken);
            return new WishlistToggleResultDto(true, "Đã lưu dịch vụ vào danh sách yêu thích.");
        }

        throw new BadRequestException("Loại mục lưu không hợp lệ.");
    }
}
```

- [ ] **Step 5: Implement GetWishlistIds Query and Handler**

Create `src/backend/TutorHub.Application/Features/Wishlist/GetWishlistIds/GetWishlistIdsQuery.cs`:
```csharp
using MediatR;
using TutorHub.Application.Features.Wishlist.DTOs;

namespace TutorHub.Application.Features.Wishlist.GetWishlistIds;

public record GetWishlistIdsQuery : IRequest<WishlistIdsDto>;
```

Create `src/backend/TutorHub.Application/Features/Wishlist/GetWishlistIds/GetWishlistIdsQueryHandler.cs`:
```csharp
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.GetWishlistIds;

public class GetWishlistIdsQueryHandler : IRequestHandler<GetWishlistIdsQuery, WishlistIdsDto>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetWishlistIdsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<WishlistIdsDto> Handle(GetWishlistIdsQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId) || !Guid.TryParse(_currentUserService.UserId, out var currentUserId))
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var items = await _context.WishlistItems
            .AsNoTracking()
            .Where(w => w.UserId == currentUserId)
            .Select(w => new { w.ItemType, w.TutorProfileId, w.ServiceId })
            .ToListAsync(cancellationToken);

        var tutorIds = items
            .Where(i => i.ItemType == WishlistItemType.Tutor && i.TutorProfileId.HasValue)
            .Select(i => i.TutorProfileId!.Value)
            .ToList();

        var serviceIds = items
            .Where(i => i.ItemType == WishlistItemType.Service && i.ServiceId.HasValue)
            .Select(i => i.ServiceId!.Value)
            .ToList();

        return new WishlistIdsDto(tutorIds, serviceIds);
    }
}
```

- [ ] **Step 6: Implement GetWishlistItems Query and Handler**

Create `src/backend/TutorHub.Application/Features/Wishlist/GetWishlistItems/GetWishlistItemsQuery.cs`:
```csharp
using MediatR;
using TutorHub.Application.Common.Models;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.GetWishlistItems;

public record GetWishlistItemsQuery(
    WishlistItemType Type,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PagedList<object>>;
```

Create `src/backend/TutorHub.Application/Features/Wishlist/GetWishlistItems/GetWishlistItemsQueryHandler.cs`:
```csharp
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.GetWishlistItems;

public class GetWishlistItemsQueryHandler : IRequestHandler<GetWishlistItemsQuery, PagedList<object>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetWishlistItemsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedList<object>> Handle(GetWishlistItemsQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId) || !Guid.TryParse(_currentUserService.UserId, out var currentUserId))
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

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
                .Include(w => w.TutorProfile!)
                    .ThenInclude(t => t.User)
                .Include(w => w.TutorProfile!)
                    .ThenInclude(t => t.TutorSubjects)
                        .ThenInclude(ts => ts.Subject)
                .Include(w => w.TutorProfile!)
                    .ThenInclude(t => t.Services)
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
                    IsVerified = w.TutorProfile.IsVerified,
                    MinPrice = w.TutorProfile.Services
                        .Where(s => s.Status == ServiceStatus.Published)
                        .Select(s => (decimal?)s.Price)
                        .Min() ?? 0,
                    Subjects = w.TutorProfile.TutorSubjects.Select(ts => ts.Subject.Name).ToList(),
                    FavoritedAt = w.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return new PagedList<object>(items.Cast<object>().ToList(), totalCount, page, pageSize);
        }
        else
        {
            var baseQuery = _context.WishlistItems
                .AsNoTracking()
                .Where(w => w.UserId == currentUserId && w.ItemType == WishlistItemType.Service && w.ServiceId != null);

            var totalCount = await baseQuery.CountAsync(cancellationToken);

            var items = await baseQuery
                .OrderByDescending(w => w.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(w => w.Service!)
                    .ThenInclude(s => s.TutorProfile)
                        .ThenInclude(t => t.User)
                .Include(w => w.Service!)
                    .ThenInclude(s => s.Subject)
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

            return new PagedList<object>(items.Cast<object>().ToList(), totalCount, page, pageSize);
        }
    }
}
```

- [ ] **Step 7: Implement RemoveWishlistItemCommand and Handler**

Create `src/backend/TutorHub.Application/Features/Wishlist/RemoveWishlistItem/RemoveWishlistItemCommand.cs`:
```csharp
using MediatR;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.RemoveWishlistItem;

public record RemoveWishlistItemCommand(WishlistItemType ItemType, Guid ItemId) : IRequest<bool>;
```

Create `src/backend/TutorHub.Application/Features/Wishlist/RemoveWishlistItem/RemoveWishlistItemCommandHandler.cs`:
```csharp
using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Wishlist.RemoveWishlistItem;

public class RemoveWishlistItemCommandHandler : IRequestHandler<RemoveWishlistItemCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public RemoveWishlistItemCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<bool> Handle(RemoveWishlistItemCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId) || !Guid.TryParse(_currentUserService.UserId, out var currentUserId))
        {
            throw new UnauthorizedException("User is not authenticated.");
        }

        var item = await _context.WishlistItems
            .FirstOrDefaultAsync(w => w.UserId == currentUserId &&
                ((request.ItemType == WishlistItemType.Tutor && w.TutorProfileId == request.ItemId) ||
                 (request.ItemType == WishlistItemType.Service && w.ServiceId == request.ItemId)),
                cancellationToken);

        if (item == null) return false;

        _context.WishlistItems.Remove(item);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
```

- [ ] **Step 8: Run unit tests to verify they pass**

Run: `dotnet test src/test/TutorHub.Application.UnitTests/TutorHub.Application.UnitTests.csproj --filter FullyQualifiedName~ToggleWishlistCommandHandlerTests`
Expected: PASS (3 passed).

- [ ] **Step 9: Commit changes**

```bash
git add src/backend/TutorHub.Application/Features/Wishlist/ src/test/TutorHub.Application.UnitTests/Features/Wishlist/
git commit -m "feat(application): add Wishlist CQRS commands, queries, and handlers"
```

---

### Task 4: Presentation API Controller

**Files:**
- Create: `src/backend/TutorHub.Api/Controllers/WishlistController.cs`

- [ ] **Step 1: Implement WishlistController**

Create `src/backend/TutorHub.Api/Controllers/WishlistController.cs`:
```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TutorHub.Application.Common.Models;
using TutorHub.Application.Features.Wishlist.DTOs;
using TutorHub.Application.Features.Wishlist.GetWishlistIds;
using TutorHub.Application.Features.Wishlist.GetWishlistItems;
using TutorHub.Application.Features.Wishlist.RemoveWishlistItem;
using TutorHub.Application.Features.Wishlist.ToggleWishlist;
using TutorHub.Domain.Enums;

namespace TutorHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/wishlist")]
public class WishlistController : ControllerBase
{
    private readonly ISender _sender;

    public WishlistController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Toggle favorite status of a tutor or service.
    /// </summary>
    [HttpPost("toggle")]
    [ProducesResponseType(typeof(ApiResponse<WishlistToggleResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Toggle([FromBody] ToggleWishlistCommand command, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(command, cancellationToken);
        return Ok(ApiResponse<WishlistToggleResultDto>.SuccessResult(result, result.Message));
    }

    /// <summary>
    /// Get lightweight list of all favorited tutor and service IDs for instant UI hydration.
    /// </summary>
    [HttpGet("ids")]
    [ProducesResponseType(typeof(ApiResponse<WishlistIdsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetWishlistIds(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetWishlistIdsQuery(), cancellationToken);
        return Ok(ApiResponse<WishlistIdsDto>.SuccessResult(result));
    }

    /// <summary>
    /// Get detailed paginated list of favorited tutors or services.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedList<object>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetWishlistItems(
        [FromQuery] WishlistItemType type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var query = new GetWishlistItemsQuery(type, page, pageSize);
        var result = await _sender.Send(query, cancellationToken);
        return Ok(ApiResponse<PagedList<object>>.SuccessResult(result));
    }

    /// <summary>
    /// Remove an item directly from the wishlist.
    /// </summary>
    [HttpDelete("{itemType}/{itemId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Remove(
        [FromRoute] WishlistItemType itemType,
        [FromRoute] Guid itemId,
        CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new RemoveWishlistItemCommand(itemType, itemId), cancellationToken);
        return Ok(ApiResponse<bool>.SuccessResult(result, result ? "Đã xóa khỏi danh sách yêu thích." : "Mục không tồn tại."));
    }
}
```

- [ ] **Step 2: Verify solution build**

Run: `dotnet build src/backend/TutorHub.sln`
Expected: Build succeeded with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add src/backend/TutorHub.Api/Controllers/WishlistController.cs
git commit -m "feat(api): add WishlistController endpoints"
```

---

### Task 5: Frontend Service & `useWishlist` Hook

**Files:**
- Create: `src/frontend/src/services/wishlistService.js`
- Create: `src/frontend/src/hooks/useWishlist.js`
- Test: `src/frontend/test/wishlistService.test.mjs`

- [ ] **Step 1: Write test for wishlistService**

Create `src/frontend/test/wishlistService.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';

test('wishlistService: endpoints and payload shapes', () => {
  const togglePayload = (itemType, itemId) => ({ itemType, itemId });
  const payload = togglePayload('Tutor', '3fa85f64-5717-4562-b3fc-2c963f66afa6');
  
  assert.equal(payload.itemType, 'Tutor');
  assert.equal(payload.itemId, '3fa85f64-5717-4562-b3fc-2c963f66afa6');
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test src/frontend/test/wishlistService.test.mjs`
Expected: PASS.

- [ ] **Step 3: Implement wishlistService.js**

Create `src/frontend/src/services/wishlistService.js`:
```javascript
import apiClient from '../lib/apiClient';

export const wishlistService = {
  async getWishlistIds() {
    const response = await apiClient.get('/api/v1/wishlist/ids');
    return response.data?.data || { tutorIds: [], serviceIds: [] };
  },

  async getWishlistItems(type, page = 1, pageSize = 10) {
    const response = await apiClient.get('/api/v1/wishlist', {
      params: { type, page, pageSize }
    });
    return response.data?.data || { items: [], totalCount: 0, page, pageSize };
  },

  async toggleWishlist(itemType, itemId) {
    const response = await apiClient.post('/api/v1/wishlist/toggle', { itemType, itemId });
    return response.data?.data;
  },

  async removeWishlistItem(itemType, itemId) {
    const response = await apiClient.delete(`/api/v1/wishlist/${itemType}/${itemId}`);
    return response.data?.data;
  }
};
```

- [ ] **Step 4: Implement useWishlist.js hook**

Create `src/frontend/src/hooks/useWishlist.js`:
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { wishlistService } from '../services/wishlistService';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';

export function useWishlist() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useToast();

  const { data: wishlistIds = { tutorIds: [], serviceIds: [] } } = useQuery({
    queryKey: ['wishlist', 'ids'],
    queryFn: wishlistService.getWishlistIds,
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const isFavorited = (itemType, itemId) => {
    if (!isAuthenticated || !itemId) return false;
    const strId = String(itemId).toLowerCase();
    if (itemType === 'Tutor') {
      return (wishlistIds.tutorIds || []).some(id => String(id).toLowerCase() === strId);
    }
    if (itemType === 'Service') {
      return (wishlistIds.serviceIds || []).some(id => String(id).toLowerCase() === strId);
    }
    return false;
  };

  const toggleMutation = useMutation({
    mutationFn: ({ itemType, itemId }) => wishlistService.toggleWishlist(itemType, itemId),
    onMutate: async ({ itemType, itemId }) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist', 'ids'] });
      const previousIds = queryClient.getQueryData(['wishlist', 'ids']) || { tutorIds: [], serviceIds: [] };
      const strId = String(itemId).toLowerCase();

      const newIds = {
        tutorIds: [...(previousIds.tutorIds || [])],
        serviceIds: [...(previousIds.serviceIds || [])]
      };

      if (itemType === 'Tutor') {
        const index = newIds.tutorIds.findIndex(id => String(id).toLowerCase() === strId);
        if (index >= 0) newIds.tutorIds.splice(index, 1);
        else newIds.tutorIds.push(itemId);
      } else if (itemType === 'Service') {
        const index = newIds.serviceIds.findIndex(id => String(id).toLowerCase() === strId);
        if (index >= 0) newIds.serviceIds.splice(index, 1);
        else newIds.serviceIds.push(itemId);
      }

      queryClient.setQueryData(['wishlist', 'ids'], newIds);
      return { previousIds };
    },
    onError: (err, variables, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(['wishlist', 'ids'], context.previousIds);
      }
      showToast({
        title: 'Thao tác không thành công',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật danh sách yêu thích.',
        type: 'error'
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', 'items'] });
      showToast({
        title: 'Thông báo',
        message: data?.message || 'Đã cập nhật danh sách yêu thích.',
        type: 'success'
      });
    }
  });

  const toggle = (itemType, itemId) => {
    if (!isAuthenticated) {
      showToast({
        title: 'Yêu cầu đăng nhập',
        message: 'Vui lòng đăng nhập để lưu vào danh sách yêu thích.',
        type: 'info'
      });
      navigate('/auth/login', { state: { returnUrl: window.location.pathname } });
      return;
    }
    toggleMutation.mutate({ itemType, itemId });
  };

  return {
    wishlistIds,
    isFavorited,
    toggle,
    isPending: toggleMutation.isPending
  };
}
```

- [ ] **Step 5: Commit changes**

```bash
git add src/frontend/src/services/wishlistService.js src/frontend/src/hooks/useWishlist.js src/frontend/test/wishlistService.test.mjs
git commit -m "feat(frontend): add wishlistService and useWishlist hook"
```

---

### Task 6: Frontend Touchpoint Integration (Cards & Detail Pages)

**Files:**
- Modify: `src/frontend/src/components/discovery/TutorCard.jsx`
- Modify: `src/frontend/src/components/discovery/ServiceCard.jsx`
- Modify: `src/frontend/src/components/tutor/profile/ProfileHeadline.jsx`
- Modify: `src/frontend/src/pages/discovery/ServiceDetail.jsx`

- [ ] **Step 1: Connect TutorCard to useWishlist**

Modify `src/frontend/src/components/discovery/TutorCard.jsx`:
Replace local `const [isFavorite, setIsFavorite] = useState(false);` with:
```javascript
  const { isFavorited, toggle } = useWishlist();
  const tutorId = tutor?.id || tutor?.tutorProfileId;
  const isFavorite = isFavorited('Tutor', tutorId);
```
Update the button click handler:
```javascript
  onClick={() => toggle('Tutor', tutorId)}
```

- [ ] **Step 2: Connect ServiceCard to useWishlist**

Modify `src/frontend/src/components/discovery/ServiceCard.jsx`:
Replace local `const [isFavorite, setIsFavorite] = useState(false);` with:
```javascript
  const { isFavorited, toggle } = useWishlist();
  const serviceId = service?.id || service?.serviceId;
  const isFavorite = isFavorited('Service', serviceId);
```
Update the button click handler:
```javascript
  onClick={() => toggle('Service', serviceId)}
```

- [ ] **Step 3: Add Favorite Button to ProfileHeadline.jsx**

Modify `src/frontend/src/components/tutor/profile/ProfileHeadline.jsx`:
Import `useWishlist` and replace line 126 (`{/* Hành động phụ: chia sẻ (V1). Lưu gia sư là V2 — cần endpoint bookmark. */}`) with a save button alongside the share button:
```javascript
  const { isFavorited, toggle } = useWishlist();
  const tutorId = tutor?.id;
  const isFavorite = isFavorited('Tutor', tutorId);
```
Add button:
```jsx
  <Button
    variant={isFavorite ? 'primary' : 'outline'}
    size="md"
    onClick={() => toggle('Tutor', tutorId)}
    icon={<Icon name="favorite" size="xs" filled={isFavorite} />}
  >
    {isFavorite ? 'Đã lưu gia sư' : 'Lưu gia sư'}
  </Button>
```

- [ ] **Step 4: Add Favorite Button to ServiceDetail.jsx**

Modify `src/frontend/src/pages/discovery/ServiceDetail.jsx`:
Import `useWishlist` and add a favorite heart button in the action card next to "Đặt lịch học".

- [ ] **Step 5: Verify frontend linting**

Run: `npm run lint` inside `src/frontend`
Expected: 0 errors.

- [ ] **Step 6: Commit changes**

```bash
git add src/frontend/src/components/discovery/TutorCard.jsx src/frontend/src/components/discovery/ServiceCard.jsx src/frontend/src/components/tutor/profile/ProfileHeadline.jsx src/frontend/src/pages/discovery/ServiceDetail.jsx
git commit -m "feat(frontend): integrate useWishlist across TutorCard, ServiceCard, and detail pages"
```

---

### Task 7: Dedicated Wishlist Management Page & Navigation

**Files:**
- Create: `src/frontend/src/pages/student/StudentWishlist.jsx`
- Modify: `src/frontend/src/routes/index.jsx`
- Modify: `src/frontend/src/layouts/StudentLayout.jsx`
- Modify: `src/frontend/src/components/layout/PublicTopbar.jsx`

- [ ] **Step 1: Create StudentWishlist.jsx page**

Create `src/frontend/src/pages/student/StudentWishlist.jsx`:
Implement editorial layout with:
- Tabs: "Gia sư đã lưu" and "Dịch vụ đã lưu" with count badges.
- React Query fetching with `wishlistService.getWishlistItems(activeTab, page, 10)`.
- State coverage:
  - Skeleton cards during loading.
  - Empty state with CTA button ("Khám phá gia sư" -> `/` or "Khám phá dịch vụ" -> `/services`).
  - Error state with "Thử lại" button.
- Pagination controls.

- [ ] **Step 2: Register Route in routes/index.jsx**

Modify `src/frontend/src/routes/index.jsx`:
Add import `import StudentWishlist from '../pages/student/StudentWishlist';`
Inside `<Route path="/student" element={<RequireAuth><RequireRole allowedRoles={['Student']}><StudentLayout /></RequireRole></RequireAuth>}>`:
Add `<Route path="wishlist" element={<StudentWishlist />} />`

- [ ] **Step 3: Add "Đã lưu" to StudentLayout.jsx navigation sidebar**

Modify `src/frontend/src/layouts/StudentLayout.jsx`:
Add menu item to navigation links:
```javascript
{ to: '/student/wishlist', label: 'Đã lưu', icon: 'favorite' }
```

- [ ] **Step 4: Add Heart icon shortcut in PublicTopbar.jsx**

Modify `src/frontend/src/components/layout/PublicTopbar.jsx`:
When user is authenticated as Student, show a heart icon button in the top action cluster leading to `/student/wishlist`.

- [ ] **Step 5: Run lint and build**

Run: `npm run lint` and `npm run build` inside `src/frontend`
Expected: Build successful with 0 errors.

- [ ] **Step 6: Commit changes**

```bash
git add src/frontend/src/pages/student/StudentWishlist.jsx src/frontend/src/routes/index.jsx src/frontend/src/layouts/StudentLayout.jsx src/frontend/src/components/layout/PublicTopbar.jsx
git commit -m "feat(frontend): add dedicated /student/wishlist page and navigation shortcuts"
```

---

### Task 8: End-to-End Verification & Sanity Checks

**Files:**
- Check: Entire solution and test suite

- [ ] **Step 1: Run all backend domain unit tests**

Run: `dotnet test src/test/TutorHub.Domain.UnitTests/TutorHub.Domain.UnitTests.csproj`
Expected: All tests pass.

- [ ] **Step 2: Run all backend application unit tests**

Run: `dotnet test src/test/TutorHub.Application.UnitTests/TutorHub.Application.UnitTests.csproj`
Expected: All tests pass.

- [ ] **Step 3: Verify backend solution builds cleanly in Release mode**

Run: `dotnet build src/backend/TutorHub.sln -c Release`
Expected: Build succeeded with 0 warnings or errors.

- [ ] **Step 4: Run all frontend unit tests**

Run: `npm test` inside `src/frontend`
Expected: All frontend tests pass.

- [ ] **Step 5: Run frontend production build**

Run: `npm run build` inside `src/frontend`
Expected: Vite build completes successfully.

- [ ] **Step 6: Final commit if any tweaks needed**

```bash
git commit --allow-empty -m "chore: verify wishlist mechanism implementation"
```

