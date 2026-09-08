-- =============================================================================
-- TutorHub Platform - Seed Data Script (package-based schema, v1.1)
-- =============================================================================
-- Model: Service → Booking (Holding 15m → Pending) → Enrollment
-- (Pending → Active) → N Sessions → dual attendance → payout →
-- Wallet (Pending/Available/Held). Single-slot columns are gone by design
-- (DEC-S8-020): no StartAt/EndAt/HourlyRate/TotalAmount on Bookings, no
-- HourlyRate on TutorProfiles, no OverridePrice on TutorSubjects, Reviews are
-- enrollment-centric. All statements are idempotent (ON CONFLICT DO NOTHING).
--
-- Demo scenario:
--   A. Fresh purchase: student.tuan buys Toán 10-session package (escrow held).
--   B. Finished course: student.lan completed a 1-session IELTS package
--      (payout released + review).
--   C. Custom negotiation: Proposed CustomAgreement (tutor.nam + student.tuan).

-- 1. USERS (Admin, Tutors, Students)
-- Password hash sample: BCrypt hash for "Test@123"
INSERT INTO "Users" ("Id", "Email", "PasswordHash", "FullName", "Phone", "AvatarUrl", "Role", "Status", "CreatedAt")
VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@tutorhub.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Quản Trị Viên Hệ Thống', '0901234567', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'Admin', 'Active', NOW()),
    ('22222222-1111-1111-1111-111111111111', 'tutor.an@tutorhub.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyễn Văn An', '0912345678', 'https://api.dicebear.com/7.x/avataaars/svg?seed=an', 'Tutor', 'Active', NOW()),
    ('33333333-1111-1111-1111-111111111111', 'tutor.bich@tutorhub.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trần Thị Bích', '0923456789', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bich', 'Tutor', 'Active', NOW()),
    ('44444444-1111-1111-1111-111111111111', 'tutor.nam@tutorhub.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lê Hoàng Nam', '0934567890', 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam', 'Tutor', 'Active', NOW()),
    ('55555555-1111-1111-1111-111111111111', 'student.tuan@tutorhub.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Phạm Minh Tuấn', '0945678901', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tuan', 'Student', 'Active', NOW()),
    ('66666666-1111-1111-1111-111111111111', 'student.lan@tutorhub.com', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Hoàng Lan Anh', '0956789012', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lan', 'Student', 'Active', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- 2. STUDENT PROFILES
INSERT INTO "StudentProfiles" ("Id", "UserId")
VALUES
    ('55555555-2222-2222-2222-111111111111', '55555555-1111-1111-1111-111111111111'),
    ('66666666-2222-2222-2222-111111111111', '66666666-1111-1111-1111-111111111111')
ON CONFLICT ("Id") DO NOTHING;

-- 3. TUTOR APPLICATIONS
INSERT INTO "TutorApplications" (
    "Id", "UserId", "Bio", "Education", "ExperienceYears", "TeachingMode",
    "Address", "Latitude", "Longitude", "Status", "SubmittedAt",
    "RejectionReason", "ReviewedByAdminId", "ReviewedAt"
)
VALUES
    (
        '22222222-aaaa-aaaa-aaaa-111111111111', '22222222-1111-1111-1111-111111111111',
        'Thầy giáo chuyên luyện thi THPT Quốc Gia môn Toán với 5 năm kinh nghiệm. Phương pháp giảng dạy trực quan, dễ hiểu.',
        'Cử nhân Sư phạm Toán - ĐH Sư phạm Hà Nội', 5, 'Both',
        '123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội', 21.0333, 105.7833, 'Approved', NOW(),
        NULL, '11111111-1111-1111-1111-111111111111', NOW()
    ),
    (
        '33333333-aaaa-aaaa-aaaa-111111111111', '33333333-1111-1111-1111-111111111111',
        'Giảng viên Tiếng Anh IELTS 8.0, chuyên luyện giao tiếp phản xạ và chiến thuật phòng thi.',
        'Thạc sĩ Ngôn ngữ Anh - ĐH Ngoại Thương', 4, 'Online',
        NULL, NULL, NULL, 'Approved', NOW(),
        NULL, '11111111-1111-1111-1111-111111111111', NOW()
    ),
    (
        '44444444-aaaa-aaaa-aaaa-111111111111', '44444444-1111-1111-1111-111111111111',
        'Kỹ sư phần mềm & Gia sư Vật lý. Hướng dẫn lập trình C# .NET và tư duy giải toán vật lý.',
        'Kỹ sư CNTT - ĐH Bách Khoa Hà Nội', 2, 'Online',
        NULL, NULL, NULL, 'Pending', NOW(),
        NULL, NULL, NULL
    )
ON CONFLICT ("Id") DO NOTHING;

-- 4. TUTOR PROFILES (created upon application approval; no HourlyRate by design)
INSERT INTO "TutorProfiles" (
    "Id", "UserId", "Bio", "Education", "ExperienceYears",
    "TeachingMode", "Address", "Latitude", "Longitude", "RatingAvg", "TotalReviews"
)
VALUES
    (
        '22222222-2222-2222-2222-111111111111', '22222222-1111-1111-1111-111111111111',
        'Thầy giáo chuyên luyện thi THPT Quốc Gia môn Toán với 5 năm kinh nghiệm.',
        'Cử nhân Sư phạm Toán - ĐH Sư phạm Hà Nội', 5,
        'Both', '123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội', 21.0333, 105.7833, 0.00, 0
    ),
    (
        '33333333-2222-2222-2222-111111111111', '33333333-1111-1111-1111-111111111111',
        'Giảng viên Tiếng Anh IELTS 8.0, chuyên luyện giao tiếp phản xạ và chiến thuật phòng thi.',
        'Thạc sĩ Ngôn ngữ Anh - ĐH Ngoại Thương', 4,
        'Online', NULL, NULL, NULL, 5.00, 1
    )
ON CONFLICT ("Id") DO NOTHING;

-- 5. WALLETS (1-1 with TutorProfiles; HeldBalance required, 0 when no dispute)
INSERT INTO "Wallets" ("Id", "TutorProfileId", "PendingBalance", "AvailableBalance", "HeldBalance", "UpdatedAt")
VALUES
    ('22222222-3333-3333-3333-111111111111', '22222222-2222-2222-2222-111111111111', 2000000.00, 0.00, 0.00, NOW()),
    ('33333333-3333-3333-3333-111111111111', '33333333-2222-2222-2222-111111111111', 0.00, 270000.00, 0.00, NOW())
ON CONFLICT ("Id") DO NOTHING;

-- 6. CATEGORIES
INSERT INTO "Categories" ("Id", "Name", "Description", "IsActive")
VALUES
    ('11111111-0000-0000-0000-000000000001', 'Toán học', 'Các môn toán từ cơ bản đến nâng cao, luyện thi chuyển cấp và đại học', true),
    ('11111111-0000-0000-0000-000000000002', 'Ngoại ngữ', 'Tiếng Anh, Tiếng Trung, Tiếng Nhật, Tiếng Hàn và luyện thi chứng chỉ quốc tế', true),
    ('11111111-0000-0000-0000-000000000003', 'Khoa học tự nhiên', 'Vật lý, Hóa học, Sinh học các cấp', true),
    ('11111111-0000-0000-0000-000000000004', 'Công nghệ thông tin', 'Lập trình phần mềm, thiết kế web, khoa học dữ liệu', true),
    ('11111111-0000-0000-0000-000000000005', 'Khoa học xã hội', 'Ngữ văn, Lịch sử, Địa lý', true)
ON CONFLICT ("Id") DO NOTHING;

-- 7. SUBJECTS
INSERT INTO "Subjects" ("Id", "Name", "CategoryId", "IsActive")
VALUES
    ('aaaaaaaa-0001-0000-0000-000000000000', 'Toán THPT (Lớp 10-12)', '11111111-0000-0000-0000-000000000001', true),
    ('aaaaaaaa-0002-0000-0000-000000000000', 'Tiếng Anh Giao Tiếp', '11111111-0000-0000-0000-000000000002', true),
    ('aaaaaaaa-0003-0000-0000-000000000000', 'Luyện thi IELTS 6.5+', '11111111-0000-0000-0000-000000000002', true),
    ('aaaaaaaa-0004-0000-0000-000000000000', 'Vật lý THPT', '11111111-0000-0000-0000-000000000003', true),
    ('aaaaaaaa-0005-0000-0000-000000000000', 'Lập trình C# / .NET Core', '11111111-0000-0000-0000-000000000004', true)
ON CONFLICT ("Id") DO NOTHING;

-- 8. TUTOR SUBJECTS (pure mapping; no per-subject price by design)
INSERT INTO "TutorSubjects" ("Id", "TutorProfileId", "SubjectId", "IsActive")
VALUES
    ('bbbbbbbb-0001-0000-0000-000000000000', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000000', true),
    ('bbbbbbbb-0002-0000-0000-000000000000', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0002-0000-0000-000000000000', true),
    ('bbbbbbbb-0003-0000-0000-000000000000', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0003-0000-0000-000000000000', true)
ON CONFLICT ("Id") DO NOTHING;

-- 9. AVAILABILITY SLOTS (weekly recurring; DayOfWeek stored as string)
INSERT INTO "AvailabilitySlots" ("Id", "TutorProfileId", "DayOfWeek", "StartTime", "EndTime", "IsActive")
VALUES
    ('cccccccc-0001-0000-0000-000000000000', '22222222-2222-2222-2222-111111111111', 'Monday', '18:00:00', '20:00:00', true),
    ('cccccccc-0002-0000-0000-000000000000', '22222222-2222-2222-2222-111111111111', 'Wednesday', '18:00:00', '20:00:00', true),
    ('cccccccc-0003-0000-0000-000000000000', '33333333-2222-2222-2222-111111111111', 'Tuesday', '19:00:00', '21:00:00', true),
    ('cccccccc-0004-0000-0000-000000000000', '33333333-2222-2222-2222-111111111111', 'Thursday', '19:00:00', '21:00:00', true)
ON CONFLICT ("Id") DO NOTHING;

-- 10. SERVICES (packages; trial is an optional external URL, no TrialLesson table)
INSERT INTO "Services" (
    "Id", "TutorProfileId", "SubjectId", "Title", "Description",
    "TotalSessions", "SessionDurationMinutes", "Price", "TeachingMode",
    "TrialLessonUrl", "Status", "CreatedAt"
)
VALUES
    (
        '5e521ce5-0001-0000-0000-000000000000', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000000',
        'Toán THPT 10 buổi', 'Gói luyện thi THPT môn Toán: 10 buổi x 60 phút, kèm tài liệu và bài tập về nhà.',
        10, 60, 2000000.00, 'Both',
        NULL, 'Published', NOW() - INTERVAL '12 days'
    ),
    (
        '5e521ce5-0002-0000-0000-000000000000', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0003-0000-0000-000000000000',
        'IELTS cấp tốc 1 buổi', 'Buổi đánh giá trình độ + chiến thuật phòng thi IELTS, 1 x 60 phút.',
        1, 60, 300000.00, 'Online',
        NULL, 'Published', NOW() - INTERVAL '20 days'
    )
ON CONFLICT ("Id") DO NOTHING;

-- 11. BOOKINGS — scenario A: fresh paid package (Holding → Pending, escrow held)
INSERT INTO "Bookings" (
    "Id", "StudentProfileId", "TutorProfileId", "SubjectId", "ServiceId", "CustomAgreementId",
    "TotalPrice", "TotalSessions", "SessionDurationMinutes", "TeachingMode",
    "Status", "HoldingExpiresAt", "ConfirmedAt",
    "CompletedAt", "CancelledAt", "CancelledBy", "CancellationReason", "CreatedAt"
)
VALUES
    (
        'dddddddd-0001-0000-0000-000000000000',
        '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000000',
        '5e521ce5-0001-0000-0000-000000000000', NULL,
        2000000.00, 10, 60, 'Both',
        'Pending', NULL, NOW() - INTERVAL '2 days',
        NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days'
    )
ON CONFLICT ("Id") DO NOTHING;

-- 12. TRANSACTIONS — scenario A payment held in escrow (typed BookingPayment)
INSERT INTO "Transactions" (
    "Id", "BookingId", "SessionId", "Amount", "Type", "Status",
    "CommissionRate", "CommissionAmount", "PayoutAmount",
    "PaymentGatewayRef", "DisputeId", "RelatedTransactionId", "Description",
    "SettlementRequired", "CreatedAt", "ReleasedAt", "RefundedAt"
)
VALUES
    (
        'eeeeeeee-0001-0000-0000-000000000000', 'dddddddd-0001-0000-0000-000000000000', NULL,
        2000000.00, 'BookingPayment', 'Held',
        0, 0, 2000000.00,
        'PAY-VNPAY-20260901-0001', NULL, NULL, 'Scenario A package payment held in escrow',
        false, NOW() - INTERVAL '2 days', NULL, NULL
    )
ON CONFLICT ("Id") DO NOTHING;

-- 13. ENROLLMENTS — scenario A: Active contract with fee snapshot (DEC-S8-020)
INSERT INTO "Enrollments" (
    "Id", "BookingId", "StudentProfileId", "TutorProfileId", "ServiceId", "SubjectId",
    "TotalPrice", "TotalSessions", "SessionDurationMinutes", "TeachingMode",
    "PlatformFeeRate", "FeePolicyVersion", "CompletedSessions", "Status", "CreatedAt",
    "CompletedAt", "CancelledAt", "CancelledBy", "CancellationReason"
)
VALUES
    (
        'e1e1e1e1-0001-0000-0000-000000000000', 'dddddddd-0001-0000-0000-000000000000',
        '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111',
        '5e521ce5-0001-0000-0000-000000000000', 'aaaaaaaa-0001-0000-0000-000000000000',
        2000000.00, 10, 60, 'Both',
        0.10, 1, 0, 'Active', NOW() - INTERVAL '2 days',
        NULL, NULL, NULL, NULL
    )
ON CONFLICT ("Id") DO NOTHING;

-- 14. SESSIONS — scenario A: 10 Unscheduled sessions, 200k each (Σ = 2,000,000)
INSERT INTO "Sessions" (
    "Id", "EnrollmentId", "SessionNumber", "EarningAmount", "StartAt", "EndAt",
    "Status", "CreatedAt", "UpdatedAt", "CompletedAt", "CancelledAt",
    "AttendanceVerificationOpenedAt", "AttendanceVerificationDueAt",
    "StudentAttendance", "StudentAttendanceSubmittedAt",
    "TutorAttendance", "TutorAttendanceSubmittedAt",
    "HasAttendanceConflict", "IsPayoutReleased",
    "ResolutionNotes", "ResolutionSource", "ResolvedByAdminId", "AttendanceVerifiedAt"
)
SELECT ('a1a1a1a1-000' || lpad(g::text, 1, '0') || '-0000-0000-000000000000')::uuid,
       'e1e1e1e1-0001-0000-0000-000000000000', g, 200000.00, NULL, NULL,
       'Unscheduled', NOW() - INTERVAL '2 days', NULL, NULL, NULL,
       NULL, NULL,
       NULL, NULL,
       NULL, NULL,
       false, false,
       NULL, NULL, NULL, NULL
FROM generate_series(1, 9) g
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "Sessions" (
    "Id", "EnrollmentId", "SessionNumber", "EarningAmount", "StartAt", "EndAt",
    "Status", "CreatedAt", "UpdatedAt", "CompletedAt", "CancelledAt",
    "AttendanceVerificationOpenedAt", "AttendanceVerificationDueAt",
    "StudentAttendance", "StudentAttendanceSubmittedAt",
    "TutorAttendance", "TutorAttendanceSubmittedAt",
    "HasAttendanceConflict", "IsPayoutReleased",
    "ResolutionNotes", "ResolutionSource", "ResolvedByAdminId", "AttendanceVerifiedAt"
)
VALUES
    ('a1a1a1a1-0010-0000-0000-000000000000', 'e1e1e1e1-0001-0000-0000-000000000000', 10, 200000.00, NULL, NULL,
     'Unscheduled', NOW() - INTERVAL '2 days', NULL, NULL, NULL,
     NULL, NULL,
     NULL, NULL,
     NULL, NULL,
     false, false,
     NULL, NULL, NULL, NULL)
ON CONFLICT ("Id") DO NOTHING;

-- 15. BOOKINGS — scenario B: finished 1-session course (Pending → enrollment Completed)
INSERT INTO "Bookings" (
    "Id", "StudentProfileId", "TutorProfileId", "SubjectId", "ServiceId", "CustomAgreementId",
    "TotalPrice", "TotalSessions", "SessionDurationMinutes", "TeachingMode",
    "Status", "HoldingExpiresAt", "ConfirmedAt",
    "CompletedAt", "CancelledAt", "CancelledBy", "CancellationReason", "CreatedAt"
)
VALUES
    (
        'dddddddd-0002-0000-0000-000000000000',
        '66666666-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0003-0000-0000-000000000000',
        '5e521ce5-0002-0000-0000-000000000000', NULL,
        300000.00, 1, 60, 'Online',
        'Pending', NULL, NOW() - INTERVAL '10 days',
        NULL, NULL, NULL, NULL, NOW() - INTERVAL '10 days'
    )
ON CONFLICT ("Id") DO NOTHING;

-- 16. TRANSACTIONS — scenario B payment (Held; per-session release tracked separately)
INSERT INTO "Transactions" (
    "Id", "BookingId", "SessionId", "Amount", "Type", "Status",
    "CommissionRate", "CommissionAmount", "PayoutAmount",
    "PaymentGatewayRef", "DisputeId", "RelatedTransactionId", "Description",
    "SettlementRequired", "CreatedAt", "ReleasedAt", "RefundedAt"
)
VALUES
    (
        'eeeeeeee-0002-0000-0000-000000000000', 'dddddddd-0002-0000-0000-000000000000', NULL,
        300000.00, 'BookingPayment', 'Held',
        0, 0, 300000.00,
        'PAY-VNPAY-20260814-0002', NULL, NULL, 'Scenario B package payment held in escrow',
        false, NOW() - INTERVAL '10 days', NULL, NULL
    )
ON CONFLICT ("Id") DO NOTHING;

-- 17. ENROLLMENTS — scenario B: Completed contract (1/1), fee snapshot kept
INSERT INTO "Enrollments" (
    "Id", "BookingId", "StudentProfileId", "TutorProfileId", "ServiceId", "SubjectId",
    "TotalPrice", "TotalSessions", "SessionDurationMinutes", "TeachingMode",
    "PlatformFeeRate", "FeePolicyVersion", "CompletedSessions", "Status", "CreatedAt",
    "CompletedAt", "CancelledAt", "CancelledBy", "CancellationReason"
)
VALUES
    (
        'e2e2e2e2-0002-0000-0000-000000000000', 'dddddddd-0002-0000-0000-000000000000',
        '66666666-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111',
        '5e521ce5-0002-0000-0000-000000000000', 'aaaaaaaa-0003-0000-0000-000000000000',
        300000.00, 1, 60, 'Online',
        0.10, 1, 1, 'Completed', NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '9 days', NULL, NULL, NULL
    )
ON CONFLICT ("Id") DO NOTHING;

-- 18. SESSIONS — scenario B: the single session, taught, dual-Attended, paid out
INSERT INTO "Sessions" (
    "Id", "EnrollmentId", "SessionNumber", "EarningAmount", "StartAt", "EndAt",
    "Status", "CreatedAt", "UpdatedAt", "CompletedAt", "CancelledAt",
    "AttendanceVerificationOpenedAt", "AttendanceVerificationDueAt",
    "StudentAttendance", "StudentAttendanceSubmittedAt",
    "TutorAttendance", "TutorAttendanceSubmittedAt",
    "HasAttendanceConflict", "IsPayoutReleased",
    "ResolutionNotes", "ResolutionSource", "ResolvedByAdminId", "AttendanceVerifiedAt"
)
VALUES
    ('b2b2b2b2-0001-0000-0000-000000000000', 'e2e2e2e2-0002-0000-0000-000000000000', 1, 300000.00,
     NOW() - INTERVAL '9 days' - INTERVAL '1 hour', NOW() - INTERVAL '9 days',
     'Completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NULL,
     NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days',
     0, NOW() - INTERVAL '9 days' + INTERVAL '5 minutes',
     0, NOW() - INTERVAL '9 days' + INTERVAL '10 minutes',
     false, true,
     NULL, NULL, NULL, NOW() - INTERVAL '9 days' + INTERVAL '10 minutes')
ON CONFLICT ("Id") DO NOTHING;

-- 19. TRANSACTIONS — scenario B session payout (Released; net = 300k − 10% fee)
INSERT INTO "Transactions" (
    "Id", "BookingId", "SessionId", "Amount", "Type", "Status",
    "CommissionRate", "CommissionAmount", "PayoutAmount",
    "PaymentGatewayRef", "DisputeId", "RelatedTransactionId", "Description",
    "SettlementRequired", "CreatedAt", "ReleasedAt", "RefundedAt"
)
VALUES
    (
        'eeeeeeee-0003-0000-0000-000000000000', 'dddddddd-0002-0000-0000-000000000000', 'b2b2b2b2-0001-0000-0000-000000000000',
        300000.00, 'SessionPayoutCredit', 'Released',
        0.10, 30000.00, 270000.00,
        'EscrowRelease-b2b2b2b20001000000000000000000', NULL, NULL, 'Scenario B session payout',
        false, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NULL
    )
ON CONFLICT ("Id") DO NOTHING;

-- 20. REVIEWS — enrollment-centric (student.lan reviews the finished course)
INSERT INTO "Reviews" (
    "Id", "EnrollmentId", "Rating", "Comment",
    "TutorReply", "TutorRepliedAt",
    "IsRemoved", "RemovalReason", "RemovedAt", "RemovedByAdminId", "CreatedAt"
)
VALUES
    (
        'ffffffff-0001-0000-0000-000000000000', 'e2e2e2e2-0002-0000-0000-000000000000',
        5, 'Cô Bích đánh giá trình độ rất chuẩn, chiến thuật phòng thi cực kỳ thực tế!',
        NULL, NULL,
        false, NULL, NULL, NULL, NOW() - INTERVAL '8 days'
    )
ON CONFLICT ("Id") DO NOTHING;

-- 21. CONVERSATIONS + CUSTOM AGREEMENT — scenario C: Proposed negotiation (no booking yet)
INSERT INTO "Conversations" (
    "Id", "StudentProfileId", "TutorProfileId", "CreatedAt",
    "LastMessageId", "LastMessageAt", "LastMessagePreview"
)
VALUES
    (
        'c0c0c0c0-0001-0000-0000-000000000000',
        '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111',
        NOW() - INTERVAL '1 day',
        NULL, NULL, NULL
    )
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CustomAgreements" (
    "Id", "ServiceId", "ConversationId",
    "TutorProfileId", "StudentProfileId", "SubjectId",
    "Title", "Description",
    "TotalPrice", "TotalSessions", "SessionDurationMinutes", "TeachingMode",
    "Status", "ExpiresAt", "CreatedAt",
    "AcceptedAt", "RejectedAt", "RejectionReason",
    "CancelledAt", "CancellationReason"
)
VALUES
    (
        'd0d0d0d0-0001-0000-0000-000000000000', '5e521ce5-0001-0000-0000-000000000000', 'c0c0c0c0-0001-0000-0000-000000000000',
        '22222222-2222-2222-2222-111111111111', '55555555-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000000',
        'Toán THPT custom 5 buổi tối', 'Học viên Tuấn muốn rút còn 5 buổi tối trong tuần, giữ nguyên giáo trình gói 10 buổi.',
        1000000.00, 5, 60, 'Online',
        'Proposed', NOW() + INTERVAL '6 days', NOW() - INTERVAL '1 day',
        NULL, NULL, NULL,
        NULL, NULL
    )
ON CONFLICT ("Id") DO NOTHING;

-- 22. MEDIA (Cloudflare R2 object records; avatars public, certificates private)
INSERT INTO "Media" (
    "Id", "ObjectKey", "OriginalFileName", "ContentType",
    "FileSize", "StorageProvider", "MediaType", "IsPrivate",
    "Status", "UploadedByUserId", "CreatedAt", "DeletedAt"
)
VALUES
    (
        '99999999-0001-0000-0000-000000000000',
        'profiles/22222222-1111-1111-1111-111111111111/avatar/an-avatar.png',
        'an-avatar.png', 'image/png',
        142500, 'CloudflareR2', 'Avatar', false,
        'Active', '22222222-1111-1111-1111-111111111111', NOW() - INTERVAL '10 days', NULL
    ),
    (
        '99999999-0002-0000-0000-000000000000',
        'tutors/22222222-1111-1111-1111-111111111111/documents/ielts-certificate-8.0.pdf',
        'ielts-certificate-8.0.pdf', 'application/pdf',
        2450000, 'CloudflareR2', 'Certificate', true,
        'Active', '22222222-1111-1111-1111-111111111111', NOW() - INTERVAL '10 days', NULL
    ),
    (
        '99999999-0003-0000-0000-000000000000',
        'tutors/33333333-1111-1111-1111-111111111111/documents/math-degree-hcmus.pdf',
        'math-degree-hcmus.pdf', 'application/pdf',
        1850000, 'CloudflareR2', 'Certificate', true,
        'Active', '33333333-1111-1111-1111-111111111111', NOW() - INTERVAL '8 days', NULL
    ),
    (
        '99999999-0004-0000-0000-000000000000',
        'reports/55555555-1111-1111-1111-111111111111/attachments/tutor-absent-screenshot.png',
        'tutor-absent-screenshot.png', 'image/png',
        854000, 'CloudflareR2', 'DisputeEvidence', true,
        'Active', '55555555-1111-1111-1111-111111111111', NOW() - INTERVAL '1 days', NULL
    )
ON CONFLICT ("Id") DO NOTHING;

-- 23. PLATFORM SETTINGS (fee source of truth; enrollments snapshot from here)
INSERT INTO "PlatformSettings" ("Id", "Key", "Value", "Description", "CurrentVersion", "LastUpdatedByAdminId", "UpdatedAt")
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'PlatformFeeRate', '0.10', 'Platform commission rate snapshot source (DEC-S8-020)', 1, '11111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT ("Id") DO NOTHING;
