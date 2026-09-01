using MediatR;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Exceptions;
using TutorHub.Application.Common.Interfaces;
using TutorHub.Application.Features.Admin.Users.DTOs;
using TutorHub.Domain.Enums;

namespace TutorHub.Application.Features.Admin.Users.GetAdminUserById;

public class GetAdminUserByIdQueryHandler : IRequestHandler<GetAdminUserByIdQuery, AdminUserDetailDto>
{
    private readonly IAppDbContext _context;

    public GetAdminUserByIdQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminUserDetailDto> Handle(GetAdminUserByIdQuery request, CancellationToken cancellationToken)
    {
        // 1. Basic User Info
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            throw new NotFoundException("User", request.UserId);
        }

        // 2. Tutor Profile Details (if user is Tutor)
        AdminUserTutorProfileDto? tutorProfileDto = null;
        if (user.Role == UserRole.Tutor)
        {
            var tutorProfile = await _context.TutorProfiles
                .AsNoTracking()
                .Include(t => t.TutorSubjects)
                    .ThenInclude(ts => ts.Subject)
                .Include(t => t.Wallet)
                .FirstOrDefaultAsync(t => t.UserId == user.Id, cancellationToken);

            if (tutorProfile != null)
            {
                var subjects = tutorProfile.TutorSubjects
                    .Select(ts => new AdminUserSubjectDto(ts.SubjectId, ts.Subject.Name))
                    .ToList();

                var totalCompletedSessions = await _context.Bookings
                    .AsNoTracking()
                    .CountAsync(b => b.TutorProfileId == tutorProfile.Id && b.Status == BookingStatus.Completed, cancellationToken);

                tutorProfileDto = new AdminUserTutorProfileDto(
                    Id: tutorProfile.Id,
                    Bio: tutorProfile.Bio,
                    Education: tutorProfile.Education,
                    ExperienceYears: tutorProfile.ExperienceYears,
                    HourlyRate: tutorProfile.HourlyRate,
                    TeachingMode: tutorProfile.TeachingMode,
                    Address: tutorProfile.Address,
                    Status: tutorProfile.Status,
                    RatingAvg: tutorProfile.RatingAvg,
                    TotalReviews: tutorProfile.TotalReviews,
                    WalletBalance: tutorProfile.Wallet?.AvailableBalance,
                    Subjects: subjects,
                    TotalCompletedSessions: totalCompletedSessions
                );
            }
        }

        // 3. Student Profile Details (if user is Student)
        AdminUserStudentProfileDto? studentProfileDto = null;
        if (user.Role == UserRole.Student)
        {
            var studentProfile = await _context.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == user.Id, cancellationToken);

            if (studentProfile != null)
            {
                var totalBookingsAsStudent = await _context.Bookings
                    .AsNoTracking()
                    .CountAsync(b => b.StudentProfileId == studentProfile.Id, cancellationToken);

                var totalSpent = await _context.Bookings
                    .AsNoTracking()
                    .Where(b => b.StudentProfileId == studentProfile.Id && b.Status == BookingStatus.Completed)
                    .SumAsync(b => b.TotalAmount, cancellationToken);

                studentProfileDto = new AdminUserStudentProfileDto(
                    TotalBookingsAsStudent: totalBookingsAsStudent,
                    TotalSpent: totalSpent
                );
            }
        }

        // 4. Top 10 Recent Bookings (as student or tutor)
        var recentBookings = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.StudentProfile.UserId == user.Id || b.TutorProfile.UserId == user.Id)
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .Select(b => new AdminUserRecentBookingDto(
                b.Id,
                b.Subject.Name,
                b.StudentProfile.UserId == user.Id ? b.TutorProfile.User.FullName : b.StudentProfile.User.FullName,
                b.Status,
                b.TotalAmount,
                b.StartAt,
                b.EndAt,
                b.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new AdminUserDetailDto(
            Id: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            Phone: user.Phone,
            AvatarUrl: user.AvatarUrl,
            Role: user.Role,
            Status: user.Status,
            CreatedAt: user.CreatedAt,
            TutorProfile: tutorProfileDto,
            StudentProfile: studentProfileDto,
            RecentBookings: recentBookings
        );
    }
}
