using TutorHub.Domain.Entities;
using TutorHub.Domain.Enums;

namespace TutorHub.Domain.UnitTests.Common.Builders;

public class BookingBuilder
{
    private static readonly DateTime DefaultStartAt = new(2030, 1, 10, 10, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime DefaultEndAt = new(2030, 1, 10, 11, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime DefaultCreatedAt = new(2030, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private Guid _id = Guid.NewGuid();
    private StudentProfile? _studentProfile;
    private TutorProfile? _tutorProfile;
    private Subject? _subject;
    private DateTime _startAt = DefaultStartAt;
    private DateTime _endAt = DefaultEndAt;
    private decimal _hourlyRate = 200_000m;
    private decimal? _totalAmount;
    private BookingStatus _status = BookingStatus.Pending;
    private DateTime? _holdingExpiresAt;
    private DateTime? _confirmedAt;
    private DateTime? _completedAt;
    private DateTime? _cancelledAt;
    private CancelledBy? _cancelledBy;
    private string? _cancellationReason;
    private Transaction? _transaction;

    private Guid? _serviceId;
    private Service? _service;
    private decimal _totalPrice = 200_000m;
    private int _totalSessions = 1;
    private int _sessionDurationMinutes = 60;
    private TeachingMode _teachingMode = TeachingMode.Online;
    private Enrollment? _enrollment;

    public BookingBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public BookingBuilder WithService(Service service)
    {
        _service = service;
        _serviceId = service.Id;
        return this;
    }

    public BookingBuilder WithServiceId(Guid serviceId)
    {
        _serviceId = serviceId;
        return this;
    }

    public BookingBuilder WithSnapshot(decimal totalPrice, int totalSessions = 1, int sessionDurationMinutes = 60, TeachingMode teachingMode = TeachingMode.Online)
    {
        _totalPrice = totalPrice;
        _totalSessions = totalSessions;
        _sessionDurationMinutes = sessionDurationMinutes;
        _teachingMode = teachingMode;
        return this;
    }

    public BookingBuilder WithEnrollment(Enrollment enrollment)
    {
        _enrollment = enrollment;
        return this;
    }

    public BookingBuilder WithStudent(StudentProfile studentProfile)
    {
        _studentProfile = studentProfile;
        return this;
    }

    public BookingBuilder WithTutor(TutorProfile tutorProfile)
    {
        _tutorProfile = tutorProfile;
        return this;
    }

    public BookingBuilder WithSubject(Subject subject)
    {
        _subject = subject;
        return this;
    }

    public BookingBuilder WithSchedule(DateTime startAt, DateTime endAt)
    {
        _startAt = startAt;
        _endAt = endAt;
        return this;
    }

    public BookingBuilder WithPricing(decimal hourlyRate, decimal? totalAmount = null)
    {
        _hourlyRate = hourlyRate;
        _totalAmount = totalAmount;
        return this;
    }

    public BookingBuilder WithStatus(BookingStatus status)
    {
        _status = status;
        return this;
    }

    public BookingBuilder WithHoldingExpiresAt(DateTime? expiresAt)
    {
        _holdingExpiresAt = expiresAt;
        return this;
    }

    public BookingBuilder WithConfirmedAt(DateTime? confirmedAt)
    {
        _confirmedAt = confirmedAt;
        return this;
    }

    public BookingBuilder WithCompletedAt(DateTime? completedAt)
    {
        _completedAt = completedAt;
        return this;
    }

    public BookingBuilder WithCancellation(CancelledBy actor, string reason, DateTime? cancelledAt = null)
    {
        _status = BookingStatus.Cancelled;
        _cancelledBy = actor;
        _cancellationReason = reason;
        _cancelledAt = cancelledAt ?? new DateTime(2030, 1, 9, 12, 0, 0, DateTimeKind.Utc);
        return this;
    }

    public BookingBuilder WithTransaction(Transaction? transaction)
    {
        _transaction = transaction;
        return this;
    }

    public Booking Build()
    {
        var student = _studentProfile ?? new StudentProfileBuilder().Build();
        var tutor = _tutorProfile ?? new TutorProfileBuilder().Build();
        var subject = _subject ?? new SubjectBuilder().Build();

        var durationHours = (decimal)(_endAt - _startAt).TotalHours;
        var totalAmount = _totalAmount ?? (_hourlyRate * (durationHours > 0 ? durationHours : 1m));

        var booking = new Booking
        {
            Id = _id,
            StudentProfileId = student.Id,
            StudentProfile = student,
            TutorProfileId = tutor.Id,
            TutorProfile = tutor,
            SubjectId = subject.Id,
            Subject = subject,
            StartAt = _startAt,
            EndAt = _endAt,
            HourlyRate = _hourlyRate,
            TotalAmount = totalAmount,
            Status = _status,
            HoldingExpiresAt = _holdingExpiresAt,
            ConfirmedAt = _confirmedAt,
            CompletedAt = _completedAt,
            CancelledAt = _cancelledAt,
            CancelledBy = _cancelledBy,
            CancellationReason = _cancellationReason,
            CreatedAt = DefaultCreatedAt,
            ServiceId = _serviceId,
            Service = _service,
            TotalPrice = _totalPrice,
            TotalSessions = _totalSessions,
            SessionDurationMinutes = _sessionDurationMinutes,
            TeachingMode = _teachingMode,
            Enrollment = _enrollment,
            Transaction = _transaction,
            Reports = new List<Report>()
        };

        if (_transaction != null)
        {
            _transaction.BookingId = booking.Id;
            _transaction.Booking = booking;
        }

        return booking;
    }
}
