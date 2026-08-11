# Database Schema — Code First (EF Core + PostgreSQL)

**Stack:** .NET (ASP.NET Core Web API) + Entity Framework Core + PostgreSQL (Npgsql provider)
**Cách tiếp cận:** Code First — thiết kế Entity classes trước, EF Core Migrations tự sinh DB.

---

## 1. Enums

```csharp
public enum UserRole
{
    Student,
    Tutor,
    Admin
}

public enum TeachingMode
{
    Online,
    Offline,
    Both
}

public enum TutorProfileStatus
{
    PendingReview,
    Verified,
    Rejected,
    Suspended
}

public enum BookingStatus
{
    Holding,     // đang giữ chỗ tạm 15 phút chờ thanh toán
    Pending,     // đã thanh toán, chờ gia sư xác nhận
    Confirmed,   // gia sư đã xác nhận
    Completed,   // buổi học hoàn thành, đã giải ngân
    Cancelled    // bị hủy (bởi học viên/gia sư/hệ thống)
}

public enum PaymentStatus
{
    Held,        // tiền đang giữ ở nền tảng
    Released,    // đã chuyển cho gia sư
    Refunded     // đã hoàn cho học viên
}

public enum TransactionType
{
    Payment,     // học viên trả tiền khi đặt lịch
    Payout,      // giải ngân cho gia sư
    Refund       // hoàn tiền cho học viên
}

public enum CancelledBy
{
    Student,
    Tutor,
    System       // hệ thống tự hủy do quá hạn
}

public enum ReportStatus
{
    Open,
    Resolved
}

public enum ReportedByRole
{
    Student,
    Tutor
}
```

> **Ghi chú:** dùng `HasConversion<string>()` trong Fluent API để lưu enum dạng string trong Postgres (dễ đọc, dễ debug hơn số nguyên) — xem mục 4.

---

## 2. Entities

### 2.1 User (bảng gốc, dùng chung cho cả 3 role)

```csharp
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true; // dùng khi admin khóa tài khoản
    public DateTime CreatedAt { get; set; }

    // Navigation
    public TutorProfile? TutorProfile { get; set; } // null nếu role != Tutor
    public ICollection<Booking> BookingsAsStudent { get; set; } = new List<Booking>();
    public ICollection<Review> ReviewsWritten { get; set; } = new List<Review>();
    public ICollection<Report> ReportsFiled { get; set; } = new List<Report>();
}
```

### 2.2 TutorProfile (1-1 với User, chỉ tồn tại khi Role = Tutor)

```csharp
public class TutorProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Bio { get; set; } = default!;
    public string Education { get; set; } = default!;
    public int ExperienceYears { get; set; }
    public decimal HourlyRate { get; set; } // giá mặc định, có thể override theo môn ở TutorSubject
    public TeachingMode TeachingMode { get; set; }
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public TutorProfileStatus Status { get; set; } = TutorProfileStatus.PendingReview;
    public string? RejectionReason { get; set; }
    public Guid? ReviewedByAdminId { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public decimal RatingAvg { get; set; } = 0;
    public int TotalReviews { get; set; } = 0;

    // Navigation
    public ICollection<TutorSubject> TutorSubjects { get; set; } = new List<TutorSubject>();
    public ICollection<AvailabilitySlot> AvailabilitySlots { get; set; } = new List<AvailabilitySlot>();
    public ICollection<BlockedDate> BlockedDates { get; set; } = new List<BlockedDate>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public Wallet? Wallet { get; set; }
}
```

### 2.3 Subject (danh mục môn học, chuẩn hóa để search/filter)

```csharp
public class Subject
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;   // VD: "Toán lớp 10"
    public string Category { get; set; } = default!; // VD: "Toán học"

    public ICollection<TutorSubject> TutorSubjects { get; set; } = new List<TutorSubject>();
}
```

### 2.4 TutorSubject (join table, cho phép giá riêng theo môn)

```csharp
public class TutorSubject
{
    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = default!;

    public decimal? OverridePrice { get; set; } // null = dùng HourlyRate mặc định của gia sư
}
```

### 2.5 AvailabilitySlot (lịch rảnh cố định theo tuần)

```csharp
public class AvailabilitySlot
{
    public Guid Id { get; set; }
    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public DayOfWeek DayOfWeek { get; set; } // enum sẵn có của .NET
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}
```

### 2.6 BlockedDate (override — gia sư nghỉ đột xuất 1 ngày cụ thể)

```csharp
public class BlockedDate
{
    public Guid Id { get; set; }
    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public DateOnly Date { get; set; }
    public string? Reason { get; set; }
}
```

### 2.7 Booking (bảng trung tâm)

```csharp
public class Booking
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }
    public User Student { get; set; } = default!;

    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = default!;

    public DateTime StartTime { get; set; } // UTC
    public DateTime EndTime { get; set; }   // UTC

    public BookingStatus Status { get; set; } = BookingStatus.Holding;
    public decimal Price { get; set; }

    public CancelledBy? CancelledBy { get; set; }
    public string? CancellationReason { get; set; }

    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime HoldExpiresAt { get; set; } // thời điểm hết hạn soft-lock 15 phút

    public DateTime CreatedAt { get; set; }

    // Navigation
    public Transaction? Transaction { get; set; }
    public Review? Review { get; set; }
    public ICollection<Report> Reports { get; set; } = new List<Report>();
}
```

### 2.8 Transaction (thanh toán — đã để sẵn field hoa hồng cho tương lai)

```csharp
public class Transaction
{
    public Guid Id { get; set; }

    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = default!;

    public decimal Amount { get; set; }              // tổng tiền học viên trả
    public decimal CommissionRate { get; set; } = 0;  // % hoa hồng, mặc định 0
    public decimal CommissionAmount { get; set; } = 0;
    public decimal PayoutAmount { get; set; }         // Amount - CommissionAmount

    public TransactionType Type { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Held;

    public string? PaymentGatewayRef { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### 2.9 Wallet (ví nội bộ của gia sư)

```csharp
public class Wallet
{
    public Guid Id { get; set; }

    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public decimal PendingBalance { get; set; } = 0;   // tiền đang held, booking chưa completed
    public decimal AvailableBalance { get; set; } = 0; // tiền đã released, rút được

    public DateTime UpdatedAt { get; set; }
}
```

### 2.10 Review

```csharp
public class Review
{
    public Guid Id { get; set; }

    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = default!;

    // Học viên đánh giá gia sư — công khai
    public int? StudentToTutorRating { get; set; }   // 1-5
    public string? StudentToTutorComment { get; set; }

    // Gia sư đánh giá học viên — chỉ admin thấy
    public int? TutorToStudentRating { get; set; }    // 1-5
    public string? TutorToStudentComment { get; set; }

    public DateTime CreatedAt { get; set; }
}
```

### 2.11 Report (khiếu nại gắn theo booking)

```csharp
public class Report
{
    public Guid Id { get; set; }

    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = default!;

    public Guid ReportedByUserId { get; set; }
    public User ReportedByUser { get; set; } = default!;
    public ReportedByRole ReportedByRole { get; set; }

    public string Description { get; set; } = default!;
    public string? EvidenceUrl { get; set; } // link ảnh minh chứng, optional

    public ReportStatus Status { get; set; } = ReportStatus.Open;
    public string? AdminResolutionNote { get; set; }
    public Guid? ResolvedByAdminId { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
```

---

## 3. Sơ đồ quan hệ (tóm tắt)

```
User (1) ── (1) TutorProfile ── (1) Wallet
                    │
                    ├── (n) TutorSubject ── (n) Subject
                    ├── (n) AvailabilitySlot
                    ├── (n) BlockedDate
                    └── (n) Booking ── (1) Transaction
                                    ── (1) Review
                                    ── (n) Report ── User (ReportedByUser)

User (Student) ── (n) Booking
```

---

## 4. Fluent API Configuration — các điểm quan trọng

```csharp
public class AppDbContext : DbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<TutorProfile> TutorProfiles => Set<TutorProfile>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TutorSubject> TutorSubjects => Set<TutorSubject>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();
    public DbSet<BlockedDate> BlockedDates => Set<BlockedDate>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Report> Reports => Set<Report>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ---- User ----
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasConversion<string>();
        });

        // ---- TutorProfile (1-1 với User) ----
        modelBuilder.Entity<TutorProfile>(e =>
        {
            e.HasOne(t => t.User)
                .WithOne(u => u.TutorProfile)
                .HasForeignKey<TutorProfile>(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.Property(t => t.Status).HasConversion<string>();
            e.Property(t => t.TeachingMode).HasConversion<string>();
            e.Property(t => t.HourlyRate).HasPrecision(10, 2);
            e.Property(t => t.RatingAvg).HasPrecision(3, 2);

            e.HasIndex(t => t.Status); // query nhanh danh sách verified
        });

        // ---- TutorSubject (composite key) ----
        modelBuilder.Entity<TutorSubject>(e =>
        {
            e.HasKey(ts => new { ts.TutorProfileId, ts.SubjectId });
            e.Property(ts => ts.OverridePrice).HasPrecision(10, 2);
        });

        // ---- AvailabilitySlot ----
        modelBuilder.Entity<AvailabilitySlot>(e =>
        {
            e.Property(a => a.DayOfWeek).HasConversion<string>();
            e.HasIndex(a => new { a.TutorProfileId, a.DayOfWeek });
        });

        // ---- BlockedDate ----
        modelBuilder.Entity<BlockedDate>(e =>
        {
            e.HasIndex(b => new { b.TutorProfileId, b.Date }).IsUnique();
        });

        // ---- Booking ----
        modelBuilder.Entity<Booking>(e =>
        {
            e.Property(b => b.Status).HasConversion<string>();
            e.Property(b => b.CancelledBy).HasConversion<string>();
            e.Property(b => b.Price).HasPrecision(10, 2);

            e.HasOne(b => b.Student)
                .WithMany(u => u.BookingsAsStudent)
                .HasForeignKey(b => b.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(b => b.TutorProfile)
                .WithMany(t => t.Bookings)
                .HasForeignKey(b => b.TutorProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            // Index quan trọng: check conflict nhanh khi đặt lịch
            e.HasIndex(b => new { b.TutorProfileId, b.StartTime, b.EndTime, b.Status });
        });

        // ---- Transaction (1-1 với Booking) ----
        modelBuilder.Entity<Transaction>(e =>
        {
            e.HasOne(t => t.Booking)
                .WithOne(b => b.Transaction)
                .HasForeignKey<Transaction>(t => t.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            e.Property(t => t.Type).HasConversion<string>();
            e.Property(t => t.Status).HasConversion<string>();
            e.Property(t => t.Amount).HasPrecision(10, 2);
            e.Property(t => t.CommissionRate).HasPrecision(5, 2);
            e.Property(t => t.CommissionAmount).HasPrecision(10, 2);
            e.Property(t => t.PayoutAmount).HasPrecision(10, 2);
        });

        // ---- Wallet (1-1 với TutorProfile) ----
        modelBuilder.Entity<Wallet>(e =>
        {
            e.HasOne(w => w.TutorProfile)
                .WithOne(t => t.Wallet)
                .HasForeignKey<Wallet>(w => w.TutorProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            e.Property(w => w.PendingBalance).HasPrecision(12, 2);
            e.Property(w => w.AvailableBalance).HasPrecision(12, 2);
        });

        // ---- Review (1-1 với Booking) ----
        modelBuilder.Entity<Review>(e =>
        {
            e.HasOne(r => r.Booking)
                .WithOne(b => b.Review)
                .HasForeignKey<Review>(r => r.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---- Report ----
        modelBuilder.Entity<Report>(e =>
        {
            e.Property(r => r.ReportedByRole).HasConversion<string>();
            e.Property(r => r.Status).HasConversion<string>();

            e.HasOne(r => r.Booking)
                .WithMany(b => b.Reports)
                .HasForeignKey(r => r.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.ReportedByUser)
                .WithMany(u => u.ReportsFiled)
                .HasForeignKey(r => r.ReportedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
```

---

## 5. Các quyết định thiết kế đáng lưu ý

| Quyết định | Lý do |
|---|---|
| `TutorProfile` tách riêng khỏi `User` (1-1) thay vì thêm cột vào `User` | Học viên không cần các field như `HourlyRate`, `Bio`... → tránh bảng `User` có quá nhiều cột null |
| `TutorSubject` có `OverridePrice` riêng | Cho phép gia sư dạy nhiều môn với giá khác nhau (VD: Toán 200k/h, Lý 150k/h) mà không cần nhiều bảng giá phức tạp |
| `AvailabilitySlot` dùng `DayOfWeek` + `TimeOnly` (kiểu built-in của .NET) | Đúng với quyết định "lịch cố định theo tuần", không cần lưu ngày cụ thể |
| `BlockedDate` tách bảng riêng, không nhét vào `AvailabilitySlot` | Giữ 2 khái niệm độc lập: lịch định kỳ vs. ngoại lệ 1 ngày — dễ query, dễ mở rộng |
| `Transaction` có sẵn `CommissionRate`/`CommissionAmount` dù = 0 | Đã thống nhất ở PRD: để sẵn chỗ mở rộng hoa hồng mà không cần migration lớn sau này |
| `Wallet` tách bảng riêng thay vì tính runtime từ `Transaction` | Tránh phải `SUM()` toàn bộ transaction mỗi lần hiển thị số dư — đánh đổi lấy hiệu năng, cập nhật `Wallet` mỗi khi `Transaction` đổi trạng thái |
| `Review` gộp 2 chiều (student→tutor, tutor→student) trong 1 bảng, không tách 2 bảng | Vì luôn 1-1 với `Booking`, gộp lại tránh JOIN thừa; ẩn/hiện theo field is đơn giản ở tầng API |
| `Report` gắn `BookingId` bắt buộc (không cho report chung chung) | Đúng nghiệp vụ đã chốt — mọi report phải có ngữ cảnh booking cụ thể để admin dễ xử lý |
| Index `(TutorProfileId, StartTime, EndTime, Status)` trên `Booking` | Phục vụ trực tiếp cho câu query kiểm tra conflict khi đặt lịch (mục 6.2 trong PRD) |
| Enum lưu dạng `string` (`HasConversion<string>()`) | Dễ đọc trực tiếp trong DB khi debug, đánh đổi một chút dung lượng lưu trữ |

---

## 6. Xử lý Race Condition khi đặt lịch (áp dụng ở tầng Repository/Service)

EF Core không tự có `SELECT ... FOR UPDATE`, cần dùng transaction + kiểm tra tại tầng ứng dụng, hoặc raw SQL nếu cần lock chặt:

```csharp
public async Task<Booking> CreateBookingAsync(CreateBookingDto dto)
{
    await using var transaction = await _dbContext.Database.BeginTransactionAsync(
        IsolationLevel.Serializable); // đảm bảo không đọc dữ liệu "bẩn" giữa 2 request đồng thời

    try
    {
        var conflict = await _dbContext.Bookings
            .Where(b => b.TutorProfileId == dto.TutorProfileId)
            .Where(b => b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed)
            .Where(b => b.StartTime < dto.EndTime && b.EndTime > dto.StartTime) // overlap check
            .AnyAsync();

        if (conflict)
            throw new ConflictException("Khung giờ đã có người đặt");

        var booking = new Booking { /* ... */ };
        _dbContext.Bookings.Add(booking);
        await _dbContext.SaveChangesAsync();

        await transaction.CommitAsync();
        return booking;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

> Dùng `IsolationLevel.Serializable` cho riêng luồng tạo booking (không cần áp dụng toàn hệ thống) để tránh 2 transaction đồng thời cùng pass qua bước kiểm tra conflict.

---
