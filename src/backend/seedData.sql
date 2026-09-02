-- =============================================================================
-- TutorHub Platform - Initial Seed Data Script
-- =============================================================================

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

-- 4. TUTOR PROFILES (Created upon application approval)
INSERT INTO "TutorProfiles" (
    "Id", "UserId", "Bio", "Education", "ExperienceYears", "HourlyRate", 
    "TeachingMode", "Address", "Latitude", "Longitude", "RatingAvg", "TotalReviews"
)
VALUES
    (
        '22222222-2222-2222-2222-111111111111', '22222222-1111-1111-1111-111111111111',
        'Thầy giáo chuyên luyện thi THPT Quốc Gia môn Toán với 5 năm kinh nghiệm. Phương pháp giảng dạy trực quan, dễ hiểu.',
        'Cử nhân Sư phạm Toán - ĐH Sư phạm Hà Nội', 5, 200000.00,
        'Both', '123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội', 21.0333, 105.7833, 5.00, 1
    ),
    (
        '33333333-2222-2222-2222-111111111111', '33333333-1111-1111-1111-111111111111',
        'Giảng viên Tiếng Anh IELTS 8.0, chuyên luyện giao tiếp phản xạ và chiến thuật phòng thi.',
        'Thạc sĩ Ngôn ngữ Anh - ĐH Ngoại Thương', 4, 250000.00,
        'Online', NULL, NULL, NULL, 5.00, 1
    ),
    (
        '44444444-2222-2222-2222-111111111111', '44444444-1111-1111-1111-111111111111',
        'Kỹ sư phần mềm & Gia sư Vật lý. Hướng dẫn lập trình C# .NET và tư duy giải toán vật lý.',
        'Kỹ sư CNTT - ĐH Bách Khoa Hà Nội', 2, 180000.00,
        'Online', NULL, NULL, NULL, 0.00, 0
    )
ON CONFLICT ("Id") DO NOTHING;

-- 5. WALLETS (1-1 with TutorProfiles)
INSERT INTO "Wallets" ("Id", "TutorProfileId", "PendingBalance", "AvailableBalance", "UpdatedAt")
VALUES
    ('22222222-3333-3333-3333-111111111111', '22222222-2222-2222-2222-111111111111', 0.00, 360000.00, NOW()),
    ('33333333-3333-3333-3333-111111111111', '33333333-2222-2222-2222-111111111111', 450000.00, 0.00, NOW()),
    ('44444444-3333-3333-3333-111111111111', '44444444-2222-2222-2222-111111111111', 0.00, 0.00, NOW())
ON CONFLICT ("Id") DO NOTHING;

-- 5. CATEGORIES
INSERT INTO "Categories" ("Id", "Name", "Description", "IsActive")
VALUES
    ('11111111-0000-0000-0000-000000000001', 'Toán học', 'Các môn toán từ cơ bản đến nâng cao, luyện thi chuyển cấp và đại học', true),
    ('11111111-0000-0000-0000-000000000002', 'Ngoại ngữ', 'Tiếng Anh, Tiếng Trung, Tiếng Nhật, Tiếng Hàn và luyện thi chứng chỉ quốc tế', true),
    ('11111111-0000-0000-0000-000000000003', 'Khoa học tự nhiên', 'Vật lý, Hóa học, Sinh học các cấp', true),
    ('11111111-0000-0000-0000-000000000004', 'Công nghệ thông tin', 'Lập trình phần mềm, thiết kế web, khoa học dữ liệu', true),
    ('11111111-0000-0000-0000-000000000005', 'Khoa học xã hội', 'Ngữ văn, Lịch sử, Địa lý', true)
ON CONFLICT ("Id") DO NOTHING;

-- 6. SUBJECTS
INSERT INTO "Subjects" ("Id", "Name", "CategoryId", "IsActive")
VALUES
    ('aaaaaaaa-0001-0000-0000-000000000000', 'Toán THPT (Lớp 10-12)', '11111111-0000-0000-0000-000000000001', true),
    ('aaaaaaaa-0002-0000-0000-000000000000', 'Tiếng Anh Giao Tiếp', '11111111-0000-0000-0000-000000000002', true),
    ('aaaaaaaa-0003-0000-0000-000000000000', 'Luyện thi IELTS 6.5+', '11111111-0000-0000-0000-000000000002', true),
    ('aaaaaaaa-0004-0000-0000-000000000000', 'Vật lý THPT', '11111111-0000-0000-0000-000000000003', true),
    ('aaaaaaaa-0005-0000-0000-000000000000', 'Lập trình C# / .NET Core', '11111111-0000-0000-0000-000000000004', true)
ON CONFLICT ("Id") DO NOTHING;

-- 7. TUTOR SUBJECTS (Mapping tutors with subjects & optional override price)
INSERT INTO "TutorSubjects" ("Id", "TutorProfileId", "SubjectId", "OverridePrice", "IsActive")
VALUES
    ('bbbbbbbb-0001-0000-0000-000000000000', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000000', 200000.00, true),
    ('bbbbbbbb-0002-0000-0000-000000000000', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0002-0000-0000-000000000000', 250000.00, true),
    ('bbbbbbbb-0003-0000-0000-000000000000', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0003-0000-0000-000000000000', 300000.00, true),
    ('bbbbbbbb-0004-0000-0000-000000000000', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0004-0000-0000-000000000000', 180000.00, true),
    ('bbbbbbbb-0005-0000-0000-000000000000', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0005-0000-0000-000000000000', 220000.00, true)
ON CONFLICT ("Id") DO NOTHING;

-- 8. AVAILABILITY SLOTS (Weekly recurring schedule)
INSERT INTO "AvailabilitySlots" ("Id", "TutorProfileId", "DayOfWeek", "StartTime", "EndTime", "IsActive")
VALUES
    ('cccccccc-0001-0000-0000-000000000000', '22222222-2222-2222-2222-111111111111', 'Monday', '18:00:00', '20:00:00', true),
    ('cccccccc-0002-0000-0000-000000000000', '22222222-2222-2222-2222-111111111111', 'Wednesday', '18:00:00', '20:00:00', true),
    ('cccccccc-0003-0000-0000-000000000000', '33333333-2222-2222-2222-111111111111', 'Tuesday', '19:00:00', '21:00:00', true),
    ('cccccccc-0004-0000-0000-000000000000', '33333333-2222-2222-2222-111111111111', 'Thursday', '19:00:00', '21:00:00', true)
ON CONFLICT ("Id") DO NOTHING;

-- 9. BOOKINGS
INSERT INTO "Bookings" (
    "Id", "StudentProfileId", "TutorProfileId", "SubjectId", "StartAt", "EndAt", 
    "HourlyRate", "TotalAmount", "Status", "HoldingExpiresAt", "ConfirmedAt", 
    "CompletedAt", "CancelledAt", "CancelledBy", "CancellationReason", "CreatedAt"
)
VALUES
    (
        'dddddddd-0001-0000-0000-000000000000', 
        '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000000',
        NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
        200000.00, 400000.00, 'Completed', NULL, NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '3 days' + INTERVAL '2 hours', NULL, NULL, NULL, NOW() - INTERVAL '5 days'
    ),
    (
        'dddddddd-0002-0000-0000-000000000000', 
        '66666666-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0002-0000-0000-000000000000',
        NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
        250000.00, 500000.00, 'Confirmed', NULL, NOW() - INTERVAL '1 day',
        NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days'
    ),
    (
        'dddddddd-0003-0000-0000-000000000000', 
        '55555555-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0003-0000-0000-000000000000',
        NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '2 hours',
        300000.00, 600000.00, 'Holding', NOW() + INTERVAL '12 minutes', NULL,
        NULL, NULL, NULL, NULL, NOW()
    )
ON CONFLICT ("Id") DO NOTHING;

-- 10. TRANSACTIONS (Escrow tracking)
INSERT INTO "Transactions" (
    "Id", "BookingId", "Amount", "Status", "CommissionRate", "CommissionAmount", 
    "PayoutAmount", "PaymentGatewayRef", "CreatedAt", "ReleasedAt", "RefundedAt"
)
VALUES
    (
        'eeeeeeee-0001-0000-0000-000000000000', 'dddddddd-0001-0000-0000-000000000000',
        400000.00, 'Released', 10.00, 400000.00 * 0.10,
        360000.00, 'PAY-VNPAY-20260813-0001', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', NULL
    ),
    (
        'eeeeeeee-0002-0000-0000-000000000000', 'dddddddd-0002-0000-0000-000000000000',
        500000.00, 'Held', 10.00, 500000.00 * 0.10,
        450000.00, 'PAY-VNPAY-20260814-0002', NOW() - INTERVAL '2 days', NULL, NULL
    )
ON CONFLICT ("Id") DO NOTHING;

-- 11. REVIEWS
INSERT INTO "Reviews" ("Id", "BookingId", "ReviewerUserId", "RevieweeUserId", "Rating", "Comment", "IsPublic", "CreatedAt")
VALUES
    (
        'ffffffff-0001-0000-0000-000000000000', 
        'dddddddd-0001-0000-0000-000000000000', 
        '55555555-1111-1111-1111-111111111111', 
        '22222222-1111-1111-1111-111111111111',
        5, 'Thầy An dạy rất nhiệt tình và giải thích bản chất bài toán cực kỳ dễ hiểu!', true, NOW() - INTERVAL '2 days'
    )
ON CONFLICT ("Id") DO NOTHING;

-- 12. MEDIA (Cloudflare R2 Object Storage Records)
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
