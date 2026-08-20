# Database Schema — Code First (EF Core + PostgreSQL)

**Stack:** .NET 8 (ASP.NET Core Web API) + Entity Framework Core 8 + PostgreSQL (Npgsql)  
**ORM Approach:** Code First với Fluent API Configuration  

---

## 1. Hệ Thống Enums

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
    Draft,
    PendingReview,
    Verified,
    Rejected,
    Suspended
}

public enum BookingStatus
{
    Holding,     // Đang giữ chỗ 15 phút chờ thanh toán
    Pending,     // Đã thanh toán, chờ gia sư xác nhận
    Confirmed,   // Gia sư đã xác nhận
    Completed,   // Buổi học hoàn thành, đã giải ngân
    Cancelled,   // Bị hủy (học viên / gia sư / hệ thống)
    Expired
}

public enum TransactionStatus
{
    Held,        // Tiền tạm giữ bảo đảm trên sàn sau thanh toán
    Released,    // Đã giải ngân cho gia sư sau khi hoàn thành buổi học
    Refunded     // Đã hoàn tiền cho học viên do hủy/tranh chấp
}

public enum CancelledBy
{
    Student,
    Tutor,
    System
}

public enum WithdrawalStatus
{
    Pending,
    Approved,
    Rejected
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

---

## 2. Danh Sách Thực Thể (Entities)

### 2.1 `User`
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
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    // Navigation
    public TutorProfile? TutorProfile { get; set; }
    public StudentProfile? StudentProfile { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Report> ReportsCreated { get; set; } = new List<Report>();
}
```

### 2.2 `TutorProfile`
```csharp
public class TutorProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Bio { get; set; } = default!;
    public string Education { get; set; } = default!;
    public int ExperienceYears { get; set; }
    public decimal HourlyRate { get; set; }
    public TeachingMode TeachingMode { get; set; }
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public TutorProfileStatus Status { get; set; } = TutorProfileStatus.PendingReview;
    public string? RejectionReason { get; set; }
    public Guid? ReviewedByAdminId { get; set; }
    public User? ReviewedByAdmin { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public decimal RatingAvg { get; set; } = 0;
    public int TotalReviews { get; set; } = 0;

    // Navigation
    public ICollection<TutorSubject> TutorSubjects { get; set; } = new List<TutorSubject>();
    public ICollection<AvailabilitySlot> AvailabilitySlots { get; set; } = new List<AvailabilitySlot>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public Wallet? Wallet { get; set; }
}
```

### 2.3 `StudentProfile`
```csharp
public class StudentProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
```

### 2.4 `Category` & `Subject`
```csharp
public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public Guid? ParentId { get; set; }
    public Category? Parent { get; set; }
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

public class Subject
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public ICollection<TutorSubject> TutorSubjects { get; set; } = new List<TutorSubject>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
```

### 2.5 `Booking`
```csharp
public class Booking
{
    public Guid Id { get; set; }
    public Guid StudentProfileId { get; set; }
    public StudentProfile StudentProfile { get; set; } = default!;
    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;
    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = default!;

    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal TotalAmount { get; set; }
    public BookingStatus Status { get; set; }

    public DateTime? HoldingExpiresAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public CancelledBy? CancelledBy { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; }

    public Transaction? Transaction { get; set; }
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<Report> Reports { get; set; } = new List<Report>();
}
```

### 2.6 `Transaction`
```csharp
public class Transaction
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = default!;

    public decimal Amount { get; set; }
    public TransactionStatus Status { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal PayoutAmount { get; set; }
    public string? PaymentGatewayRef { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReleasedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
}
```

### 2.7 `Wallet` & `Withdrawal`
```csharp
public class Wallet
{
    public Guid Id { get; set; }
    public Guid TutorProfileId { get; set; }
    public TutorProfile TutorProfile { get; set; } = default!;

    public decimal PendingBalance { get; set; }
    public decimal AvailableBalance { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Withdrawal> Withdrawals { get; set; } = new List<Withdrawal>();
}

public class Withdrawal
{
    public Guid Id { get; set; }
    public Guid WalletId { get; set; }
    public Wallet Wallet { get; set; } = default!;

    public decimal Amount { get; set; }
    public string BankName { get; set; } = default!;
    public string AccountNumber { get; set; } = default!;
    public string AccountHolderName { get; set; } = default!;
    public string? Note { get; set; }

    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;
    public string? RejectionReason { get; set; }
    public Guid? ProcessedByAdminId { get; set; }
    public User? ProcessedByAdmin { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

---

## 3. Database Indexes & Ràng Buộc (Constraints)

* **Unique Constraints:**
  * `IX_Users_Email` (UNIQUE)
  * `IX_TutorProfiles_UserId` (UNIQUE)
  * `IX_StudentProfiles_UserId` (UNIQUE)
  * `IX_Wallets_TutorProfileId` (UNIQUE)
  * `IX_Transactions_BookingId` (UNIQUE)
  * `IX_TutorSubjects_TutorProfileId_SubjectId` (UNIQUE)
* **Performance & Filter Indexes:**
  * `IX_Bookings_TutorProfileId_StartAt_EndAt_Status`
  * `IX_Bookings_StudentProfileId_CreatedAt`
  * `IX_Transactions_CreatedAt`
  * `IX_Transactions_PaymentGatewayRef`
  * `IX_TutorProfiles_Status_RatingAvg_HourlyRate`
