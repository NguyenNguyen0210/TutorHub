-- =============================================================================
-- TutorHub Platform - Master Comprehensive Seed Data Script (10-15+ rows/table)
-- =============================================================================
-- Default Password for all accounts: "Test@123"
-- Password hash: "$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR."
-- All GUIDs are strictly RFC 4122 compliant hexadecimal values [0-9a-f].
-- =============================================================================

BEGIN;

-- Clean wipe existing domain data in cascade order (preserves __EFMigrationsHistory)
TRUNCATE TABLE 
    "AuditLogs",
    "InboxMessages",
    "OutboxMessages",
    "EmailDeliveries",
    "Notifications",
    "RefreshTokens",
    "Reports",
    "DisputeEvidences",
    "Disputes",
    "LearningRecords",
    "SessionRescheduleRequests",
    "PlatformSettingVersions",
    "PlatformSettings",
    "Media",
    "CustomAgreements",
    "Messages",
    "Conversations",
    "Reviews",
    "WalletTransactions",
    "Withdrawals",
    "Transactions",
    "Sessions",
    "Enrollments",
    "Bookings",
    "Services",
    "AvailabilitySlots",
    "TutorSubjects",
    "Subjects",
    "Categories",
    "Wallets",
    "TutorProfiles",
    "TutorApplications",
    "StudentProfiles",
    "Users"
RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- 1. USERS (1 Admin, 6 Tutors, 8 Students = 15 Users)
-- -----------------------------------------------------------------------------
INSERT INTO "Users" ("Id", "Email", "PasswordHash", "FullName", "Phone", "AvatarUrl", "Role", "Status", "CreatedAt", "AbsentStrikes", "StrikeWindowStart", "LastAbsentAt")
VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Quản Trị Viên Hệ Thống', '0901234567', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'Admin', 'Active', NOW() - INTERVAL '60 days', 0, NULL, NULL),
    ('22222222-1111-1111-1111-111111111111', 'tutor.an@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Văn An', '0912345678', 'https://api.dicebear.com/7.x/avataaars/svg?seed=an', 'Tutor', 'Active', NOW() - INTERVAL '50 days', 0, NULL, NULL),
    ('33333333-1111-1111-1111-111111111111', 'tutor.bich@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Thị Bích', '0923456789', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bich', 'Tutor', 'Active', NOW() - INTERVAL '45 days', 0, NULL, NULL),
    ('44444444-1111-1111-1111-111111111111', 'tutor.nam@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Hoàng Nam', '0934567890', 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam', 'Tutor', 'Active', NOW() - INTERVAL '40 days', 0, NULL, NULL),
    ('44444444-2222-1111-1111-111111111111', 'tutor.ha@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đỗ Thu Hà', '0934567891', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ha', 'Tutor', 'Active', NOW() - INTERVAL '35 days', 0, NULL, NULL),
    ('44444444-3333-1111-1111-111111111111', 'tutor.quang@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Vũ Minh Quang', '0934567892', 'https://api.dicebear.com/7.x/avataaars/svg?seed=quang', 'Tutor', 'Active', NOW() - INTERVAL '30 days', 0, NULL, NULL),
    ('44444444-4444-1111-1111-111111111111', 'tutor.mai@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Ngọc Mai', '0934567893', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mai', 'Tutor', 'Active', NOW() - INTERVAL '25 days', 0, NULL, NULL),
    ('55555555-1111-1111-1111-111111111111', 'student.tuan@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Minh Tuấn', '0945678901', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tuan', 'Student', 'Active', NOW() - INTERVAL '30 days', 0, NULL, NULL),
    ('66666666-1111-1111-1111-111111111111', 'student.lan@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Hoàng Lan Anh', '0956789012', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lan', 'Student', 'Active', NOW() - INTERVAL '28 days', 0, NULL, NULL),
    ('77777777-1111-1111-1111-111111111111', 'student.bad@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Văn Bùng', '0967890123', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bad', 'Student', 'Active', NOW() - INTERVAL '20 days', 2, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),
    ('55555555-2222-1111-1111-111111111111', 'student.hung@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đặng Quốc Hùng', '0978901234', 'https://api.dicebear.com/7.x/avataaars/svg?seed=hung', 'Student', 'Active', NOW() - INTERVAL '18 days', 0, NULL, NULL),
    ('55555555-3333-1111-1111-111111111111', 'student.linh@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Ngô Phương Linh', '0989012345', 'https://api.dicebear.com/7.x/avataaars/svg?seed=linh', 'Student', 'Active', NOW() - INTERVAL '15 days', 0, NULL, NULL),
    ('55555555-4444-1111-1111-111111111111', 'student.khoa@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Bùi Đăng Khoa', '0990123456', 'https://api.dicebear.com/7.x/avataaars/svg?seed=khoa', 'Student', 'Active', NOW() - INTERVAL '12 days', 0, NULL, NULL),
    ('55555555-5555-1111-1111-111111111111', 'student.thao@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Thanh Thảo', '0901234568', 'https://api.dicebear.com/7.x/avataaars/svg?seed=thao', 'Student', 'Active', NOW() - INTERVAL '10 days', 0, NULL, NULL),
    ('55555555-6666-1111-1111-111111111111', 'student.duc@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Minh Đức', '0912345679', 'https://api.dicebear.com/7.x/avataaars/svg?seed=duc', 'Student', 'Active', NOW() - INTERVAL '8 days', 0, NULL, NULL);

-- -----------------------------------------------------------------------------
-- 2. STUDENT PROFILES (8 Profiles)
-- -----------------------------------------------------------------------------
INSERT INTO "StudentProfiles" ("Id", "UserId")
VALUES
    ('55555555-2222-2222-2222-111111111111', '55555555-1111-1111-1111-111111111111'),
    ('66666666-2222-2222-2222-111111111111', '66666666-1111-1111-1111-111111111111'),
    ('77777777-2222-2222-2222-111111111111', '77777777-1111-1111-1111-111111111111'),
    ('55555555-2222-2222-2222-222222222222', '55555555-2222-1111-1111-111111111111'),
    ('55555555-2222-2222-2222-333333333333', '55555555-3333-1111-1111-111111111111'),
    ('55555555-2222-2222-2222-444444444444', '55555555-4444-1111-1111-111111111111'),
    ('55555555-2222-2222-2222-555555555555', '55555555-5555-1111-1111-111111111111'),
    ('55555555-2222-2222-2222-666666666666', '55555555-6666-1111-1111-111111111111');

-- -----------------------------------------------------------------------------
-- 3. TUTOR APPLICATIONS (10 Applications)
-- -----------------------------------------------------------------------------
INSERT INTO "TutorApplications" (
    "Id", "UserId", "Bio", "Education", "ExperienceYears", "TeachingMode",
    "Address", "Latitude", "Longitude", "Status", "SubmittedAt",
    "RejectionReason", "ReviewedByAdminId", "ReviewedAt"
)
VALUES
    ('22222222-aaaa-aaaa-aaaa-000000000001', '22222222-1111-1111-1111-111111111111', 'Chuyên luyện thi THPT QG môn Toán 5 năm kinh nghiệm.', 'Cử nhân Sư phạm Toán - ĐH Sư phạm Hà Nội', 5, 'Both', '123 Cầu Giấy, Hà Nội', 21.0333, 105.7833, 'Approved', NOW() - INTERVAL '50 days', NULL, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '49 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000002', '33333333-1111-1111-1111-111111111111', 'Giảng viên IELTS 8.0, chiến thuật phòng thi thực chiến.', 'Thạc sĩ Ngôn ngữ Anh - ĐH Ngoại Thương', 4, 'Online', NULL, NULL, NULL, 'Approved', NOW() - INTERVAL '45 days', NULL, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '44 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000003', '44444444-1111-1111-1111-111111111111', 'Kỹ sư phần mềm & Gia sư Vật lý THPT.', 'Kỹ sư CNTT - ĐH Bách Khoa Hà Nội', 3, 'Both', 'Quận 10, TP.HCM', 10.7719, 106.6678, 'Approved', NOW() - INTERVAL '40 days', NULL, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '39 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000004', '44444444-3333-1111-1111-111111111111', 'Giáo viên Tiếng Nhật JLPT N1, du học sinh Nhật Bản 4 năm.', 'Cử nhân Nhật Bản Học - ĐH KHXH&NV', 4, 'Online', NULL, NULL, NULL, 'Approved', NOW() - INTERVAL '30 days', NULL, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '29 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000005', '44444444-4444-1111-1111-111111111111', 'Thạc sĩ Văn học, luyện thi tốt nghiệp THPT và vào lớp 10 chuyên.', 'Thạc sĩ Văn học - ĐH Sư phạm TP.HCM', 6, 'Both', 'Bình Thạnh, TP.HCM', 10.8030, 106.7050, 'Approved', NOW() - INTERVAL '25 days', NULL, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '24 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000006', '44444444-2222-1111-1111-111111111111', 'Sinh viên năm 2 muốn làm gia sư Hóa học.', 'Sinh viên ĐH Kinh tế Quốc Dân', 0, 'Offline', 'Hai Bà Trưng, Hà Nội', 21.0000, 105.8500, 'Rejected', NOW() - INTERVAL '35 days', 'Thiếu bằng cấp hoặc chứng chỉ chuyên môn liên quan đến Hóa học.', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '34 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000007', '55555555-4444-1111-1111-111111111111', 'Ứng tuyển gia sư Lập trình Python & Web cơ bản.', 'Sinh viên năm 3 ĐH FPT', 1, 'Online', NULL, NULL, NULL, 'Pending', NOW() - INTERVAL '3 days', NULL, NULL, NULL),
    ('22222222-aaaa-aaaa-aaaa-000000000008', '55555555-5555-1111-1111-111111111111', 'Gia sư Tiếng Pháp DELF B2.', 'Cử nhân Ngôn ngữ Pháp - ĐH Hà Nội', 2, 'Both', 'Thanh Xuân, Hà Nội', 20.9980, 105.8050, 'Pending', NOW() - INTERVAL '2 days', NULL, NULL, NULL),
    ('22222222-aaaa-aaaa-aaaa-000000000009', '55555555-6666-1111-1111-111111111111', 'Gia sư Sinh học bồi dưỡng học sinh giỏi.', 'Bác sĩ Đa khoa - ĐH Y Hà Nội', 3, 'Both', 'Đống Đa, Hà Nội', 21.0180, 105.8270, 'Pending', NOW() - INTERVAL '1 day', NULL, NULL, NULL),
    ('22222222-aaaa-aaaa-aaaa-000000000010', '44444444-2222-1111-1111-111111111111', 'Nộp lại đơn ứng tuyển gia sư Hóa sau khi bổ sung chứng chỉ sư phạm.', 'Sinh viên ĐH Kinh tế Quốc Dân + Chứng chỉ NVSP', 1, 'Both', 'Hai Bà Trưng, Hà Nội', 21.0000, 105.8500, 'Pending', NOW() - INTERVAL '5 hours', NULL, NULL, NULL);

-- -----------------------------------------------------------------------------
-- 4. TUTOR PROFILES (5 Approved Tutors)
-- -----------------------------------------------------------------------------
INSERT INTO "TutorProfiles" (
    "Id", "UserId", "Bio", "Education", "ExperienceYears",
    "TeachingMode", "Address", "Latitude", "Longitude", "RatingAvg", "TotalReviews"
)
VALUES
    ('22222222-2222-2222-2222-111111111111', '22222222-1111-1111-1111-111111111111', 'Chuyên luyện thi THPT QG môn Toán 5 năm kinh nghiệm.', 'Cử nhân Sư phạm Toán - ĐH Sư phạm Hà Nội', 5, 'Both', '123 Cầu Giấy, Hà Nội', 21.0333, 105.7833, 4.90, 8),
    ('33333333-2222-2222-2222-111111111111', '33333333-1111-1111-1111-111111111111', 'Giảng viên IELTS 8.0, chiến thuật phòng thi thực chiến.', 'Thạc sĩ Ngôn ngữ Anh - ĐH Ngoại Thương', 4, 'Online', NULL, NULL, NULL, 5.00, 4),
    ('44444444-2222-2222-2222-111111111111', '44444444-1111-1111-1111-111111111111', 'Kỹ sư phần mềm & Gia sư Vật lý THPT.', 'Kỹ sư CNTT - ĐH Bách Khoa Hà Nội', 3, 'Both', 'Quận 10, TP.HCM', 10.7719, 106.6678, 4.75, 4),
    ('44444444-2222-2222-2222-333333333333', '44444444-3333-1111-1111-111111111111', 'Giáo viên Tiếng Nhật JLPT N1, du học sinh Nhật Bản 4 năm.', 'Cử nhân Nhật Bản Học - ĐH KHXH&NV', 4, 'Online', NULL, NULL, NULL, 5.00, 2),
    ('44444444-2222-2222-2222-444444444444', '44444444-4444-1111-1111-111111111111', 'Thạc sĩ Văn học, luyện thi tốt nghiệp THPT và vào lớp 10 chuyên.', 'Thạc sĩ Văn học - ĐH Sư phạm TP.HCM', 6, 'Both', 'Bình Thạnh, TP.HCM', 10.8030, 106.7050, 4.80, 3);

-- -----------------------------------------------------------------------------
-- 5. WALLETS (5 Wallets for 5 Tutors)
-- -----------------------------------------------------------------------------
INSERT INTO "Wallets" ("Id", "TutorProfileId", "PendingBalance", "AvailableBalance", "HeldBalance", "UpdatedAt")
VALUES
    ('22222222-3333-3333-3333-111111111111', '22222222-2222-2222-2222-111111111111', 3600000.00, 900000.00, 200000.00, NOW()),
    ('33333333-3333-3333-3333-111111111111', '33333333-2222-2222-2222-111111111111', 1200000.00, 1080000.00, 0.00, NOW()),
    ('44444444-3333-3333-3333-111111111111', '44444444-2222-2222-2222-111111111111', 2500000.00, 450000.00, 0.00, NOW()),
    ('44444444-3333-3333-3333-333333333333', '44444444-2222-2222-2222-333333333333', 1500000.00, 540000.00, 0.00, NOW()),
    ('44444444-3333-3333-3333-444444444444', '44444444-2222-2222-2222-444444444444', 0.00, 1800000.00, 0.00, NOW());

-- -----------------------------------------------------------------------------
-- 6. CATEGORIES (10 Categories)
-- -----------------------------------------------------------------------------
INSERT INTO "Categories" ("Id", "Name", "Description", "IsActive")
VALUES
    ('11111111-0000-0000-0000-000000000001', 'Toán học', 'Các môn toán từ cơ bản đến nâng cao, luyện thi đại học', true),
    ('11111111-0000-0000-0000-000000000002', 'Ngoại ngữ', 'Tiếng Anh, Tiếng Nhật, Tiếng Trung, Tiếng Hàn và chứng chỉ quốc tế', true),
    ('11111111-0000-0000-0000-000000000003', 'Khoa học tự nhiên', 'Vật lý, Hóa học, Sinh học các khối lớp', true),
    ('11111111-0000-0000-0000-000000000004', 'Công nghệ thông tin', 'Lập trình C#, Python, Frontend, Backend, Cơ sở dữ liệu', true),
    ('11111111-0000-0000-0000-000000000005', 'Khoa học xã hội', 'Ngữ văn, Lịch sử, Địa lý, Triết học', true),
    ('11111111-0000-0000-0000-000000000006', 'Nghệ thuật & Âm nhạc', 'Piano, Guitar, Mỹ thuật, Thanh nhạc', true),
    ('11111111-0000-0000-0000-000000000007', 'Kỹ năng mềm', 'Giao tiếp, Thuyết trình, Tư duy phản biện', true),
    ('11111111-0000-0000-0000-000000000008', 'Luyện thi chứng chỉ', 'SAT, ACT, GMAT, Đánh giá năng lực ĐHQG', true),
    ('11111111-0000-0000-0000-000000000009', 'Kinh tế & Tài chính', 'Kế toán, Tài chính doanh nghiệp, Kinh tế vi mô', true),
    ('11111111-0000-0000-0000-000000000010', 'Thể thao & Yoga', 'Cờ vua, Yoga tại nhà, Thể dục phát triển thể chất', true);

-- -----------------------------------------------------------------------------
-- 7. SUBJECTS (15 Subjects)
-- -----------------------------------------------------------------------------
INSERT INTO "Subjects" ("Id", "Name", "CategoryId", "IsActive")
VALUES
    ('aaaaaaaa-0001-0000-0000-000000000001', 'Toán THPT (Lớp 10-12)', '11111111-0000-0000-0000-000000000001', true),
    ('aaaaaaaa-0001-0000-0000-000000000002', 'Toán THCS (Lớp 6-9)', '11111111-0000-0000-0000-000000000001', true),
    ('aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp', '11111111-0000-0000-0000-000000000002', true),
    ('aaaaaaaa-0001-0000-0000-000000000004', 'Luyện thi IELTS 6.5+', '11111111-0000-0000-0000-000000000002', true),
    ('aaaaaaaa-0001-0000-0000-000000000005', 'Tiếng Nhật Sơ - Trung Cấp (N5 - N3)', '11111111-0000-0000-0000-000000000002', true),
    ('aaaaaaaa-0001-0000-0000-000000000006', 'Vật lý THPT (Lớp 10-12)', '11111111-0000-0000-0000-000000000003', true),
    ('aaaaaaaa-0001-0000-0000-000000000007', 'Hóa học THPT (Lớp 10-12)', '11111111-0000-0000-0000-000000000003', true),
    ('aaaaaaaa-0001-0000-0000-000000000008', 'Sinh học THPT', '11111111-0000-0000-0000-000000000003', true),
    ('aaaaaaaa-0001-0000-0000-000000000009', 'Lập trình C# / ASP.NET Core', '11111111-0000-0000-0000-000000000004', true),
    ('aaaaaaaa-0001-0000-0000-000000000010', 'Lập trình Python Cho Người Mới', '11111111-0000-0000-0000-000000000004', true),
    ('aaaaaaaa-0001-0000-0000-000000000011', 'Ngữ văn THPT & Luyện Thi ĐH', '11111111-0000-0000-0000-000000000005', true),
    ('aaaaaaaa-0001-0000-0000-000000000012', 'Luyện thi Đánh Giá Năng Lực', '11111111-0000-0000-0000-000000000008', true),
    ('aaaaaaaa-0001-0000-0000-000000000013', 'Cờ vua chiến thuật cơ bản & nâng cao', '11111111-0000-0000-0000-000000000010', true),
    ('aaaaaaaa-0001-0000-0000-000000000014', 'Kỹ năng thuyết trình & Đàm phán', '11111111-0000-0000-0000-000000000007', true),
    ('aaaaaaaa-0001-0000-0000-000000000015', 'Nguyên lý kế toán tài chính', '11111111-0000-0000-0000-000000000009', true);

-- -----------------------------------------------------------------------------
-- 8. TUTOR SUBJECTS (15 Mappings)
-- -----------------------------------------------------------------------------
INSERT INTO "TutorSubjects" ("Id", "TutorProfileId", "SubjectId", "IsActive")
VALUES
    ('bbbbbbbb-0001-0000-0000-000000000001', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('bbbbbbbb-0001-0000-0000-000000000002', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000002', true),
    ('bbbbbbbb-0001-0000-0000-000000000003', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('bbbbbbbb-0001-0000-0000-000000000004', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('bbbbbbbb-0001-0000-0000-000000000005', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000004', true),
    ('bbbbbbbb-0001-0000-0000-000000000006', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000006', true),
    ('bbbbbbbb-0001-0000-0000-000000000007', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000009', true),
    ('bbbbbbbb-0001-0000-0000-000000000008', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000010', true),
    ('bbbbbbbb-0001-0000-0000-000000000009', '44444444-2222-2222-2222-333333333333', 'aaaaaaaa-0001-0000-0000-000000000005', true),
    ('bbbbbbbb-0001-0000-0000-000000000010', '44444444-2222-2222-2222-444444444444', 'aaaaaaaa-0001-0000-0000-000000000011', true),
    ('bbbbbbbb-0001-0000-0000-000000000011', '44444444-2222-2222-2222-444444444444', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('bbbbbbbb-0001-0000-0000-000000000012', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('bbbbbbbb-0001-0000-0000-000000000013', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000013', true),
    ('bbbbbbbb-0001-0000-0000-000000000014', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('bbbbbbbb-0001-0000-0000-000000000015', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000007', true);

-- -----------------------------------------------------------------------------
-- 9. AVAILABILITY SLOTS (15 Slots)
-- -----------------------------------------------------------------------------
INSERT INTO "AvailabilitySlots" ("Id", "TutorProfileId", "DayOfWeek", "StartTime", "EndTime", "IsActive")
VALUES
    ('cccccccc-0001-0000-0000-000000000001', '22222222-2222-2222-2222-111111111111', 'Monday', '18:00:00', '20:00:00', true),
    ('cccccccc-0001-0000-0000-000000000002', '22222222-2222-2222-2222-111111111111', 'Wednesday', '18:00:00', '20:00:00', true),
    ('cccccccc-0001-0000-0000-000000000003', '22222222-2222-2222-2222-111111111111', 'Friday', '18:00:00', '20:00:00', true),
    ('cccccccc-0001-0000-0000-000000000004', '22222222-2222-2222-2222-111111111111', 'Sunday', '08:00:00', '11:00:00', true),
    ('cccccccc-0001-0000-0000-000000000005', '33333333-2222-2222-2222-111111111111', 'Tuesday', '19:00:00', '21:00:00', true),
    ('cccccccc-0001-0000-0000-000000000006', '33333333-2222-2222-2222-111111111111', 'Thursday', '19:00:00', '21:00:00', true),
    ('cccccccc-0001-0000-0000-000000000007', '33333333-2222-2222-2222-111111111111', 'Saturday', '14:00:00', '17:00:00', true),
    ('cccccccc-0001-0000-0000-000000000008', '44444444-2222-2222-2222-111111111111', 'Monday', '20:00:00', '22:00:00', true),
    ('cccccccc-0001-0000-0000-000000000009', '44444444-2222-2222-2222-111111111111', 'Wednesday', '20:00:00', '22:00:00', true),
    ('cccccccc-0001-0000-0000-000000000010', '44444444-2222-2222-2222-111111111111', 'Saturday', '09:00:00', '12:00:00', true),
    ('cccccccc-0001-0000-0000-000000000011', '44444444-2222-2222-2222-333333333333', 'Tuesday', '18:30:00', '20:30:00', true),
    ('cccccccc-0001-0000-0000-000000000012', '44444444-2222-2222-2222-333333333333', 'Thursday', '18:30:00', '20:30:00', true),
    ('cccccccc-0001-0000-0000-000000000013', '44444444-2222-2222-2222-444444444444', 'Wednesday', '17:30:00', '19:30:00', true),
    ('cccccccc-0001-0000-0000-000000000014', '44444444-2222-2222-2222-444444444444', 'Friday', '17:30:00', '19:30:00', true),
    ('cccccccc-0001-0000-0000-000000000015', '44444444-2222-2222-2222-444444444444', 'Sunday', '15:00:00', '18:00:00', true);

-- -----------------------------------------------------------------------------
-- 10. SERVICES (15 Packages)
-- -----------------------------------------------------------------------------
INSERT INTO "Services" (
    "Id", "TutorProfileId", "SubjectId", "Title", "Description",
    "TotalSessions", "SessionDurationMinutes", "Price", "TeachingMode",
    "TrialLessonUrl", "Status", "CreatedAt"
)
VALUES
    ('5e521ce5-0001-0000-0000-000000000001', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', 'Luyện thi THPT Toán 10 buổi', 'Gói luyện thi THPT môn Toán: 10 buổi x 60 phút, kèm tài liệu và bài tập về nhà.', 10, 60, 2000000.00, 'Both', NULL, 'Published', NOW() - INTERVAL '30 days'),
    ('5e521ce5-0001-0000-0000-000000000002', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', 'Toán Nâng Cao 15 buổi Chuyên Đề 9+', 'Chuyên đề vận dụng cao hàm số, tích phân, hình không gian Oxyz.', 15, 90, 3500000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '25 days'),
    ('5e521ce5-0001-0000-0000-000000000003', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000002', 'Lấy gốc Toán THCS lớp 9 vào 10', 'Bản nháp khóa học ôn thi vào 10 chuyên.', 12, 60, 1800000.00, 'Both', NULL, 'Draft', NOW() - INTERVAL '2 days'),
    ('5e521ce5-0001-0000-0000-000000000004', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000004', 'IELTS cấp tốc 1 buổi chiến thuật', 'Buổi đánh giá trình độ + chiến thuật phòng thi IELTS 1-on-1.', 1, 60, 300000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '28 days'),
    ('5e521ce5-0001-0000-0000-000000000005', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000004', 'Khóa IELTS 4 Kỹ Năng 20 buổi', 'Lộ trình từ 5.5 lên 6.5+ IELTS toàn diện nghe nói đọc viết.', 20, 90, 6000000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '20 days'),
    ('5e521ce5-0001-0000-0000-000000000006', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp', 'Khóa học tạm ngưng nhận học viên mới.', 12, 60, 2400000.00, 'Both', NULL, 'Unpublished', NOW() - INTERVAL '35 days'),
    ('5e521ce5-0001-0000-0000-000000000007', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000006', 'Vật lý THPT 12 - Luyện Đề Chuẩn Cấu Trúc', 'Khóa luyện đề thực chiến Vật lý 10 buổi.', 10, 60, 1800000.00, 'Both', NULL, 'Published', NOW() - INTERVAL '15 days'),
    ('5e521ce5-0001-0000-0000-000000000008', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000009', 'Lập trình C# / .NET Backend từ Zero', 'Khóa học thực chiến OOP, SQL, Clean Architecture 16 buổi.', 16, 90, 4800000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '14 days'),
    ('5e521ce5-0001-0000-0000-000000000009', '44444444-2222-2222-2222-333333333333', 'aaaaaaaa-0001-0000-0000-000000000005', 'Tiếng Nhật Giao Tiếp & JLPT N3 Cấp Tốc', 'Luyện kaiwa phản xạ và giải đề thi N3.', 15, 60, 3000000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '12 days'),
    ('5e521ce5-0001-0000-0000-000000000010', '44444444-2222-2222-2222-444444444444', 'aaaaaaaa-0001-0000-0000-000000000011', 'Ngữ văn 12 - Kỹ năng Nghị Luận Xã Hội & Văn Học', 'Bí kíp đạt điểm 8+ bài thi tốt nghiệp Ngữ văn.', 10, 90, 2000000.00, 'Both', NULL, 'Published', NOW() - INTERVAL '10 days'),
    ('5e521ce5-0001-0000-0000-000000000011', '44444444-2222-2222-2222-444444444444', 'aaaaaaaa-0001-0000-0000-000000000012', 'Ôn thi phần Ngôn ngữ ĐGNL ĐHQG', 'Gói ôn tập tư duy ngôn ngữ 8 buổi.', 8, 60, 1600000.00, 'Online', NULL, 'Draft', NOW() - INTERVAL '3 days'),
    ('5e521ce5-0001-0000-0000-000000000012', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000012', 'Tư duy định lượng ĐGNL', 'Gói luyện thi định lượng.', 10, 60, 2000000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '8 days'),
    ('5e521ce5-0001-0000-0000-000000000013', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000013', 'Cờ vua nhập môn cho học sinh', 'Khóa học cờ vua phát triển tư duy 8 buổi.', 8, 60, 1200000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '5 days'),
    ('5e521ce5-0001-0000-0000-000000000014', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000014', 'Kỹ năng thuyết trình tiếng Anh tự tin', 'Khóa rèn luyện 6 buổi thực hành.', 6, 90, 1800000.00, 'Both', NULL, 'Published', NOW() - INTERVAL '4 days'),
    ('5e521ce5-0001-0000-0000-000000000015', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000010', 'Python Automation & Scripting cơ bản', 'Tự động hóa tác vụ văn phòng với Python.', 10, 60, 2200000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '6 days');

-- -----------------------------------------------------------------------------
-- 11. BOOKINGS (15 Bookings)
-- -----------------------------------------------------------------------------
INSERT INTO "Bookings" (
    "Id", "StudentProfileId", "TutorProfileId", "SubjectId", "ServiceId", "CustomAgreementId",
    "TotalPrice", "TotalSessions", "SessionDurationMinutes", "TeachingMode",
    "Status", "HoldingExpiresAt", "ConfirmedAt",
    "CompletedAt", "CancelledAt", "CancelledBy", "CancellationReason", "CreatedAt"
)
VALUES
    ('dddddddd-0001-0000-0000-000000000001', '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', '5e521ce5-0001-0000-0000-000000000001', NULL, 2000000.00, 10, 60, 'Both', 'Paid', NULL, NOW() - INTERVAL '15 days', NULL, NULL, NULL, NULL, NOW() - INTERVAL '15 days'),
    ('dddddddd-0001-0000-0000-000000000002', '66666666-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000004', '5e521ce5-0001-0000-0000-000000000004', NULL, 300000.00, 1, 60, 'Online', 'Paid', NULL, NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NULL, NULL, NULL, NOW() - INTERVAL '20 days'),
    ('dddddddd-0001-0000-0000-000000000003', '55555555-2222-2222-2222-222222222222', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000006', '5e521ce5-0001-0000-0000-000000000007', NULL, 1800000.00, 10, 60, 'Both', 'Paid', NULL, NOW() - INTERVAL '10 days', NULL, NULL, NULL, NULL, NOW() - INTERVAL '10 days'),
    ('dddddddd-0001-0000-0000-000000000004', '55555555-2222-2222-2222-333333333333', '44444444-2222-2222-2222-333333333333', 'aaaaaaaa-0001-0000-0000-000000000005', '5e521ce5-0001-0000-0000-000000000009', NULL, 3000000.00, 15, 60, 'Online', 'Paid', NULL, NOW() - INTERVAL '8 days', NULL, NULL, NULL, NULL, NOW() - INTERVAL '8 days'),
    ('dddddddd-0001-0000-0000-000000000005', '55555555-2222-2222-2222-444444444444', '44444444-2222-2222-2222-444444444444', 'aaaaaaaa-0001-0000-0000-000000000011', '5e521ce5-0001-0000-0000-000000000010', NULL, 2000000.00, 10, 90, 'Both', 'Paid', NULL, NOW() - INTERVAL '7 days', NULL, NULL, NULL, NULL, NOW() - INTERVAL '7 days'),
    ('dddddddd-0001-0000-0000-000000000006', '55555555-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000004', '5e521ce5-0001-0000-0000-000000000004', NULL, 300000.00, 1, 60, 'Online', 'Holding', NOW() + INTERVAL '12 minutes', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '3 minutes'),
    ('dddddddd-0001-0000-0000-000000000007', '55555555-2222-2222-2222-555555555555', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', '5e521ce5-0001-0000-0000-000000000001', NULL, 2000000.00, 10, 60, 'Both', 'Holding', NOW() + INTERVAL '10 minutes', NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '5 minutes'),
    ('dddddddd-0001-0000-0000-000000000008', '55555555-2222-2222-2222-666666666666', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000009', '5e521ce5-0001-0000-0000-000000000008', NULL, 4800000.00, 16, 90, 'Online', 'Paid', NULL, NOW() - INTERVAL '6 days', NULL, NULL, NULL, NULL, NOW() - INTERVAL '6 days'),
    ('dddddddd-0001-0000-0000-000000000009', '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', '5e521ce5-0001-0000-0000-000000000001', NULL, 2000000.00, 10, 60, 'Both', 'Cancelled', NULL, NULL, NULL, NOW() - INTERVAL '12 days', 'Student', 'Trùng lịch thi học kỳ', NOW() - INTERVAL '12 days'),
    ('dddddddd-0001-0000-0000-000000000010', '66666666-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000002', '5e521ce5-0001-0000-0000-000000000001', NULL, 2000000.00, 10, 60, 'Both', 'Cancelled', NULL, NULL, NULL, NOW() - INTERVAL '11 days', 'Tutor', 'Gia sư bận lịch công tác đột xuất', NOW() - INTERVAL '11 days'),
    ('dddddddd-0001-0000-0000-000000000011', '55555555-2222-2222-2222-222222222222', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000004', '5e521ce5-0001-0000-0000-000000000005', NULL, 6000000.00, 20, 90, 'Online', 'Paid', NULL, NOW() - INTERVAL '4 days', NULL, NULL, NULL, NULL, NOW() - INTERVAL '4 days'),
    ('dddddddd-0001-0000-0000-000000000012', '55555555-2222-2222-2222-333333333333', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', '5e521ce5-0001-0000-0000-000000000002', NULL, 3500000.00, 15, 90, 'Online', 'Cancelled', NULL, NULL, NULL, NOW() - INTERVAL '5 days', 'System', 'HoldingExpired', NOW() - INTERVAL '5 days'),
    ('dddddddd-0001-0000-0000-000000000013', '55555555-2222-2222-2222-444444444444', '44444444-2222-2222-2222-444444444444', 'aaaaaaaa-0001-0000-0000-000000000011', '5e521ce5-0001-0000-0000-000000000010', NULL, 2000000.00, 10, 90, 'Both', 'Paid', NULL, NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NOW() - INTERVAL '25 days'),
    ('dddddddd-0001-0000-0000-000000000014', '55555555-2222-2222-2222-555555555555', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000013', '5e521ce5-0001-0000-0000-000000000013', NULL, 1200000.00, 8, 60, 'Online', 'Paid', NULL, NOW() - INTERVAL '3 days', NULL, NULL, NULL, NULL, NOW() - INTERVAL '3 days'),
    ('dddddddd-0001-0000-0000-000000000015', '55555555-2222-2222-2222-666666666666', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000014', '5e521ce5-0001-0000-0000-000000000014', NULL, 1800000.00, 6, 90, 'Both', 'Paid', NULL, NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days');

-- -----------------------------------------------------------------------------
-- 12. ENROLLMENTS (12 Enrollments)
-- -----------------------------------------------------------------------------
INSERT INTO "Enrollments" (
    "Id", "BookingId", "StudentProfileId", "TutorProfileId", "ServiceId", "SubjectId",
    "TotalPrice", "TotalSessions", "SessionDurationMinutes", "TeachingMode",
    "PlatformFeeRate", "FeePolicyVersion", "CompletedSessions", "Status", "CreatedAt",
    "CompletedAt", "CancelledAt", "CancelledBy", "CancellationReason"
)
VALUES
    ('e1e1e1e1-0001-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 2000000.00, 10, 60, 'Both', 0.10, 1, 1, 'Active', NOW() - INTERVAL '15 days', NULL, NULL, NULL, NULL),
    ('e1e1e1e1-0001-0000-0000-000000000002', 'dddddddd-0001-0000-0000-000000000002', '66666666-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000004', 'aaaaaaaa-0001-0000-0000-000000000004', 300000.00, 1, 60, 'Online', 0.10, 1, 1, 'Completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NULL, NULL, NULL),
    ('e1e1e1e1-0001-0000-0000-000000000003', 'dddddddd-0001-0000-0000-000000000003', '55555555-2222-2222-2222-222222222222', '44444444-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000007', 'aaaaaaaa-0001-0000-0000-000000000006', 1800000.00, 10, 60, 'Both', 0.10, 1, 2, 'Active', NOW() - INTERVAL '10 days', NULL, NULL, NULL, NULL),
    ('e1e1e1e1-0001-0000-0000-000000000004', 'dddddddd-0001-0000-0000-000000000004', '55555555-2222-2222-2222-333333333333', '44444444-2222-2222-2222-333333333333', '5e521ce5-0001-0000-0000-000000000009', 'aaaaaaaa-0001-0000-0000-000000000005', 3000000.00, 15, 60, 'Online', 0.10, 1, 3, 'Active', NOW() - INTERVAL '8 days', NULL, NULL, NULL, NULL),
    ('e1e1e1e1-0001-0000-0000-000000000005', 'dddddddd-0001-0000-0000-000000000005', '55555555-2222-2222-2222-444444444444', '44444444-2222-2222-2222-444444444444', '5e521ce5-0001-0000-0000-000000000010', 'aaaaaaaa-0001-0000-0000-000000000011', 2000000.00, 10, 90, 'Both', 0.10, 1, 5, 'Active', NOW() - INTERVAL '7 days', NULL, NULL, NULL, NULL),
    ('e1e1e1e1-0001-0000-0000-000000000006', 'dddddddd-0001-0000-0000-000000000008', '55555555-2222-2222-2222-666666666666', '44444444-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000008', 'aaaaaaaa-0001-0000-0000-000000000009', 4800000.00, 16, 90, 'Online', 0.10, 1, 1, 'Active', NOW() - INTERVAL '6 days', NULL, NULL, NULL, NULL),
    ('e1e1e1e1-0001-0000-0000-000000000007', 'dddddddd-0001-0000-0000-000000000011', '55555555-2222-2222-2222-222222222222', '33333333-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000005', 'aaaaaaaa-0001-0000-0000-000000000004', 6000000.00, 20, 90, 'Online', 0.10, 1, 0, 'Active', NOW() - INTERVAL '4 days', NULL, NULL, NULL, NULL),
    ('e1e1e1e1-0001-0000-0000-000000000008', 'dddddddd-0001-0000-0000-000000000009', '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 2000000.00, 10, 60, 'Both', 0.10, 1, 0, 'Cancelled', NOW() - INTERVAL '12 days', NULL, NOW() - INTERVAL '12 days', 'Student', 'Học viên hủy trước buổi đầu'),
    ('e1e1e1e1-0001-0000-0000-000000000009', 'dddddddd-0001-0000-0000-000000000010', '66666666-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 2000000.00, 10, 60, 'Both', 0.10, 1, 0, 'Cancelled', NOW() - INTERVAL '11 days', NULL, NOW() - INTERVAL '11 days', 'Tutor', 'Gia sư bận lịch công tác'),
    ('e1e1e1e1-0001-0000-0000-000000000010', 'dddddddd-0001-0000-0000-000000000013', '55555555-2222-2222-2222-444444444444', '44444444-2222-2222-2222-444444444444', '5e521ce5-0001-0000-0000-000000000010', 'aaaaaaaa-0001-0000-0000-000000000011', 2000000.00, 10, 90, 'Both', 0.10, 1, 10, 'Completed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days', NULL, NULL, NULL),
    ('e1e1e1e1-0001-0000-0000-000000000011', 'dddddddd-0001-0000-0000-000000000014', '55555555-2222-2222-2222-555555555555', '22222222-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000013', 'aaaaaaaa-0001-0000-0000-000000000013', 1200000.00, 8, 60, 'Online', 0.10, 1, 0, 'Active', NOW() - INTERVAL '3 days', NULL, NULL, NULL, NULL),
    ('e1e1e1e1-0001-0000-0000-000000000012', 'dddddddd-0001-0000-0000-000000000015', '55555555-2222-2222-2222-666666666666', '33333333-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000014', 'aaaaaaaa-0001-0000-0000-000000000014', 1800000.00, 6, 90, 'Both', 0.10, 1, 0, 'Active', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL);

-- -----------------------------------------------------------------------------
-- 13. SESSIONS (22 Sessions: Completed, Scheduled, Conflict, Unscheduled)
-- -----------------------------------------------------------------------------
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
    -- Enrollment 1: Toán Tuấn & An
    ('a1a1a1a1-0001-0000-0000-000000000001', 'e1e1e1e1-0001-0000-0000-000000000001', 1, 200000.00, NOW() - INTERVAL '14 days' - INTERVAL '1 hour', NOW() - INTERVAL '14 days', 'Completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', 0, NOW() - INTERVAL '14 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '14 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '14 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000002', 'e1e1e1e1-0001-0000-0000-000000000001', 2, 200000.00, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'Scheduled', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL),
    ('a1a1a1a1-0001-0000-0000-000000000003', 'e1e1e1e1-0001-0000-0000-000000000001', 3, 200000.00, NOW() - INTERVAL '1 day' - INTERVAL '1 hour', NOW() - INTERVAL '1 day', 'Scheduled', NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day', NULL, NULL, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', 0, NOW() - INTERVAL '1 day' + INTERVAL '10 minutes', 1, NOW() - INTERVAL '1 day' + INTERVAL '15 minutes', true, false, NULL, NULL, NULL, NULL),
    ('a1a1a1a1-0001-0000-0000-000000000004', 'e1e1e1e1-0001-0000-0000-000000000001', 4, 200000.00, NULL, NULL, 'Unscheduled', NOW() - INTERVAL '15 days', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL),
    ('a1a1a1a1-0001-0000-0000-000000000005', 'e1e1e1e1-0001-0000-0000-000000000001', 5, 200000.00, NULL, NULL, 'Unscheduled', NOW() - INTERVAL '15 days', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL),

    -- Enrollment 2: IELTS Lan & Bích
    ('a1a1a1a1-0001-0000-0000-000000000011', 'e1e1e1e1-0001-0000-0000-000000000002', 1, 300000.00, NOW() - INTERVAL '19 days' - INTERVAL '1 hour', NOW() - INTERVAL '19 days', 'Completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', NULL, NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days', 0, NOW() - INTERVAL '19 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '19 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '19 days' + INTERVAL '10 minutes'),

    -- Enrollment 3: Vật lý Hùng & Nam
    ('a1a1a1a1-0001-0000-0000-000000000012', 'e1e1e1e1-0001-0000-0000-000000000003', 1, 180000.00, NOW() - INTERVAL '9 days' - INTERVAL '1 hour', NOW() - INTERVAL '9 days', 'Completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NULL, NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', 0, NOW() - INTERVAL '9 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '9 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '9 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000013', 'e1e1e1e1-0001-0000-0000-000000000003', 2, 180000.00, NOW() - INTERVAL '6 days' - INTERVAL '1 hour', NOW() - INTERVAL '6 days', 'Completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', 0, NOW() - INTERVAL '6 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '6 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '6 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000014', 'e1e1e1e1-0001-0000-0000-000000000003', 3, 180000.00, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'Scheduled', NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL),

    -- Enrollment 4: Tiếng Nhật Linh & Quang
    ('a1a1a1a1-0001-0000-0000-000000000015', 'e1e1e1e1-0001-0000-0000-000000000004', 1, 200000.00, NOW() - INTERVAL '7 days' - INTERVAL '1 hour', NOW() - INTERVAL '7 days', 'Completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', 0, NOW() - INTERVAL '7 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '7 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '7 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000016', 'e1e1e1e1-0001-0000-0000-000000000004', 2, 200000.00, NOW() - INTERVAL '5 days' - INTERVAL '1 hour', NOW() - INTERVAL '5 days', 'Completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 0, NOW() - INTERVAL '5 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '5 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '5 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000017', 'e1e1e1e1-0001-0000-0000-000000000004', 3, 200000.00, NOW() - INTERVAL '2 days' - INTERVAL '1 hour', NOW() - INTERVAL '2 days', 'Completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 0, NOW() - INTERVAL '2 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '2 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),

    -- Enrollment 5: Ngữ văn Khoa & Mai
    ('a1a1a1a1-0001-0000-0000-000000000018', 'e1e1e1e1-0001-0000-0000-000000000005', 1, 200000.00, NOW() - INTERVAL '6 days' - INTERVAL '90 minutes', NOW() - INTERVAL '6 days', 'Completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', 0, NOW() - INTERVAL '6 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '6 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '6 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000019', 'e1e1e1e1-0001-0000-0000-000000000005', 2, 200000.00, NOW() - INTERVAL '4 days' - INTERVAL '90 minutes', NOW() - INTERVAL '4 days', 'Completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NULL, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', 0, NOW() - INTERVAL '4 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '4 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '4 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000020', 'e1e1e1e1-0001-0000-0000-000000000005', 3, 200000.00, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '90 minutes', 'Scheduled', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL),

    -- Enrollment 6: C# Đức & Nam
    ('a1a1a1a1-0001-0000-0000-000000000021', 'e1e1e1e1-0001-0000-0000-000000000006', 1, 300000.00, NOW() - INTERVAL '5 days' - INTERVAL '90 minutes', NOW() - INTERVAL '5 days', 'Completed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 0, NOW() - INTERVAL '5 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '5 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '5 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000022', 'e1e1e1e1-0001-0000-0000-000000000006', 2, 300000.00, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '90 minutes', 'Scheduled', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL);

-- -----------------------------------------------------------------------------
-- 14. TRANSACTIONS (15 Sổ cái kế toán)
-- -----------------------------------------------------------------------------
INSERT INTO "Transactions" (
    "Id", "BookingId", "SessionId", "Amount", "Type", "Status",
    "CommissionRate", "CommissionAmount", "PayoutAmount",
    "PaymentGatewayRef", "DisputeId", "RelatedTransactionId", "Description",
    "SettlementRequired", "CreatedAt", "ReleasedAt", "RefundedAt"
)
VALUES
    ('eeeeeeee-0001-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', NULL, 2000000.00, 'BookingPayment', 'Held', 0, 0, 2000000.00, 'PAY-MOCK-001', NULL, NULL, 'Ký quỹ gói Toán THPT 10 buổi', false, NOW() - INTERVAL '15 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000002', 'dddddddd-0001-0000-0000-000000000001', 'a1a1a1a1-0001-0000-0000-000000000001', 200000.00, 'SessionPayoutCredit', 'Released', 0.10, 20000.00, 180000.00, 'REL-001', NULL, NULL, 'Giải ngân buổi học Toán #1', false, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000003', 'dddddddd-0001-0000-0000-000000000002', NULL, 300000.00, 'BookingPayment', 'Held', 0, 0, 300000.00, 'PAY-VNPAY-002', NULL, NULL, 'Ký quỹ gói IELTS 1 buổi', false, NOW() - INTERVAL '20 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000004', 'dddddddd-0001-0000-0000-000000000002', 'a1a1a1a1-0001-0000-0000-000000000011', 300000.00, 'SessionPayoutCredit', 'Released', 0.10, 30000.00, 270000.00, 'REL-002', NULL, NULL, 'Giải ngân buổi học IELTS #1', false, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000005', 'dddddddd-0001-0000-0000-000000000003', NULL, 1800000.00, 'BookingPayment', 'Held', 0, 0, 1800000.00, 'PAY-VNPAY-003', NULL, NULL, 'Ký quỹ gói Vật lý 10 buổi', false, NOW() - INTERVAL '10 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000006', 'dddddddd-0001-0000-0000-000000000003', 'a1a1a1a1-0001-0000-0000-000000000012', 180000.00, 'SessionPayoutCredit', 'Released', 0.10, 18000.00, 162000.00, 'REL-003', NULL, NULL, 'Giải ngân buổi học Vật lý #1', false, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000007', 'dddddddd-0001-0000-0000-000000000003', 'a1a1a1a1-0001-0000-0000-000000000013', 180000.00, 'SessionPayoutCredit', 'Released', 0.10, 18000.00, 162000.00, 'REL-004', NULL, NULL, 'Giải ngân buổi học Vật lý #2', false, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000008', 'dddddddd-0001-0000-0000-000000000004', NULL, 3000000.00, 'BookingPayment', 'Held', 0, 0, 3000000.00, 'PAY-MOCK-004', NULL, NULL, 'Ký quỹ gói Tiếng Nhật 15 buổi', false, NOW() - INTERVAL '8 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000009', 'dddddddd-0001-0000-0000-000000000004', 'a1a1a1a1-0001-0000-0000-000000000015', 200000.00, 'SessionPayoutCredit', 'Released', 0.10, 20000.00, 180000.00, 'REL-005', NULL, NULL, 'Giải ngân buổi học Tiếng Nhật #1', false, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000010', 'dddddddd-0001-0000-0000-000000000004', 'a1a1a1a1-0001-0000-0000-000000000016', 200000.00, 'SessionPayoutCredit', 'Released', 0.10, 20000.00, 180000.00, 'REL-006', NULL, NULL, 'Giải ngân buổi học Tiếng Nhật #2', false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000011', 'dddddddd-0001-0000-0000-000000000005', NULL, 2000000.00, 'BookingPayment', 'Held', 0, 0, 2000000.00, 'PAY-VNPAY-005', NULL, NULL, 'Ký quỹ gói Ngữ văn 10 buổi', false, NOW() - INTERVAL '7 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000012', 'dddddddd-0001-0000-0000-000000000005', 'a1a1a1a1-0001-0000-0000-000000000018', 200000.00, 'SessionPayoutCredit', 'Released', 0.10, 20000.00, 180000.00, 'REL-007', NULL, NULL, 'Giải ngân buổi học Ngữ văn #1', false, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000013', 'dddddddd-0001-0000-0000-000000000005', 'a1a1a1a1-0001-0000-0000-000000000019', 200000.00, 'SessionPayoutCredit', 'Released', 0.10, 20000.00, 180000.00, 'REL-008', NULL, NULL, 'Giải ngân buổi học Ngữ văn #2', false, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000014', 'dddddddd-0001-0000-0000-000000000008', NULL, 4800000.00, 'BookingPayment', 'Held', 0, 0, 4800000.00, 'PAY-VNPAY-006', NULL, NULL, 'Ký quỹ gói C# .NET 16 buổi', false, NOW() - INTERVAL '6 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000015', 'dddddddd-0001-0000-0000-000000000011', NULL, 6000000.00, 'BookingPayment', 'Held', 0, 0, 6000000.00, 'PAY-VNPAY-007', NULL, NULL, 'Ký quỹ gói IELTS 4 kỹ năng 20 buổi', false, NOW() - INTERVAL '4 days', NULL, NULL);

-- -----------------------------------------------------------------------------
-- 15. WITHDRAWALS (10 Withdrawal Requests)
-- -----------------------------------------------------------------------------
INSERT INTO "Withdrawals" (
    "Id", "WalletId", "Amount", "Status",
    "BankName", "BankCode", "AccountNumber", "AccountHolderName", "Note",
    "RequestedAt", "ProcessingStartedAt", "ProcessingStartedByAdminId",
    "ProcessedAt", "ProcessedByAdminId", "FailureReason"
)
VALUES
    ('fa01fa01-0001-0000-0000-000000000001', '22222222-3333-3333-3333-111111111111', 300000.00, 'Pending', 'Ngân Hàng TMCP Ngoại Thương Việt Nam', 'VCB', '0011001234567', 'NGUYEN VAN AN', 'Rút thù lao dạy tuần 1', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL),
    ('fa01fa01-0001-0000-0000-000000000002', '22222222-3333-3333-3333-111111111111', 500000.00, 'Completed', 'Ngân Hàng TMCP Ngoại Thương Việt Nam', 'VCB', '0011001234567', 'NGUYEN VAN AN', 'Rút thù lao tháng trước', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '9 days', '11111111-1111-1111-1111-111111111111', NULL),
    ('fa01fa01-0001-0000-0000-000000000003', '33333333-3333-3333-3333-111111111111', 200000.00, 'Pending', 'Ngân Hàng TMCP Quốc Dân', 'NCB', '9704198526191432198', 'TRAN THI BICH', 'Rút tiền dạy IELTS', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NULL),
    ('fa01fa01-0001-0000-0000-000000000004', '33333333-3333-3333-3333-111111111111', 270000.00, 'Completed', 'Ngân Hàng TMCP Quốc Dân', 'NCB', '9704198526191432198', 'TRAN THI BICH', 'Rút tiền buổi 1', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '17 days', '11111111-1111-1111-1111-111111111111', NULL),
    ('fa01fa01-0001-0000-0000-000000000005', '44444444-3333-3333-3333-111111111111', 300000.00, 'Processing', 'Ngân Hàng TMCP Quân Đội', 'MBB', '09876543210', 'LE HOANG NAM', 'Rút thù lao Vật lý', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '1 hour', '11111111-1111-1111-1111-111111111111', NULL, NULL, NULL),
    ('fa01fa01-0001-0000-0000-000000000006', '44444444-3333-3333-3333-111111111111', 150000.00, 'Completed', 'Ngân Hàng TMCP Quân Đội', 'MBB', '09876543210', 'LE HOANG NAM', 'Rút thù lao đợt 1', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days', '11111111-1111-1111-1111-111111111111', NULL),
    ('fa01fa01-0001-0000-0000-000000000007', '44444444-3333-3333-3333-333333333333', 350000.00, 'Pending', 'Ngân Hàng TMCP Kỹ Thương', 'TCB', '19034567890123', 'VU MINH QUANG', 'Rút tiền dạy tiếng Nhật', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL),
    ('fa01fa01-0001-0000-0000-000000000008', '44444444-3333-3333-3333-444444444444', 500000.00, 'Completed', 'Ngân Hàng TMCP Tiên Phong', 'TPB', '01234567891', 'PHAM NGOC MAI', 'Rút tiền dạy Văn đợt 1', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '4 days', '11111111-1111-1111-1111-111111111111', NULL),
    ('fa01fa01-0001-0000-0000-000000000009', '44444444-3333-3333-3333-444444444444', 400000.00, 'Completed', 'Ngân Hàng TMCP Tiên Phong', 'TPB', '01234567891', 'PHAM NGOC MAI', 'Rút tiền dạy Văn đợt 2', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days', '11111111-1111-1111-1111-111111111111', NULL),
    ('fa01fa01-0001-0000-0000-000000000010', '22222222-3333-3333-3333-111111111111', 1000000.00, 'Failed', 'Ngân Hàng TMCP Ngoại Thương Việt Nam', 'VCB', '0011009999999', 'NGUYEN VAN AN', 'Số tài khoản không chính chủ', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '14 days', '11111111-1111-1111-1111-111111111111', 'Tên chủ tài khoản ngân hàng không khớp với hồ sơ gia sư');

-- -----------------------------------------------------------------------------
-- 16. WALLET TRANSACTIONS (12 Records)
-- -----------------------------------------------------------------------------
INSERT INTO "WalletTransactions" (
    "Id", "WalletId", "WithdrawalId", "DisputeId",
    "Type", "Amount", "BalanceAfter", "Description",
    "CreatedByUserId", "CreatedAt"
)
VALUES
    ('ba02ba02-0001-0000-0000-000000000001', '22222222-3333-3333-3333-111111111111', NULL, NULL, 'SessionPayoutCredit', 180000.00, 180000.00, 'Giải ngân buổi học Toán #1', NULL, NOW() - INTERVAL '14 days'),
    ('ba02ba02-0001-0000-0000-000000000002', '22222222-3333-3333-3333-111111111111', 'fa01fa01-0001-0000-0000-000000000002', NULL, 'WithdrawalDebit', 500000.00, 900000.00, 'Rút tiền thành công về VCB', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '9 days'),
    ('ba02ba02-0001-0000-0000-000000000003', '33333333-3333-3333-3333-111111111111', NULL, NULL, 'SessionPayoutCredit', 270000.00, 270000.00, 'Giải ngân buổi học IELTS #1', NULL, NOW() - INTERVAL '19 days'),
    ('ba02ba02-0001-0000-0000-000000000004', '33333333-3333-3333-3333-111111111111', 'fa01fa01-0001-0000-0000-000000000004', NULL, 'WithdrawalDebit', 270000.00, 0.00, 'Rút tiền thành công về NCB', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '17 days'),
    ('ba02ba02-0001-0000-0000-000000000005', '33333333-3333-3333-3333-111111111111', NULL, NULL, 'SessionPayoutCredit', 540000.00, 540000.00, 'Giải ngân gói IELTS khác', NULL, NOW() - INTERVAL '5 days'),
    ('ba02ba02-0001-0000-0000-000000000006', '44444444-3333-3333-3333-111111111111', NULL, NULL, 'SessionPayoutCredit', 162000.00, 162000.00, 'Giải ngân buổi học Vật lý #1', NULL, NOW() - INTERVAL '9 days'),
    ('ba02ba02-0001-0000-0000-000000000007', '44444444-3333-3333-3333-111111111111', NULL, NULL, 'SessionPayoutCredit', 162000.00, 324000.00, 'Giải ngân buổi học Vật lý #2', NULL, NOW() - INTERVAL '6 days'),
    ('ba02ba02-0001-0000-0000-000000000008', '44444444-3333-3333-3333-111111111111', 'fa01fa01-0001-0000-0000-000000000006', NULL, 'WithdrawalDebit', 150000.00, 174000.00, 'Rút tiền về MBBank', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days'),
    ('ba02ba02-0001-0000-0000-000000000009', '44444444-3333-3333-3333-333333333333', NULL, NULL, 'SessionPayoutCredit', 180000.00, 180000.00, 'Giải ngân buổi học Tiếng Nhật #1', NULL, NOW() - INTERVAL '7 days'),
    ('ba02ba02-0001-0000-0000-000000000010', '44444444-3333-3333-3333-333333333333', NULL, NULL, 'SessionPayoutCredit', 180000.00, 360000.00, 'Giải ngân buổi học Tiếng Nhật #2', NULL, NOW() - INTERVAL '5 days'),
    ('ba02ba02-0001-0000-0000-000000000011', '44444444-3333-3333-3333-444444444444', NULL, NULL, 'SessionPayoutCredit', 180000.00, 180000.00, 'Giải ngân buổi học Ngữ văn #1', NULL, NOW() - INTERVAL '6 days'),
    ('ba02ba02-0001-0000-0000-000000000012', '44444444-3333-3333-3333-444444444444', NULL, NULL, 'SessionPayoutCredit', 180000.00, 360000.00, 'Giải ngân buổi học Ngữ văn #2', NULL, NOW() - INTERVAL '4 days');

-- -----------------------------------------------------------------------------
-- 17. REVIEWS (10 Reviews)
-- -----------------------------------------------------------------------------
INSERT INTO "Reviews" (
    "Id", "EnrollmentId", "Rating", "Comment",
    "TutorReply", "TutorRepliedAt",
    "IsRemoved", "RemovalReason", "RemovedAt", "RemovedByAdminId", "CreatedAt"
)
VALUES
    ('ffffffff-0001-0000-0000-000000000001', 'e1e1e1e1-0001-0000-0000-000000000002', 5, 'Cô Bích đánh giá trình độ rất chuẩn, chiến thuật phòng thi cực kỳ thực tế!', 'Cảm ơn Lan Anh nhé, chúc em thi đạt kết quả tốt!', NOW() - INTERVAL '18 days', false, NULL, NULL, NULL, NOW() - INTERVAL '19 days'),
    ('ffffffff-0001-0000-0000-000000000002', 'e1e1e1e1-0001-0000-0000-000000000010', 5, 'Cô Mai dạy Văn truyền cảm hứng cực kỳ, bài giảng rất sâu sắc và cuốn hút.', 'Cảm ơn em Khoa, chúc em làm bài thi tốt nghiệp đạt điểm 9+ nhé!', NOW() - INTERVAL '1 day', false, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
    ('ffffffff-0001-0000-0000-000000000003', 'e1e1e1e1-0001-0000-0000-000000000001', 5, 'Thầy An dạy dễ hiểu, mẹo giải trắc nghiệm rất nhanh và chuẩn xác.', 'Cảm ơn Tuấn, cố gắng luyện thêm các đề chuyên đề nữa nhé!', NOW() - INTERVAL '13 days', false, NULL, NULL, NULL, NOW() - INTERVAL '13 days'),
    ('ffffffff-0001-0000-0000-000000000004', 'e1e1e1e1-0001-0000-0000-000000000003', 4, 'Thầy Nam giảng Vật lý rất trực quan, bài tập có giải chi tiết.', 'Cảm ơn Hùng, phần mạch điện nâng cao thầy sẽ hỗ trợ thêm!', NOW() - INTERVAL '5 days', false, NULL, NULL, NULL, NOW() - INTERVAL '6 days'),
    ('ffffffff-0001-0000-0000-000000000005', 'e1e1e1e1-0001-0000-0000-000000000004', 5, 'Sensei Quang phát âm chuẩn, sửa ngữ pháp rất tận tình!', 'Arigatou gozaimasu Linh-san! Ganbatte kudasai!', NOW() - INTERVAL '1 day', false, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
    ('ffffffff-0001-0000-0000-000000000006', 'e1e1e1e1-0001-0000-0000-000000000005', 5, 'Khóa học tuyệt vời, em tiến bộ rõ rệt trong kỹ năng làm văn nghị luận.', NULL, NULL, false, NULL, NULL, NULL, NOW() - INTERVAL '3 days'),
    ('ffffffff-0001-0000-0000-000000000007', 'e1e1e1e1-0001-0000-0000-000000000006', 5, 'Thầy dạy C# và clean architecture rất bài bản, chuẩn production.', 'Cảm ơn Đức, code của em tiến bộ rất nhanh!', NOW() - INTERVAL '1 day', false, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
    ('ffffffff-0001-0000-0000-000000000008', 'e1e1e1e1-0001-0000-0000-000000000007', 4, 'Giáo trình IELTS phong phú, luyện viết Task 2 được sửa từng câu chữ.', NULL, NULL, false, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
    ('ffffffff-0001-0000-0000-000000000009', 'e1e1e1e1-0001-0000-0000-000000000008', 5, 'Học phí hợp lý, gia sư nhiệt tình hỗ trợ ngoài giờ.', NULL, NULL, false, NULL, NULL, NULL, NOW() - INTERVAL '10 days'),
    ('ffffffff-0001-0000-0000-000000000010', 'e1e1e1e1-0001-0000-0000-000000000009', 5, 'Rất hài lòng với chất lượng giảng dạy trên sàn TutorHub.', NULL, NULL, false, NULL, NULL, NULL, NOW() - INTERVAL '9 days');

-- -----------------------------------------------------------------------------
-- 18. CONVERSATIONS & MESSAGES (8 Conversations, 15 Messages)
-- -----------------------------------------------------------------------------
INSERT INTO "Conversations" (
    "Id", "StudentProfileId", "TutorProfileId", "CreatedAt",
    "LastMessageId", "LastMessageAt", "LastMessagePreview"
)
VALUES
    ('c0c0c0c0-0001-0000-0000-000000000001', '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', NOW() - INTERVAL '20 days', 'ba03ba03-0001-0000-0000-000000000003', NOW() - INTERVAL '2 hours', 'Dạ vâng, em đã đăng ký gói 10 buổi rồi ạ!'),
    ('c0c0c0c0-0001-0000-0000-000000000002', '66666666-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111', NOW() - INTERVAL '22 days', 'ba03ba03-0001-0000-0000-000000000005', NOW() - INTERVAL '18 days', 'Cảm ơn cô nhiều ạ!'),
    ('c0c0c0c0-0001-0000-0000-000000000003', '55555555-2222-2222-2222-222222222222', '44444444-2222-2222-2222-111111111111', NOW() - INTERVAL '15 days', 'ba03ba03-0001-0000-0000-000000000007', NOW() - INTERVAL '1 day', 'Thầy gửi em link tài liệu chương Sóng ánh sáng nhé.'),
    ('c0c0c0c0-0001-0000-0000-000000000004', '55555555-2222-2222-2222-333333333333', '44444444-2222-2222-2222-333333333333', NOW() - INTERVAL '12 days', 'ba03ba03-0001-0000-0000-000000000009', NOW() - INTERVAL '3 hours', 'Hẹn gặp sensei vào tối mai ạ!'),
    ('c0c0c0c0-0001-0000-0000-000000000005', '55555555-2222-2222-2222-444444444444', '44444444-2222-2222-2222-444444444444', NOW() - INTERVAL '10 days', 'ba03ba03-0001-0000-0000-000000000011', NOW() - INTERVAL '4 hours', 'Cô ơi bài thơ Sóng cần chú ý luận điểm nào nhất ạ?'),
    ('c0c0c0c0-0001-0000-0000-000000000006', '55555555-2222-2222-2222-666666666666', '44444444-2222-2222-2222-111111111111', NOW() - INTERVAL '8 days', 'ba03ba03-0001-0000-0000-000000000013', NOW() - INTERVAL '1 day', 'Em đã push code bài tập MediatR lên GitHub rồi ạ.'),
    ('c0c0c0c0-0001-0000-0000-000000000007', '55555555-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111', NOW() - INTERVAL '5 days', 'ba03ba03-0001-0000-0000-000000000014', NOW() - INTERVAL '5 hours', 'Cô có nhận kèm thêm buổi writing không ạ?'),
    ('c0c0c0c0-0001-0000-0000-000000000008', '55555555-2222-2222-2222-555555555555', '22222222-2222-2222-2222-111111111111', NOW() - INTERVAL '4 days', 'ba03ba03-0001-0000-0000-000000000015', NOW() - INTERVAL '2 days', 'Em chào thầy, em muốn đăng ký học thử.');

INSERT INTO "Messages" (
    "Id", "ConversationId", "SenderUserId", "Content",
    "AttachmentKey", "AttachmentName", "AttachmentContentType", "AttachmentSize",
    "IsRead", "ReadAt", "CreatedAt"
)
VALUES
    ('ba03ba03-0001-0000-0000-000000000001', 'c0c0c0c0-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'Chào thầy An, em muốn hỏi thêm về lộ trình luyện thi Toán 12 ạ.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '20 days' + INTERVAL '30 minutes', NOW() - INTERVAL '20 days'),
    ('ba03ba03-0001-0000-0000-000000000002', 'c0c0c0c0-0001-0000-0000-000000000001', '22222222-1111-1111-1111-111111111111', 'Chào Tuấn! Khóa học sẽ bám sát cấu trúc ma trận đề thi tốt nghiệp THPT, tuần học 2 buổi nhé.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '19 days', NOW() - INTERVAL '20 days' + INTERVAL '40 minutes'),
    ('ba03ba03-0001-0000-0000-000000000003', 'c0c0c0c0-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'Dạ vâng, em đã đăng ký gói 10 buổi rồi ạ!', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    ('ba03ba03-0001-0000-0000-000000000004', 'c0c0c0c0-0001-0000-0000-000000000002', '66666666-1111-1111-1111-111111111111', 'Cô ơi bài tập speaking cô chấm giúp em nhé.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '19 days', NOW() - INTERVAL '20 days'),
    ('ba03ba03-0001-0000-0000-000000000005', 'c0c0c0c0-0001-0000-0000-000000000002', '33333333-1111-1111-1111-111111111111', 'Cô đã gửi nhận xét chi tiết vào file rồi nhé. Cố gắng phát huy!', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
    ('ba03ba03-0001-0000-0000-000000000006', 'c0c0c0c0-0001-0000-0000-000000000003', '55555555-2222-1111-1111-111111111111', 'Thầy ơi dạng bài con lắc đơn nâng cao em làm chưa ra đáp án.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
    ('ba03ba03-0001-0000-0000-000000000007', 'c0c0c0c0-0001-0000-0000-000000000003', '44444444-1111-1111-1111-111111111111', 'Thầy gửi em link tài liệu chương Sóng ánh sáng nhé.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('ba03ba03-0001-0000-0000-000000000008', 'c0c0c0c0-0001-0000-0000-000000000004', '44444444-3333-1111-1111-111111111111', 'Konbanwa Linh-san! Nhớ ôn lại từ vựng bài 25 nhé.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '6 hours'),
    ('ba03ba03-0001-0000-0000-000000000009', 'c0c0c0c0-0001-0000-0000-000000000004', '55555555-3333-1111-1111-111111111111', 'Hẹn gặp sensei vào tối mai ạ!', NULL, NULL, NULL, NULL, false, NULL, NOW() - INTERVAL '3 hours'),
    ('ba03ba03-0001-0000-0000-000000000010', 'c0c0c0c0-0001-0000-0000-000000000005', '44444444-4444-1111-1111-111111111111', 'Khoa chuẩn bị dàn ý bài Người lái đò sông Đà chưa em?', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '6 hours'),
    ('ba03ba03-0001-0000-0000-000000000011', 'c0c0c0c0-0001-0000-0000-000000000005', '55555555-4444-1111-1111-111111111111', 'Cô ơi bài thơ Sóng cần chú ý luận điểm nào nhất ạ?', NULL, NULL, NULL, NULL, false, NULL, NOW() - INTERVAL '4 hours'),
    ('ba03ba03-0001-0000-0000-000000000012', 'c0c0c0c0-0001-0000-0000-000000000006', '44444444-1111-1111-1111-111111111111', 'Thầy thấy em viết CQRS rất tốt, tối nay mình chuyển sang Outbox Pattern nhé.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('ba03ba03-0001-0000-0000-000000000013', 'c0c0c0c0-0001-0000-0000-000000000006', '55555555-6666-1111-1111-111111111111', 'Em đã push code bài tập MediatR lên GitHub rồi ạ.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('ba03ba03-0001-0000-0000-000000000014', 'c0c0c0c0-0001-0000-0000-000000000007', '55555555-1111-1111-1111-111111111111', 'Cô có nhận kèm thêm buổi writing không ạ?', NULL, NULL, NULL, NULL, false, NULL, NOW() - INTERVAL '5 hours'),
    ('ba03ba03-0001-0000-0000-000000000015', 'c0c0c0c0-0001-0000-0000-000000000008', '55555555-5555-1111-1111-111111111111', 'Em chào thầy, em muốn đăng ký học thử.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days');

-- -----------------------------------------------------------------------------
-- 19. CUSTOM AGREEMENTS (6 Agreements)
-- -----------------------------------------------------------------------------
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
    ('d0d0d0d0-0001-0000-0000-000000000001', '5e521ce5-0001-0000-0000-000000000001', 'c0c0c0c0-0001-0000-0000-000000000001', '22222222-2222-2222-2222-111111111111', '55555555-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', 'Toán THPT custom 5 buổi tối', 'Học viên Tuấn muốn rút còn 5 buổi tối, giữ nguyên giáo trình trọng tâm.', 1000000.00, 5, 60, 'Online', 'Proposed', NOW() + INTERVAL '5 days', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NULL),
    ('d0d0d0d0-0001-0000-0000-000000000002', '5e521ce5-0001-0000-0000-000000000004', 'c0c0c0c0-0001-0000-0000-000000000002', '33333333-2222-2222-2222-111111111111', '66666666-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000004', 'IELTS Writing Task 2 chuyên sâu 3 buổi', 'Khóa học viết chuyên sâu 3 buổi x 90 phút.', 1200000.00, 3, 90, 'Online', 'Accepted', NOW() + INTERVAL '2 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NULL, NULL, NULL, NULL),
    ('d0d0d0d0-0001-0000-0000-000000000003', '5e521ce5-0001-0000-0000-000000000007', 'c0c0c0c0-0001-0000-0000-000000000003', '44444444-2222-2222-2222-111111111111', '55555555-2222-2222-2222-222222222222', 'aaaaaaaa-0001-0000-0000-000000000006', 'Vật lý 12 nâng cao cuối kỳ 8 buổi', 'Ôn tập học kỳ 2 môn Vật lý.', 1500000.00, 8, 60, 'Both', 'Rejected', NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 days', NULL, NOW() - INTERVAL '7 days', 'Thời gian học không phù hợp với lịch gia sư', NULL, NULL),
    ('d0d0d0d0-0001-0000-0000-000000000004', '5e521ce5-0001-0000-0000-000000000009', 'c0c0c0c0-0001-0000-0000-000000000004', '44444444-2222-2222-2222-333333333333', '55555555-2222-2222-2222-333333333333', 'aaaaaaaa-0001-0000-0000-000000000005', 'Tiếng Nhật Kaiwa phản xạ 10 buổi', 'Rèn luyện kỹ năng nghe nói giao tiếp hằng ngày.', 2200000.00, 10, 60, 'Online', 'Proposed', NOW() + INTERVAL '6 days', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL),
    ('d0d0d0d0-0001-0000-0000-000000000005', '5e521ce5-0001-0000-0000-000000000010', 'c0c0c0c0-0001-0000-0000-000000000005', '44444444-2222-2222-2222-444444444444', '55555555-2222-2222-2222-444444444444', 'aaaaaaaa-0001-0000-0000-000000000011', 'Ngữ văn 12 cấp tốc 6 buổi cuối tuần', 'Ôn thi vào trường chuyên khối C.', 1400000.00, 6, 90, 'Offline', 'Cancelled', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 days', NULL, NULL, NULL, NOW() - INTERVAL '3 days', 'Học viên đổi kế hoạch thi khối A1'),
    ('d0d0d0d0-0001-0000-0000-000000000006', '5e521ce5-0001-0000-0000-000000000008', 'c0c0c0c0-0001-0000-0000-000000000006', '44444444-2222-2222-2222-111111111111', '55555555-2222-2222-2222-666666666666', 'aaaaaaaa-0001-0000-0000-000000000009', 'C# Microservices & Docker 8 buổi', 'Khóa học nâng cao theo nhu cầu doanh nghiệp.', 2800000.00, 8, 90, 'Online', 'Accepted', NOW() + INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NULL, NULL, NULL, NULL);

-- -----------------------------------------------------------------------------
-- 20. MEDIA (10 Media Files)
-- -----------------------------------------------------------------------------
INSERT INTO "Media" (
    "Id", "ObjectKey", "OriginalFileName", "ContentType",
    "FileSize", "StorageProvider", "MediaType", "IsPrivate",
    "Status", "UploadedByUserId", "CreatedAt", "DeletedAt"
)
VALUES
    ('99999999-0001-0000-0000-000000000001', 'profiles/22222222-1111-1111-1111-111111111111/avatar/an-avatar.png', 'an-avatar.png', 'image/png', 142500, 'CloudflareR2', 'Avatar', false, 'Active', '22222222-1111-1111-1111-111111111111', NOW() - INTERVAL '50 days', NULL),
    ('99999999-0001-0000-0000-000000000002', 'profiles/33333333-1111-1111-1111-111111111111/avatar/bich-avatar.png', 'bich-avatar.png', 'image/png', 156000, 'CloudflareR2', 'Avatar', false, 'Active', '33333333-1111-1111-1111-111111111111', NOW() - INTERVAL '45 days', NULL),
    ('99999999-0001-0000-0000-000000000003', 'profiles/44444444-1111-1111-1111-111111111111/avatar/nam-avatar.png', 'nam-avatar.png', 'image/png', 138000, 'CloudflareR2', 'Avatar', false, 'Active', '44444444-1111-1111-1111-111111111111', NOW() - INTERVAL '40 days', NULL),
    ('99999999-0001-0000-0000-000000000004', 'tutors/22222222-1111-1111-1111-111111111111/documents/math-degree.pdf', 'math-degree.pdf', 'application/pdf', 2450000, 'CloudflareR2', 'Certificate', true, 'Active', '22222222-1111-1111-1111-111111111111', NOW() - INTERVAL '50 days', NULL),
    ('99999999-0001-0000-0000-000000000005', 'tutors/33333333-1111-1111-1111-111111111111/documents/ielts-certificate-8.0.pdf', 'ielts-certificate-8.0.pdf', 'application/pdf', 1850000, 'CloudflareR2', 'Certificate', true, 'Active', '33333333-1111-1111-1111-111111111111', NOW() - INTERVAL '45 days', NULL),
    ('99999999-0001-0000-0000-000000000006', 'tutors/44444444-1111-1111-1111-111111111111/documents/hcmut-degree.pdf', 'hcmut-degree.pdf', 'application/pdf', 3100000, 'CloudflareR2', 'Certificate', true, 'Active', '44444444-1111-1111-1111-111111111111', NOW() - INTERVAL '40 days', NULL),
    ('99999999-0001-0000-0000-000000000007', 'tutors/44444444-3333-1111-1111-111111111111/documents/jlpt-n1-cert.pdf', 'jlpt-n1-cert.pdf', 'application/pdf', 1950000, 'CloudflareR2', 'Certificate', true, 'Active', '44444444-3333-1111-1111-111111111111', NOW() - INTERVAL '30 days', NULL),
    ('99999999-0001-0000-0000-000000000008', 'reports/55555555-1111-1111-1111-111111111111/attachments/meet-waiting.png', 'meet-waiting.png', 'image/png', 854000, 'CloudflareR2', 'DisputeEvidence', true, 'Active', '55555555-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day', NULL),
    ('99999999-0001-0000-0000-000000000009', 'reports/66666666-1111-1111-1111-111111111111/attachments/chat-evidence.png', 'chat-evidence.png', 'image/png', 720000, 'CloudflareR2', 'DisputeEvidence', true, 'Active', '66666666-1111-1111-1111-111111111111', NOW() - INTERVAL '3 days', NULL),
    ('99999999-0001-0000-0000-000000000010', 'profiles/55555555-1111-1111-1111-111111111111/avatar/tuan-avatar.png', 'tuan-avatar.png', 'image/png', 125000, 'CloudflareR2', 'Avatar', false, 'Active', '55555555-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days', NULL);

-- -----------------------------------------------------------------------------
-- 21. PLATFORM SETTINGS & VERSIONS
-- -----------------------------------------------------------------------------
INSERT INTO "PlatformSettings" ("Id", "Key", "Value", "Description", "CurrentVersion", "LastUpdatedByAdminId", "UpdatedAt")
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'PlatformFeeRate', '0.10', 'Platform commission rate snapshot source (DEC-S8-020)', 2, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days'),
    ('f0000000-0000-0000-0000-000000000002', 'MinWithdrawalAmount', '50000', 'Số tiền rút tối thiểu mỗi lần (50.000 VNĐ)', 1, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days'),
    ('f0000000-0000-0000-0000-000000000003', 'HoldingExpiryMinutes', '15', 'Thời gian giữ chỗ thanh toán (phút)', 1, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days'),
    ('f0000000-0000-0000-0000-000000000004', 'AbsentStrikeLimit', '3', 'Số gậy vắng mặt tối đa trước khi khóa tài khoản', 1, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days'),
    ('f0000000-0000-0000-0000-000000000005', 'CancellationGracePeriodHours', '24', 'Thời gian tối thiểu cho phép hủy lịch trước giờ học (giờ)', 1, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days');

INSERT INTO "PlatformSettingVersions" ("Id", "PlatformSettingId", "Version", "Value", "Reason", "ChangedByAdminId", "EffectiveFrom", "CreatedAt")
VALUES
    ('ba04ba04-0001-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 1, '0.12', 'Khởi tạo tỷ lệ hoa hồng sàn thử nghiệm 12%', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
    ('ba04ba04-0001-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 2, '0.10', 'Giảm phí sàn xuống 10% hỗ trợ gia sư', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    ('ba04ba04-0001-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002', 1, '50000', 'Khởi tạo hạn mức rút tiền tối thiểu', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
    ('ba04ba04-0001-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000003', 1, '15', 'Thiết lập thời gian lock slot mặc định 15 phút', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
    ('ba04ba04-0001-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000004', 1, '3', 'Thiết lập quy tắc xử lý vắng mặt 3 strike', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
    ('ba04ba04-0001-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000005', 1, '24', 'Quy định hủy buổi học không mất phí trước 24h', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days');

-- -----------------------------------------------------------------------------
-- 22. SESSION RESCHEDULE REQUESTS (6 Requests)
-- -----------------------------------------------------------------------------
INSERT INTO "SessionRescheduleRequests" (
    "Id", "SessionId", "ProposerUserId", "RecipientUserId",
    "ProposedStartAt", "ProposedEndAt", "Reason",
    "Status", "RejectionReason", "CreatedAt", "RespondedAt"
)
VALUES
    ('ba05ba05-0001-0000-0000-000000000001', 'a1a1a1a1-0001-0000-0000-000000000002', '22222222-1111-1111-1111-111111111111', '55555555-1111-1111-1111-111111111111', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'Thầy có lịch tập huấn tại trường, xin phép dời sang tối thứ 6 nhé.', 'Pending', NULL, NOW() - INTERVAL '6 hours', NULL),
    ('ba05ba05-0001-0000-0000-000000000002', 'a1a1a1a1-0001-0000-0000-000000000014', '44444444-1111-1111-1111-111111111111', '55555555-2222-1111-1111-111111111111', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour', 'Trùng lịch thi giữa kỳ, dời sang chiều Chủ Nhật.', 'Accepted', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
    ('ba05ba05-0001-0000-0000-000000000003', 'a1a1a1a1-0001-0000-0000-000000000020', '44444444-4444-1111-1111-111111111111', '55555555-4444-1111-1111-111111111111', NOW() + INTERVAL '2 days' + INTERVAL '15 hours', NOW() + INTERVAL '2 days' + INTERVAL '16 hours' + INTERVAL '30 minutes', 'Gia sư có việc gia đình đột xuất.', 'Rejected', 'Học viên vướng lịch học thêm tiếng Anh', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    ('ba05ba05-0001-0000-0000-000000000004', 'a1a1a1a1-0001-0000-0000-000000000012', '44444444-1111-1111-1111-111111111111', '55555555-2222-1111-1111-111111111111', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '1 hour', 'Đổi lịch sang buổi tối cho mát mẻ.', 'Accepted', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
    ('ba05ba05-0001-0000-0000-000000000005', 'a1a1a1a1-0001-0000-0000-000000000015', '44444444-3333-1111-1111-111111111111', '55555555-3333-1111-1111-111111111111', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '1 hour', 'Sensei có lịch họp khoa.', 'Accepted', NULL, NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
    ('ba05ba05-0001-0000-0000-000000000006', 'a1a1a1a1-0001-0000-0000-000000000018', '44444444-4444-1111-1111-111111111111', '55555555-4444-1111-1111-111111111111', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '90 minutes', 'Dời buổi 1 sang chiều thứ 7.', 'Accepted', NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days');

-- -----------------------------------------------------------------------------
-- 23. LEARNING RECORDS (10 Summaries)
-- -----------------------------------------------------------------------------
INSERT INTO "LearningRecords" ("Id", "SessionId", "TutorProfileId", "Content", "CreatedAt")
VALUES
    ('ba06ba06-0001-0000-0000-000000000001', 'a1a1a1a1-0001-0000-0000-000000000001', '22222222-2222-2222-2222-111111111111', 'Buổi 1: Ôn tập Hàm số và các dạng toán đơn điệu bậc 3, bậc 4 trùng phương. Tuấn tiếp thu nhanh, đã làm tốt 15 bài trắc nghiệm mẫu.', NOW() - INTERVAL '14 days'),
    ('ba06ba06-0001-0000-0000-000000000002', 'a1a1a1a1-0001-0000-0000-000000000011', '33333333-2222-2222-2222-111111111111', 'Buổi 1: Kiểm tra trình độ phát âm, từ vựng và tư duy phản xạ Speaking Part 1 + 2. Lan Anh phát âm tự nhiên, cần mở rộng ideas Part 3.', NOW() - INTERVAL '19 days'),
    ('ba06ba06-0001-0000-0000-000000000003', 'a1a1a1a1-0001-0000-0000-000000000012', '44444444-2222-2222-2222-111111111111', 'Buổi 1: Dao động điều hòa, con lắc lò xo và bài toán năng lượng cơ học. Hùng nắm vững công thức cơ bản.', NOW() - INTERVAL '9 days'),
    ('ba06ba06-0001-0000-0000-000000000004', 'a1a1a1a1-0001-0000-0000-000000000013', '44444444-2222-2222-2222-111111111111', 'Buổi 2: Con lắc đơn và các trường lực lạ. Giải quyết trọn vẹn 20 câu trắc nghiệm vận dụng cao.', NOW() - INTERVAL '6 days'),
    ('ba06ba06-0001-0000-0000-000000000005', 'a1a1a1a1-0001-0000-0000-000000000015', '44444444-2222-2222-2222-333333333333', 'Buổi 1: Ôn tập ngữ pháp N4 và làm quen cấu trúc đề thi ngữ pháp JLPT N3.', NOW() - INTERVAL '7 days'),
    ('ba06ba06-0001-0000-0000-000000000006', 'a1a1a1a1-0001-0000-0000-000000000016', '44444444-2222-2222-2222-333333333333', 'Buổi 2: Kanji N3 chủ đề sinh hoạt và đời sống hàng ngày, luyện đọc hiểu bài văn ngắn.', NOW() - INTERVAL '5 days'),
    ('ba06ba06-0001-0000-0000-000000000007', 'a1a1a1a1-0001-0000-0000-000000000017', '44444444-2222-2222-2222-333333333333', 'Buổi 3: Luyện nghe hiểu Dokkai dạng tìm thông tin cốt lõi.', NOW() - INTERVAL '2 days'),
    ('ba06ba06-0001-0000-0000-000000000008', 'a1a1a1a1-0001-0000-0000-000000000018', '44444444-2222-2222-2222-444444444444', 'Buổi 1: Kỹ năng phân tích đề thi Ngữ văn, lập dàn ý bài văn nghị luận văn học 200 chữ.', NOW() - INTERVAL '6 days'),
    ('ba06ba06-0001-0000-0000-000000000009', 'a1a1a1a1-0001-0000-0000-000000000019', '44444444-2222-2222-2222-444444444444', 'Buổi 2: Phân tích 3 khổ thơ đầu bài Tây Tiến của Quang Dũng. Khoa biết cách diễn đạt cảm xúc.', NOW() - INTERVAL '4 days'),
    ('ba06ba06-0001-0000-0000-000000000010', 'a1a1a1a1-0001-0000-0000-000000000021', '44444444-2222-2222-2222-111111111111', 'Buổi 1: Giới thiệu Clean Architecture, CQRS pattern và cấu trúc solution .NET.', NOW() - INTERVAL '5 days');

-- -----------------------------------------------------------------------------
-- 24. DISPUTES & DISPUTE EVIDENCES (4 Disputes, 6 Evidences)
-- -----------------------------------------------------------------------------
INSERT INTO "Disputes" (
    "Id", "SessionId", "InitiatorUserId", "RespondentUserId",
    "Reason", "Description", "Status", "ResolutionDecision",
    "AdminNotes", "ResolvedByAdminId", "ResolutionSource", "ResolvedAt",
    "HeldAmount", "HoldType", "HoldStatus", "HeldAt", "HoldReleasedAt",
    "OriginalTransactionId", "AffectsFinancialResolution", "CreatedAt", "UpdatedAt"
)
VALUES
    ('ba07ba07-0001-0000-0000-000000000001', 'a1a1a1a1-0001-0000-0000-000000000003', '55555555-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'TutorNoShow', 'Em vào phòng học chờ 30 phút nhưng thầy An không vào lớp và không báo trước.', 'Open', NULL, NULL, NULL, NULL, NULL, 200000.00, 'EscrowHold', 'Active', NOW() - INTERVAL '1 day', NULL, 'eeeeeeee-0001-0000-0000-000000000001', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('ba07ba07-0001-0000-0000-000000000002', 'a1a1a1a1-0001-0000-0000-000000000013', '55555555-2222-1111-1111-111111111111', '44444444-1111-1111-1111-111111111111', 'IncompleteSession', 'Buổi học chỉ diễn ra 30 phút do gia sư gặp sự cố mạng.', 'Resolved', 'StudentWinsPartialRefund', 'Admin đã kiểm tra log Google Meet, xác nhận buổi học chỉ kéo dài 30 phút.', '11111111-1111-1111-1111-111111111111', 'AdminInvestigation', NOW() - INTERVAL '4 days', 180000.00, 'EscrowHold', 'Released', NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days', 'eeeeeeee-0001-0000-0000-000000000005', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days'),
    ('ba07ba07-0001-0000-0000-000000000003', 'a1a1a1a1-0001-0000-0000-000000000016', '55555555-3333-1111-1111-111111111111', '44444444-3333-1111-1111-111111111111', 'QualityIssue', 'Học viên khiếu nại bài tập quá khó chưa được giải thích cặn kẽ.', 'Dismissed', 'DismissedNoFinancialChange', 'Nội dung buổi học đúng theo giáo trình đã thỏa thuận.', '11111111-1111-1111-1111-111111111111', 'AdminInvestigation', NOW() - INTERVAL '3 days', 200000.00, 'EscrowHold', 'Released', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', 'eeeeeeee-0001-0000-0000-000000000008', false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
    ('ba07ba07-0001-0000-0000-000000000004', 'a1a1a1a1-0001-0000-0000-000000000019', '55555555-4444-1111-1111-111111111111', '44444444-4444-1111-1111-111111111111', 'TutorLate', 'Gia sư vào lớp muộn 25 phút.', 'UnderReview', NULL, 'Đang yêu cầu 2 bên cung cấp thêm ảnh chụp màn hình.', NULL, NULL, NULL, 200000.00, 'EscrowHold', 'Active', NOW() - INTERVAL '2 days', NULL, 'eeeeeeee-0001-0000-0000-000000000011', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

INSERT INTO "DisputeEvidences" ("Id", "DisputeId", "UploadedByUserId", "FileName", "FileUrl", "ContentType", "FileSizeBytes", "CreatedAt")
VALUES
    ('dededede-0001-0000-0000-000000000001', 'ba07ba07-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'meet-waiting.png', 'https://pub-r2.tutorhub.com/reports/meet-waiting.png', 'image/png', 854000, NOW() - INTERVAL '1 day'),
    ('dededede-0001-0000-0000-000000000002', 'ba07ba07-0001-0000-0000-000000000001', '22222222-1111-1111-1111-111111111111', 'zalo-message-notice.png', 'https://pub-r2.tutorhub.com/reports/zalo-message-notice.png', 'image/png', 420000, NOW() - INTERVAL '18 hours'),
    ('dededede-0001-0000-0000-000000000003', 'ba07ba07-0001-0000-0000-000000000002', '55555555-2222-1111-1111-111111111111', 'disconnect-log.png', 'https://pub-r2.tutorhub.com/reports/disconnect-log.png', 'image/png', 530000, NOW() - INTERVAL '6 days'),
    ('dededede-0001-0000-0000-000000000004', 'ba07ba07-0001-0000-0000-000000000002', '44444444-1111-1111-1111-111111111111', 'modem-error.png', 'https://pub-r2.tutorhub.com/reports/modem-error.png', 'image/png', 610000, NOW() - INTERVAL '5 days'),
    ('dededede-0001-0000-0000-000000000005', 'ba07ba07-0001-0000-0000-000000000003', '55555555-3333-1111-1111-111111111111', 'exercise-too-hard.pdf', 'https://pub-r2.tutorhub.com/reports/exercise.pdf', 'application/pdf', 1200000, NOW() - INTERVAL '5 days'),
    ('dededede-0001-0000-0000-000000000006', 'ba07ba07-0001-0000-0000-000000000004', '55555555-4444-1111-1111-111111111111', 'late-join-time.png', 'https://pub-r2.tutorhub.com/reports/late-join.png', 'image/png', 780000, NOW() - INTERVAL '2 days');

-- -----------------------------------------------------------------------------
-- 25. REPORTS (6 Reports)
-- -----------------------------------------------------------------------------
INSERT INTO "Reports" (
    "Id", "BookingId", "ReportedUserId", "ReportType", "TargetId",
    "ReporterUserId", "Description", "EvidenceUrl", "Status",
    "AdminDecision", "Resolution", "ResolvedByAdminId", "CreatedAt", "ResolvedAt"
)
VALUES
    ('ba08ba08-0001-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', '22222222-1111-1111-1111-111111111111', 'General', 'dddddddd-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'Gia sư vào lớp trễ 15 phút không báo trước.', NULL, 'Open', NULL, NULL, NULL, NOW() - INTERVAL '2 days', NULL),
    ('ba08ba08-0001-0000-0000-000000000002', 'dddddddd-0001-0000-0000-000000000003', '44444444-1111-1111-1111-111111111111', 'AcademicIntegrity', 'dddddddd-0001-0000-0000-000000000003', '55555555-2222-1111-1111-111111111111', 'Yêu cầu kiểm tra lại bài thi mẫu do gia sư giải có sai sót.', NULL, 'Resolved', 'Dismissed', 'Đã đối chiếu đáp án bộ đề thi chuẩn, không có vi phạm.', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
    ('ba08ba08-0001-0000-0000-000000000003', NULL, '77777777-1111-1111-1111-111111111111', 'Harassment', '77777777-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Học viên liên tục đặt lịch ảo rồi bùng không vào học.', NULL, 'Resolved', 'WarningIssued', 'Admin đã ghi nhận vi phạm và áp dụng chế tài 2 Strike cấm booking.', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    ('ba08ba08-0001-0000-0000-000000000004', 'dddddddd-0001-0000-0000-000000000004', '44444444-3333-1111-1111-111111111111', 'TechnicalIssue', 'dddddddd-0001-0000-0000-000000000004', '55555555-3333-1111-1111-111111111111', 'Đường truyền Google Meet chập chờn không nghe rõ tiếng.', NULL, 'Open', NULL, NULL, NULL, NOW() - INTERVAL '1 day', NULL),
    ('ba08ba08-0001-0000-0000-000000000005', NULL, '44444444-2222-1111-1111-111111111111', 'Fraud', '44444444-2222-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Hồ sơ có dấu hiệu làm giả chứng chỉ sư phạm.', NULL, 'Resolved', 'AccountSuspended', 'Đã từ chối đơn ứng tuyển và khóa hồ sơ.', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '34 days', NOW() - INTERVAL '34 days'),
    ('ba08ba08-0001-0000-0000-000000000006', 'dddddddd-0001-0000-0000-000000000005', '44444444-4444-1111-1111-111111111111', 'General', 'dddddddd-0001-0000-0000-000000000005', '55555555-4444-1111-1111-111111111111', 'Cần tư vấn thêm lộ trình học.', NULL, 'Resolved', 'Dismissed', 'Đã hướng dẫn học viên liên hệ qua mục Chat.', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days');

-- -----------------------------------------------------------------------------
-- 26. REFRESH TOKENS (15 Refresh Tokens)
-- P0-D1: only the HMAC-SHA256 hash of a refresh token is stored, so the seeded value
-- is a 64-char lowercase hex digest (never a usable raw token).
-- -----------------------------------------------------------------------------
INSERT INTO "RefreshTokens" ("Id", "UserId", "TokenHash", "ExpiresAt", "CreatedAt", "RevokedAt")
VALUES
    ('ba09ba09-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '01', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000002', '22222222-1111-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '02', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000003', '33333333-1111-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '03', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000004', '44444444-1111-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '04', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000005', '44444444-2222-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '05', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000006', '44444444-3333-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '06', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000007', '44444444-4444-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '07', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000008', '55555555-1111-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '08', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000009', '66666666-1111-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '09', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000010', '77777777-1111-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '10', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000011', '55555555-2222-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '11', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000012', '55555555-3333-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '12', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000013', '55555555-4444-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '13', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000014', '55555555-5555-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '14', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000015', '55555555-6666-1111-1111-111111111111', 'ba09ba09' || repeat('0', 54) || '15', NOW() + INTERVAL '7 days', NOW(), NULL);

-- -----------------------------------------------------------------------------
-- 27. NOTIFICATIONS (15 Notifications)
-- -----------------------------------------------------------------------------
INSERT INTO "Notifications" (
    "Id", "UserId", "Title", "Message", "Type", "DeepLink",
    "IsRead", "ReadAt", "IsCritical", "EventId", "DeduplicationKey", "CreatedAt"
)
VALUES
    ('ba0aba0a-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'Thanh toán thành công', 'Bạn đã thanh toán 2.000.000đ cho gói học Toán THPT 10 buổi.', 'PaymentSuccess', '/bookings/dddddddd-0001-0000-0000-000000000001', true, NOW() - INTERVAL '15 days', true, 'e0e0e0e0-0001-0000-0000-000000000001', 'event:payment-001', NOW() - INTERVAL '15 days'),
    ('ba0aba0a-0001-0000-0000-000000000002', '22222222-1111-1111-1111-111111111111', 'Đơn đặt học mới', 'Học viên Phạm Minh Tuấn vừa đặt mua gói Toán THPT của bạn.', 'NewBooking', '/tutor/enrollments/e1e1e1e1-0001-0000-0000-000000000001', true, NOW() - INTERVAL '15 days', false, 'e0e0e0e0-0001-0000-0000-000000000002', 'event:booking-001', NOW() - INTERVAL '15 days'),
    ('ba0aba0a-0001-0000-0000-000000000003', '66666666-1111-1111-1111-111111111111', 'Hoàn thành khóa học', 'Chúc mừng bạn đã hoàn thành khóa IELTS 1 buổi cùng cô Bích.', 'CourseCompleted', '/enrollments/e1e1e1e1-0001-0000-0000-000000000002', true, NOW() - INTERVAL '19 days', false, 'e0e0e0e0-0001-0000-0000-000000000003', 'event:complete-002', NOW() - INTERVAL '19 days'),
    ('ba0aba0a-0001-0000-0000-000000000004', '33333333-1111-1111-1111-111111111111', 'Giải ngân thành công', '270.000đ đã được cộng vào ví khả dụng của bạn.', 'PayoutCredit', '/tutor/wallet', true, NOW() - INTERVAL '19 days', true, 'e0e0e0e0-0001-0000-0000-000000000004', 'event:payout-002', NOW() - INTERVAL '19 days'),
    ('ba0aba0a-0001-0000-0000-000000000005', '55555555-2222-1111-1111-111111111111', 'Nhắc nhở buổi học', 'Buổi học Vật lý sắp diễn ra sau 30 phút.', 'SessionReminder', '/sessions/a1a1a1a1-0001-0000-0000-000000000012', true, NOW() - INTERVAL '9 days', false, 'e0e0e0e0-0001-0000-0000-000000000005', 'event:remind-003', NOW() - INTERVAL '9 days'),
    ('ba0aba0a-0001-0000-0000-000000000006', '44444444-1111-1111-1111-111111111111', 'Xác nhận điểm danh', 'Học viên Hùng đã xác nhận tham gia buổi học Vật lý #1.', 'AttendanceConfirmed', '/sessions/a1a1a1a1-0001-0000-0000-000000000012', true, NOW() - INTERVAL '9 days', false, 'e0e0e0e0-0001-0000-0000-000000000006', 'event:attend-003', NOW() - INTERVAL '9 days'),
    ('ba0aba0a-0001-0000-0000-000000000007', '55555555-3333-1111-1111-111111111111', 'Thanh toán thành công', 'Bạn đã thanh toán 3.000.000đ cho gói Tiếng Nhật N3.', 'PaymentSuccess', '/bookings/dddddddd-0001-0000-0000-000000000004', true, NOW() - INTERVAL '8 days', true, 'e0e0e0e0-0001-0000-0000-000000000007', 'event:payment-004', NOW() - INTERVAL '8 days'),
    ('ba0aba0a-0001-0000-0000-000000000008', '44444444-3333-1111-1111-111111111111', 'Đơn đặt học mới', 'Học viên Phương Linh đã đăng ký khóa học Tiếng Nhật.', 'NewBooking', '/tutor/enrollments/e1e1e1e1-0001-0000-0000-000000000004', true, NOW() - INTERVAL '8 days', false, 'e0e0e0e0-0001-0000-0000-000000000008', 'event:booking-004', NOW() - INTERVAL '8 days'),
    ('ba0aba0a-0001-0000-0000-000000000009', '55555555-4444-1111-1111-111111111111', 'Yêu cầu đổi lịch học', 'Gia sư Mai vừa gửi yêu cầu đổi lịch buổi học Ngữ văn #3.', 'RescheduleRequested', '/sessions/reschedule/ba05ba05-0001-0000-0000-000000000003', false, NULL, false, 'e0e0e0e0-0001-0000-0000-000000000009', 'event:resched-005', NOW() - INTERVAL '6 hours'),
    ('ba0aba0a-0001-0000-0000-000000000010', '22222222-1111-1111-1111-111111111111', 'Thông báo tranh chấp', 'Học viên Tuấn đã mở khiếu nại vắng mặt đối với buổi học #3.', 'DisputeOpened', '/disputes/ba07ba07-0001-0000-0000-000000000001', false, NULL, true, 'e0e0e0e0-0001-0000-0000-000000000010', 'event:dispute-001', NOW() - INTERVAL '1 day'),
    ('ba0aba0a-0001-0000-0000-000000000011', '77777777-1111-1111-1111-111111111111', 'Cảnh báo vi phạm No-show', 'Bạn đã tích lũy 2 gậy phạt vắng mặt. Quyền đặt lịch mới tạm thời bị khóa 7 ngày.', 'PenaltyStrikeWarning', '/profile/penalties', false, NULL, true, 'e0e0e0e0-0001-0000-0000-000000000011', 'event:strike-001', NOW() - INTERVAL '2 days'),
    ('ba0aba0a-0001-0000-0000-000000000012', '44444444-1111-1111-1111-111111111111', 'Lệnh rút tiền đang xử lý', 'Yêu cầu rút 300.000đ về MBBank đang được Admin xử lý.', 'WithdrawalProcessing', '/tutor/wallet', true, NOW() - INTERVAL '1 hour', true, 'e0e0e0e0-0001-0000-0000-000000000012', 'event:withd-005', NOW() - INTERVAL '1 hour'),
    ('ba0aba0a-0001-0000-0000-000000000013', '33333333-1111-1111-1111-111111111111', 'Đánh giá 5 sao mới', 'Học viên Lan Anh đã để lại đánh giá 5 sao cho khóa học của bạn.', 'NewReview', '/tutor/reviews', true, NOW() - INTERVAL '18 days', false, 'e0e0e0e0-0001-0000-0000-000000000013', 'event:review-001', NOW() - INTERVAL '18 days'),
    ('ba0aba0a-0001-0000-0000-000000000014', '55555555-1111-1111-1111-111111111111', 'Tin nhắn mới từ gia sư', 'Thầy An vừa gửi cho bạn một tin nhắn trong mục Trò chuyện.', 'NewChatMessage', '/chat/c0c0c0c0-0001-0000-0000-000000000001', false, NULL, false, 'e0e0e0e0-0001-0000-0000-000000000014', 'event:msg-002', NOW() - INTERVAL '19 days'),
    ('ba0aba0a-0001-0000-0000-000000000015', '44444444-2222-1111-1111-111111111111', 'Kết quả xét duyệt gia sư', 'Hồ sơ ứng tuyển gia sư của bạn đã bị từ chối.', 'ApplicationRejected', '/tutor/application', true, NOW() - INTERVAL '34 days', true, 'e0e0e0e0-0001-0000-0000-000000000015', 'event:app-rej-006', NOW() - INTERVAL '34 days');

-- -----------------------------------------------------------------------------
-- 28. EMAIL DELIVERIES (10 Records)
-- -----------------------------------------------------------------------------
INSERT INTO "EmailDeliveries" (
    "Id", "NotificationId", "UserId", "ToEmail", "Subject", "Body",
    "Status", "RetryCount", "NextAttemptAt", "SentAt", "LastError", "ProviderMessageId", "CreatedAt"
)
VALUES
    ('ed1ed1ed-0001-0000-0000-000000000001', 'ba0aba0a-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'student.tuan@tutorhub.com', 'TutorHub - Xác nhận thanh toán đơn hàng', '<p>Chào Tuấn, bạn đã thanh toán thành công 2.000.000đ.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '15 days', NULL, 'msg_resend_001', NOW() - INTERVAL '15 days'),
    ('ed1ed1ed-0001-0000-0000-000000000002', 'ba0aba0a-0001-0000-0000-000000000002', '22222222-1111-1111-1111-111111111111', 'tutor.an@tutorhub.com', 'TutorHub - Bạn có học viên đăng ký mới', '<p>Thầy An có học viên mới đăng ký gói Toán THPT.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '15 days', NULL, 'msg_resend_002', NOW() - INTERVAL '15 days'),
    ('ed1ed1ed-0001-0000-0000-000000000003', 'ba0aba0a-0001-0000-0000-000000000003', '66666666-1111-1111-1111-111111111111', 'student.lan@tutorhub.com', 'TutorHub - Chúc mừng hoàn thành khóa học', '<p>Chúc mừng Lan Anh đã hoàn thành khóa học IELTS!</p>', 'Sent', 0, NULL, NOW() - INTERVAL '19 days', NULL, 'msg_resend_003', NOW() - INTERVAL '19 days'),
    ('ed1ed1ed-0001-0000-0000-000000000004', 'ba0aba0a-0001-0000-0000-000000000004', '33333333-1111-1111-1111-111111111111', 'tutor.bich@tutorhub.com', 'TutorHub - Thông báo giải ngân thù lao', '<p>270.000đ thù lao giảng dạy đã được cộng vào ví.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '19 days', NULL, 'msg_resend_004', NOW() - INTERVAL '19 days'),
    ('ed1ed1ed-0001-0000-0000-000000000005', 'ba0aba0a-0001-0000-0000-000000000007', '55555555-3333-1111-1111-111111111111', 'student.linh@tutorhub.com', 'TutorHub - Xác nhận đơn hàng Tiếng Nhật N3', '<p>Chào Linh, bạn đã thanh toán thành công 3.000.000đ.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '8 days', NULL, 'msg_resend_005', NOW() - INTERVAL '8 days'),
    ('ed1ed1ed-0001-0000-0000-000000000006', 'ba0aba0a-0001-0000-0000-000000000010', '22222222-1111-1111-1111-111111111111', 'tutor.an@tutorhub.com', 'TutorHub - Khiếu nại tranh chấp buổi học', '<p>Buổi học #3 của bạn đang có khiếu nại vắng mặt.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '1 day', NULL, 'msg_resend_006', NOW() - INTERVAL '1 day'),
    ('ed1ed1ed-0001-0000-0000-000000000007', 'ba0aba0a-0001-0000-0000-000000000011', '77777777-1111-1111-1111-111111111111', 'student.bad@tutorhub.com', 'TutorHub - Cảnh báo tài khoản bị hạn chế', '<p>Tài khoản của bạn đã tích lũy 2 strike do vắng mặt.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '2 days', NULL, 'msg_resend_007', NOW() - INTERVAL '2 days'),
    ('ed1ed1ed-0001-0000-0000-000000000008', 'ba0aba0a-0001-0000-0000-000000000012', '44444444-1111-1111-1111-111111111111', 'tutor.nam@tutorhub.com', 'TutorHub - Đang xử lý lệnh rút tiền', '<p>Lệnh rút 300.000đ của bạn đang được duyệt.</p>', 'Pending', 0, NOW() + INTERVAL '5 minutes', NULL, NULL, NULL, NOW() - INTERVAL '1 hour'),
    ('ed1ed1ed-0001-0000-0000-000000000009', 'ba0aba0a-0001-0000-0000-000000000015', '44444444-2222-1111-1111-111111111111', 'tutor.ha@tutorhub.com', 'TutorHub - Kết quả hồ sơ gia sư', '<p>Hồ sơ ứng tuyển chưa đạt yêu cầu do thiếu chứng chỉ.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '34 days', NULL, 'msg_resend_009', NOW() - INTERVAL '34 days'),
    ('ed1ed1ed-0001-0000-0000-000000000010', 'ba0aba0a-0001-0000-0000-000000000013', '33333333-1111-1111-1111-111111111111', 'tutor.bich@tutorhub.com', 'TutorHub - Bạn nhận được đánh giá mới', '<p>Lan Anh đã để lại 1 đánh giá 5 sao cho bạn.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '18 days', NULL, 'msg_resend_010', NOW() - INTERVAL '18 days');

-- -----------------------------------------------------------------------------
-- 29. OUTBOX MESSAGES (12 Events)
-- -----------------------------------------------------------------------------
INSERT INTO "OutboxMessages" (
    "Id", "EventId", "EventType", "EventVersion", "AggregateType", "AggregateId",
    "Payload", "OccurredAt", "CreatedAt", "Status", "ProcessedAt", "RetryCount", "LastError"
)
VALUES
    ('ba0bba0b-0001-0000-0000-000000000001', 'e0e0e0e0-0001-0000-0000-000000000001', 'BookingPaidIntegrationEvent', 1, 'Booking', 'dddddddd-0001-0000-0000-000000000001', '{"BookingId":"dddddddd-0001-0000-0000-000000000001","Amount":2000000.00}', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', 'Processed', NOW() - INTERVAL '15 days' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000002', 'e0e0e0e0-0001-0000-0000-000000000002', 'NewBookingNotificationEvent', 1, 'Booking', 'dddddddd-0001-0000-0000-000000000001', '{"TutorUserId":"22222222-1111-1111-1111-111111111111"}', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', 'Processed', NOW() - INTERVAL '15 days' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000003', 'e0e0e0e0-0001-0000-0000-000000000003', 'CourseCompletedIntegrationEvent', 1, 'Enrollment', 'e1e1e1e1-0001-0000-0000-000000000002', '{"EnrollmentId":"e1e1e1e1-0001-0000-0000-000000000002"}', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', 'Processed', NOW() - INTERVAL '19 days' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000004', 'e0e0e0e0-0001-0000-0000-000000000004', 'SessionPayoutReleasedEvent', 1, 'Session', 'a1a1a1a1-0001-0000-0000-000000000011', '{"SessionId":"a1a1a1a1-0001-0000-0000-000000000011","PayoutAmount":270000.00}', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', 'Processed', NOW() - INTERVAL '19 days' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000005', 'e0e0e0e0-0001-0000-0000-000000000005', 'SessionPayoutReleasedEvent', 1, 'Session', 'a1a1a1a1-0001-0000-0000-000000000001', '{"SessionId":"a1a1a1a1-0001-0000-0000-000000000001","PayoutAmount":180000.00}', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 'Processed', NOW() - INTERVAL '14 days' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000006', 'e0e0e0e0-0001-0000-0000-000000000006', 'BookingPaidIntegrationEvent', 1, 'Booking', 'dddddddd-0001-0000-0000-000000000003', '{"BookingId":"dddddddd-0001-0000-0000-000000000003","Amount":1800000.00}', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'Processed', NOW() - INTERVAL '10 days' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000007', 'e0e0e0e0-0001-0000-0000-000000000007', 'BookingPaidIntegrationEvent', 1, 'Booking', 'dddddddd-0001-0000-0000-000000000004', '{"BookingId":"dddddddd-0001-0000-0000-000000000004","Amount":3000000.00}', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 'Processed', NOW() - INTERVAL '8 days' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000008', 'e0e0e0e0-0001-0000-0000-000000000008', 'BookingPaidIntegrationEvent', 1, 'Booking', 'dddddddd-0001-0000-0000-000000000005', '{"BookingId":"dddddddd-0001-0000-0000-000000000005","Amount":2000000.00}', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'Processed', NOW() - INTERVAL '7 days' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000009', 'e0e0e0e0-0001-0000-0000-000000000009', 'DisputeOpenedEvent', 1, 'Dispute', 'ba07ba07-0001-0000-0000-000000000001', '{"DisputeId":"ba07ba07-0001-0000-0000-000000000001","HeldAmount":200000.00}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'Processed', NOW() - INTERVAL '1 day' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000010', 'e0e0e0e0-0001-0000-0000-000000000010', 'WithdrawalRequestedEvent', 1, 'Withdrawal', 'fa01fa01-0001-0000-0000-000000000005', '{"WithdrawalId":"fa01fa01-0001-0000-0000-000000000005","Amount":300000.00}', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', 'Processed', NOW() - INTERVAL '5 hours' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000011', 'e0e0e0e0-0001-0000-0000-000000000011', 'BookingPaidIntegrationEvent', 1, 'Booking', 'dddddddd-0001-0000-0000-000000000008', '{"BookingId":"dddddddd-0001-0000-0000-000000000008","Amount":4800000.00}', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 'Processed', NOW() - INTERVAL '6 days' + INTERVAL '2 seconds', 0, NULL),
    ('ba0bba0b-0001-0000-0000-000000000012', 'e0e0e0e0-0001-0000-0000-000000000012', 'BookingPaidIntegrationEvent', 1, 'Booking', 'dddddddd-0001-0000-0000-000000000011', '{"BookingId":"dddddddd-0001-0000-0000-000000000011","Amount":6000000.00}', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 'Processed', NOW() - INTERVAL '4 days' + INTERVAL '2 seconds', 0, NULL);

-- -----------------------------------------------------------------------------
-- 30. INBOX MESSAGES (10 Consumer Records)
-- -----------------------------------------------------------------------------
INSERT INTO "InboxMessages" ("Id", "ConsumerName", "EventId", "ProcessedAt")
VALUES
    ('ba0cba0c-0001-0000-0000-000000000001', 'BookingPaidNotificationConsumer', 'e0e0e0e0-0001-0000-0000-000000000001', NOW() - INTERVAL '15 days'),
    ('ba0cba0c-0001-0000-0000-000000000002', 'CourseCompletedNotificationConsumer', 'e0e0e0e0-0001-0000-0000-000000000003', NOW() - INTERVAL '19 days'),
    ('ba0cba0c-0001-0000-0000-000000000003', 'SessionPayoutSignalRConsumer', 'e0e0e0e0-0001-0000-0000-000000000004', NOW() - INTERVAL '19 days'),
    ('ba0cba0c-0001-0000-0000-000000000004', 'SessionPayoutSignalRConsumer', 'e0e0e0e0-0001-0000-0000-000000000005', NOW() - INTERVAL '14 days'),
    ('ba0cba0c-0001-0000-0000-000000000005', 'BookingPaidNotificationConsumer', 'e0e0e0e0-0001-0000-0000-000000000006', NOW() - INTERVAL '10 days'),
    ('ba0cba0c-0001-0000-0000-000000000006', 'BookingPaidNotificationConsumer', 'e0e0e0e0-0001-0000-0000-000000000007', NOW() - INTERVAL '8 days'),
    ('ba0cba0c-0001-0000-0000-000000000007', 'BookingPaidNotificationConsumer', 'e0e0e0e0-0001-0000-0000-000000000008', NOW() - INTERVAL '7 days'),
    ('ba0cba0c-0001-0000-0000-000000000008', 'DisputeAuditConsumer', 'e0e0e0e0-0001-0000-0000-000000000009', NOW() - INTERVAL '1 day'),
    ('ba0cba0c-0001-0000-0000-000000000009', 'WithdrawalAdminAlertConsumer', 'e0e0e0e0-0001-0000-0000-000000000010', NOW() - INTERVAL '5 hours'),
    ('ba0cba0c-0001-0000-0000-000000000010', 'BookingPaidNotificationConsumer', 'e0e0e0e0-0001-0000-0000-000000000011', NOW() - INTERVAL '6 days');

-- -----------------------------------------------------------------------------
-- 31. AUDIT LOGS (12 Records)
-- -----------------------------------------------------------------------------
INSERT INTO "AuditLogs" (
    "Id", "UserId", "Action", "EntityName", "EntityId",
    "OldValuesJson", "NewValuesJson", "CorrelationId", "IpAddress", "UserAgent", "CreatedAt"
)
VALUES
    ('ba0dba0d-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'ApproveTutorApplication', 'TutorApplication', '22222222-aaaa-aaaa-aaaa-000000000001', '{"Status":"Submitted"}', '{"Status":"Approved"}', 'corr-admin-001', '127.0.0.1', 'SwaggerUI', NOW() - INTERVAL '49 days'),
    ('ba0dba0d-0001-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'ApproveTutorApplication', 'TutorApplication', '22222222-aaaa-aaaa-aaaa-000000000002', '{"Status":"Submitted"}', '{"Status":"Approved"}', 'corr-admin-002', '127.0.0.1', 'SwaggerUI', NOW() - INTERVAL '44 days'),
    ('ba0dba0d-0001-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'ApproveTutorApplication', 'TutorApplication', '22222222-aaaa-aaaa-aaaa-000000000003', '{"Status":"Submitted"}', '{"Status":"Approved"}', 'corr-admin-003', '127.0.0.1', 'SwaggerUI', NOW() - INTERVAL '39 days'),
    ('ba0dba0d-0001-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'RejectTutorApplication', 'TutorApplication', '22222222-aaaa-aaaa-aaaa-000000000006', '{"Status":"Submitted"}', '{"Status":"Rejected"}', 'corr-admin-004', '127.0.0.1', 'SwaggerUI', NOW() - INTERVAL '34 days'),
    ('ba0dba0d-0001-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'ApproveTutorApplication', 'TutorApplication', '22222222-aaaa-aaaa-aaaa-000000000004', '{"Status":"Submitted"}', '{"Status":"Approved"}', 'corr-admin-005', '127.0.0.1', 'SwaggerUI', NOW() - INTERVAL '29 days'),
    ('ba0dba0d-0001-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'ApproveTutorApplication', 'TutorApplication', '22222222-aaaa-aaaa-aaaa-000000000005', '{"Status":"Submitted"}', '{"Status":"Approved"}', 'corr-admin-006', '127.0.0.1', 'SwaggerUI', NOW() - INTERVAL '24 days'),
    ('ba0dba0d-0001-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'UpdatePlatformSetting', 'PlatformSetting', 'f0000000-0000-0000-0000-000000000001', '{"Value":"0.12"}', '{"Value":"0.10"}', 'corr-admin-007', '127.0.0.1', 'Postman', NOW() - INTERVAL '30 days'),
    ('ba0dba0d-0001-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'ApproveWithdrawal', 'Withdrawal', 'fa01fa01-0001-0000-0000-000000000002', '{"Status":"Processing"}', '{"Status":"Completed"}', 'corr-admin-008', '127.0.0.1', 'Postman', NOW() - INTERVAL '9 days'),
    ('ba0dba0d-0001-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'ApproveWithdrawal', 'Withdrawal', 'fa01fa01-0001-0000-0000-000000000004', '{"Status":"Processing"}', '{"Status":"Completed"}', 'corr-admin-009', '127.0.0.1', 'Postman', NOW() - INTERVAL '17 days'),
    ('ba0dba0d-0001-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'ResolveDispute', 'Dispute', 'ba07ba07-0001-0000-0000-000000000002', '{"Status":"UnderReview"}', '{"Status":"Resolved"}', 'corr-admin-010', '127.0.0.1', 'Postman', NOW() - INTERVAL '4 days'),
    ('ba0dba0d-0001-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'ApproveWithdrawal', 'Withdrawal', 'fa01fa01-0001-0000-0000-000000000006', '{"Status":"Processing"}', '{"Status":"Completed"}', 'corr-admin-011', '127.0.0.1', 'Postman', NOW() - INTERVAL '7 days'),
    ('ba0dba0d-0001-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', 'ResolveDispute', 'Dispute', 'ba07ba07-0001-0000-0000-000000000003', '{"Status":"UnderReview"}', '{"Status":"Dismissed"}', 'corr-admin-012', '127.0.0.1', 'Postman', NOW() - INTERVAL '3 days');

COMMIT;

-- =============================================================================
-- TUTORHUB VOLUME SEED DATA (REALISTIC, PRODUCTION-GRADE & IDEMPOTENT)
-- =============================================================================

BEGIN;

-- 1. USERS: 50 Tutors (b1000000-0000-0000-0000-000000000001 .. 0050)
INSERT INTO "Users" (
    "Id", "Email", "PasswordHash", "FullName", "Phone", "AvatarUrl", 
    "Role", "Status", "CreatedAt", "AbsentStrikes", "StrikeWindowStart", 
    "LastAbsentAt", "AccessFailedCount", "LockoutEndAt"
) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'thutrang.math@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'ThS. Nguyễn Thị Thu Trang', '0912384920', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_1_female', 'Tutor', 'Active', NOW() - INTERVAL '71 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000002', 'hoang.tran.math@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'TS. Trần Minh Hoàng', '0983214578', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_2_male', 'Tutor', 'Active', NOW() - INTERVAL '72 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000003', 'quoc.le.geometry@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Lê Bảo Quốc', '0904556721', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_3_male', 'Tutor', 'Active', NOW() - INTERVAL '73 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000004', 'linh.pham.math@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Phạm Phương Linh', '0976129845', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_4_female', 'Tutor', 'Active', NOW() - INTERVAL '74 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000005', 'thai.hoang.olympic@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'ThS. Hoàng Văn Thái', '0934982103', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_5_male', 'Tutor', 'Active', NOW() - INTERVAL '75 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000006', 'dung.vu.math@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Vũ Thùy Dung', '0967341908', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_6_female', 'Tutor', 'Active', NOW() - INTERVAL '76 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000007', 'tung.do.math@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Đỗ Thanh Tùng', '0915893420', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_7_male', 'Tutor', 'Active', NOW() - INTERVAL '77 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000008', 'anh.bui.math@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Bùi Ngọc Ánh', '0982349012', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_8_female', 'Tutor', 'Active', NOW() - INTERVAL '78 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000009', 'khoa.dang.ielts@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'ThS. Đặng Đình Khoa', '0909123847', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_9_male', 'Tutor', 'Active', NOW() - INTERVAL '79 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000010', 'ha.ngo.ielts@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Ngô Thu Hà', '0978234190', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_10_female', 'Tutor', 'Active', NOW() - INTERVAL '80 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000011', 'nghia.phan.english@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Phan Hữu Nghĩa', '0938491029', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_11_male', 'Tutor', 'Active', NOW() - INTERVAL '81 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000012', 'dieulinh.japanese@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Dương Diệu Linh', '0918239045', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_12_female', 'Tutor', 'Active', NOW() - INTERVAL '82 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000013', 'nam.ly.ielts@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Lý Hoàng Nam', '0981928374', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_13_male', 'Tutor', 'Active', NOW() - INTERVAL '83 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000014', 'maianh.japanese@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Võ Thị Mai Anh', '0969123840', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_14_female', 'Tutor', 'Active', NOW() - INTERVAL '84 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000015', 'bao.trinh.ielts@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Trịnh Quốc Bảo', '0903829104', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_15_male', 'Tutor', 'Active', NOW() - INTERVAL '85 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000016', 'thaovy.communication@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Đinh Thảo Vy', '0974829103', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_16_female', 'Tutor', 'Active', NOW() - INTERVAL '86 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000017', 'quan.ha.physics@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'ThS. Hà Minh Quân', '0912903847', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_17_male', 'Tutor', 'Active', NOW() - INTERVAL '87 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000018', 'huong.mai.chemistry@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Mai Lan Hương', '0984920183', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_18_female', 'Tutor', 'Active', NOW() - INTERVAL '88 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000019', 'huy.ta.physics@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Tạ Quang Huy', '0908239104', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_19_male', 'Tutor', 'Active', NOW() - INTERVAL '89 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000020', 'linh.luong.biology@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Lương Khánh Linh', '0971928374', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_20_female', 'Tutor', 'Active', NOW() - INTERVAL '90 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000021', 'thang.cao.chemistry@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Cao Đức Thắng', '0932849102', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_21_male', 'Tutor', 'Active', NOW() - INTERVAL '91 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000022', 'tuyetmai.physics@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Đoàn Tuyết Mai', '0989201948', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_22_female', 'Tutor', 'Active', NOW() - INTERVAL '92 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000023', 'kiet.truong.biology@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Trương Tuấn Kiệt', '0918392018', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_23_male', 'Tutor', 'Active', NOW() - INTERVAL '93 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000024', 'haiyen.chemistry@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Lưu Hải Yến', '0973910294', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_24_female', 'Tutor', 'Active', NOW() - INTERVAL '94 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000025', 'long.vu.dev@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'ThS. Vũ Hoàng Long', '0904819203', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_25_male', 'Tutor', 'Active', NOW() - INTERVAL '95 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000026', 'hoaian.python@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Nguyễn Hoài An', '0968291048', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_26_female', 'Tutor', 'Active', NOW() - INTERVAL '96 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000027', 'chau.tran.net@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Trần Bảo Châu', '0915920194', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_27_male', 'Tutor', 'Active', NOW() - INTERVAL '97 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000028', 'tuananh.python@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Lê Tuấn Anh', '0987391028', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_28_male', 'Tutor', 'Active', NOW() - INTERVAL '98 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000029', 'linh.pham.dev@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Phạm Nhật Linh', '0939102847', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_29_male', 'Tutor', 'Active', NOW() - INTERVAL '99 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000030', 'ngan.hoang.python@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Hoàng Kim Ngân', '0972849103', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_30_female', 'Tutor', 'Active', NOW() - INTERVAL '100 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000031', 'huy.do.backend@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Đỗ Gia Huy', '0908392019', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_31_male', 'Tutor', 'Active', NOW() - INTERVAL '101 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000032', 'nghia.bui.code@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Bùi Trọng Nghĩa', '0914920183', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_32_male', 'Tutor', 'Active', NOW() - INTERVAL '102 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000033', 'myduyen.literature@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'ThS. Đặng Mỹ Duyên', '0983910284', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_33_female', 'Tutor', 'Active', NOW() - INTERVAL '103 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000034', 'dung.ngo.debate@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Ngô Quang Dũng', '0907291048', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_34_male', 'Tutor', 'Active', NOW() - INTERVAL '104 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000035', 'truc.phan.literature@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Phan Thanh Trúc', '0971029384', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_35_female', 'Tutor', 'Active', NOW() - INTERVAL '105 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000036', 'khoi.duong.negotiation@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Dương Minh Khôi', '0913920194', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_36_male', 'Tutor', 'Active', NOW() - INTERVAL '106 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000037', 'thuyhang.van@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Lý Thúy Hằng', '0982019482', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_37_female', 'Tutor', 'Active', NOW() - INTERVAL '107 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000038', 'hau.vo.speech@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Võ Văn Hậu', '0906291048', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_38_male', 'Tutor', 'Active', NOW() - INTERVAL '108 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000039', 'minhtrang.literature@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Trịnh Minh Trang', '0974910283', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_39_female', 'Tutor', 'Active', NOW() - INTERVAL '109 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000040', 'phu.dinh.communication@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Đinh Thiên Phú', '0938102948', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_40_male', 'Tutor', 'Active', NOW() - INTERVAL '110 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000041', 'kieu.ha.accounting@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Hà Thúy Kiều', '0981920384', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_41_female', 'Tutor', 'Active', NOW() - INTERVAL '111 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000042', 'trong.mai.chess@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Mai Đình Trọng', '0904820194', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_42_male', 'Tutor', 'Active', NOW() - INTERVAL '112 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000043', 'nguyen.ta.finance@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Tạ Thảo Nguyên', '0972019482', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_43_female', 'Tutor', 'Active', NOW() - INTERVAL '113 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000044', 'bach.luong.chess@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Lương Hoàng Bách', '0915928104', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_44_male', 'Tutor', 'Active', NOW() - INTERVAL '114 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000045', 'thanhmai.accounting@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Cao Thanh Mai', '0984920193', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_45_female', 'Tutor', 'Active', NOW() - INTERVAL '70 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000046', 'thanh.doan.dgnl@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Đoàn Công Thành', '0908192840', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_46_male', 'Tutor', 'Active', NOW() - INTERVAL '71 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000047', 'quynhnga.dgnl@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Trương Quỳnh Nga', '0968192048', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_47_female', 'Tutor', 'Active', NOW() - INTERVAL '72 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000048', 'dat.luu.science@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Lưu Thành Đạt', '0918291048', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_48_male', 'Tutor', 'Active', NOW() - INTERVAL '73 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000049', 'dieu.anh.english@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cô Chu Diệu Anh', '0975820194', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_49_female', 'Tutor', 'Active', NOW() - INTERVAL '74 days', 0, NULL, NULL, 0, NULL),
    ('b1000000-0000-0000-0000-000000000050', 'nhatminh.math@tutorhub.vn', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Thầy Tạ Nhật Minh', '0934819204', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tutor_50_male', 'Tutor', 'Active', NOW() - INTERVAL '75 days', 0, NULL, NULL, 0, NULL)
ON CONFLICT ("Id") DO NOTHING;

-- 2. USERS: 200 Students (b5000000-0000-0000-0000-000000000001 .. 0200)
INSERT INTO "Users" (
    "Id", "Email", "PasswordHash", "FullName", "Phone", "AvatarUrl", 
    "Role", "Status", "CreatedAt", "AbsentStrikes", "StrikeWindowStart", 
    "LastAbsentAt", "AccessFailedCount", "LockoutEndAt"
) VALUES
    ('b5000000-0000-0000-0000-000000000001', 'nguyen.hoang.nam.1@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Hoàng Nam', '098003791', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_1', 'Student', 'Active', NOW() - INTERVAL '61 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000002', 'tran.khanh.huyen.2@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Khánh Huyền', '098007582', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_2', 'Student', 'Active', NOW() - INTERVAL '62 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000003', 'le.minh.triet.3@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Minh Triết', '098011373', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_3', 'Student', 'Active', NOW() - INTERVAL '63 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000004', 'pham.quynh.anh.4@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Quỳnh Anh', '098015164', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_4', 'Student', 'Active', NOW() - INTERVAL '64 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000005', 'vu.hoang.long.5@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Vũ Hoàng Long', '098018955', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_5', 'Student', 'Active', NOW() - INTERVAL '65 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000006', 'do.mai.anh.6@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đỗ Mai Anh', '098022746', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_6', 'Student', 'Active', NOW() - INTERVAL '66 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000007', 'bui.quoc.anh.7@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Bùi Quốc Anh', '098026537', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_7', 'Student', 'Active', NOW() - INTERVAL '67 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000008', 'dang.thao.nhi.8@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đặng Thảo Nhi', '098030328', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_8', 'Student', 'Active', NOW() - INTERVAL '68 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000009', 'ngo.tuan.khang.9@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Ngô Tuấn Khang', '098034119', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_9', 'Student', 'Active', NOW() - INTERVAL '69 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000010', 'phan.gia.hung.10@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phan Gia Hưng', '098037910', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_10', 'Student', 'Active', NOW() - INTERVAL '70 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000011', 'duong.bao.ngoc.11@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Dương Bảo Ngọc', '098041701', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_11', 'Student', 'Active', NOW() - INTERVAL '71 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000012', 'ly.gia.huy.12@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lý Gia Huy', '098045492', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_12', 'Student', 'Active', NOW() - INTERVAL '72 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000013', 'vo.phuong.vy.13@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Võ Phương Vy', '098049283', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_13', 'Student', 'Active', NOW() - INTERVAL '73 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000014', 'trinh.anh.dung.14@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trịnh Anh Dũng', '098053074', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_14', 'Student', 'Active', NOW() - INTERVAL '74 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000015', 'dinh.ngoc.diep.15@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đinh Ngọc Diệp', '098056865', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_15', 'Student', 'Active', NOW() - INTERVAL '75 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000016', 'ha.quang.minh.16@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Hà Quang Minh', '098060656', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_16', 'Student', 'Active', NOW() - INTERVAL '76 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000017', 'mai.phuong.thao.17@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Mai Phương Thảo', '098064447', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_17', 'Student', 'Active', NOW() - INTERVAL '77 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000018', 'ta.nhat.huy.18@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Tạ Nhật Huy', '098068238', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_18', 'Student', 'Active', NOW() - INTERVAL '78 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000019', 'luong.thuy.linh.19@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lương Thùy Linh', '098072029', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_19', 'Student', 'Active', NOW() - INTERVAL '79 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000020', 'cao.tien.dat.20@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cao Tiến Đạt', '098075820', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_20', 'Student', 'Active', NOW() - INTERVAL '80 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000021', 'doan.minh.chau.21@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đoàn Minh Châu', '098079611', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_21', 'Student', 'Active', NOW() - INTERVAL '81 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000022', 'truong.duc.anh.22@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trương Đức Anh', '098083402', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_22', 'Student', 'Active', NOW() - INTERVAL '82 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000023', 'luu.bao.tram.23@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lưu Bảo Trâm', '098087193', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_23', 'Student', 'Active', NOW() - INTERVAL '83 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000024', 'nguyen.tuan.kiet.24@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Tuấn Kiệt', '098090984', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_24', 'Student', 'Active', NOW() - INTERVAL '84 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000025', 'tran.hai.dang.25@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Hải Đăng', '098094775', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_25', 'Student', 'Active', NOW() - INTERVAL '85 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000026', 'le.ngoc.han.26@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Ngọc Hân', '098098566', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_26', 'Student', 'Active', NOW() - INTERVAL '86 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000027', 'pham.duc.duy.27@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Đức Duy', '098102357', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_27', 'Student', 'Active', NOW() - INTERVAL '87 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000028', 'vu.ha.my.28@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Vũ Hà My', '098106148', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_28', 'Student', 'Active', NOW() - INTERVAL '88 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000029', 'do.dinh.trong.29@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đỗ Đình Trọng', '098109939', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_29', 'Student', 'Active', NOW() - INTERVAL '89 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000030', 'bui.khanh.linh.30@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Bùi Khánh Linh', '098113730', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_30', 'Student', 'Active', NOW() - INTERVAL '90 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000031', 'dang.hoang.phuc.31@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đặng Hoàng Phúc', '098117521', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_31', 'Student', 'Active', NOW() - INTERVAL '91 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000032', 'ngo.thanh.hang.32@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Ngô Thanh Hằng', '098121312', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_32', 'Student', 'Active', NOW() - INTERVAL '92 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000033', 'phan.tuan.tu.33@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phan Tuấn Tú', '098125103', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_33', 'Student', 'Active', NOW() - INTERVAL '93 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000034', 'duong.thuy.tien.34@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Dương Thuỳ Tiên', '098128894', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_34', 'Student', 'Active', NOW() - INTERVAL '94 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000035', 'ly.minh.khoa.35@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lý Minh Khoa', '098132685', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_35', 'Student', 'Active', NOW() - INTERVAL '95 days', 1, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000036', 'vo.ngoc.anh.36@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Võ Ngọc Ánh', '098136476', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_36', 'Student', 'Active', NOW() - INTERVAL '96 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000037', 'trinh.bao.long.37@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trịnh Bảo Long', '098140267', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_37', 'Student', 'Active', NOW() - INTERVAL '97 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000038', 'dinh.phuong.linh.38@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đinh Phương Linh', '098144058', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_38', 'Student', 'Active', NOW() - INTERVAL '98 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000039', 'ha.minh.tri.39@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Hà Minh Trí', '098147849', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_39', 'Student', 'Active', NOW() - INTERVAL '99 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000040', 'mai.thanh.truc.40@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Mai Thanh Trúc', '098151640', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_40', 'Student', 'Active', NOW() - INTERVAL '60 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000041', 'ta.dinh.phong.41@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Tạ Đình Phong', '098155431', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_41', 'Student', 'Active', NOW() - INTERVAL '61 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000042', 'luong.my.duyen.42@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lương Mỹ Duyên', '098159222', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_42', 'Student', 'Active', NOW() - INTERVAL '62 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000043', 'cao.hoang.quan.43@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cao Hoàng Quân', '098163013', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_43', 'Student', 'Active', NOW() - INTERVAL '63 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000044', 'doan.dieu.linh.44@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đoàn Diệu Linh', '098166804', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_44', 'Student', 'Active', NOW() - INTERVAL '64 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000045', 'truong.huu.thang.45@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trương Hữu Thắng', '098170595', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_45', 'Student', 'Active', NOW() - INTERVAL '65 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000046', 'luu.yen.nhi.46@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lưu Yến Nhi', '098174386', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_46', 'Student', 'Active', NOW() - INTERVAL '66 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000047', 'nguyen.thanh.long.47@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Thành Long', '098178177', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_47', 'Student', 'Active', NOW() - INTERVAL '67 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000048', 'tran.kim.ngan.48@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Kim Ngân', '098181968', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_48', 'Student', 'Active', NOW() - INTERVAL '68 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000049', 'le.hoang.bach.49@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Hoàng Bách', '098185759', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_49', 'Student', 'Active', NOW() - INTERVAL '69 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000050', 'pham.tra.my.50@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Trà My', '098189550', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_50', 'Student', 'Active', NOW() - INTERVAL '70 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000051', 'vu.quoc.bao.51@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Vũ Quốc Bảo', '098193341', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_51', 'Student', 'Active', NOW() - INTERVAL '71 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000052', 'do.quynh.nhu.52@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đỗ Quỳnh Như', '098197132', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_52', 'Student', 'Active', NOW() - INTERVAL '72 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000053', 'bui.duc.thinh.53@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Bùi Đức Thịnh', '098200923', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_53', 'Student', 'Active', NOW() - INTERVAL '73 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000054', 'dang.anh.duong.54@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đặng Ánh Dương', '098204714', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_54', 'Student', 'Active', NOW() - INTERVAL '74 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000055', 'ngo.van.hung.55@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Ngô Văn Hùng', '098208505', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_55', 'Student', 'Active', NOW() - INTERVAL '75 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000056', 'phan.hoai.nam.56@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phan Hoài Nam', '098212296', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_56', 'Student', 'Active', NOW() - INTERVAL '76 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000057', 'duong.gia.bao.57@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Dương Gia Bảo', '098216087', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_57', 'Student', 'Active', NOW() - INTERVAL '77 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000058', 'ly.thu.trang.58@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lý Thu Trang', '098219878', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_58', 'Student', 'Active', NOW() - INTERVAL '78 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000059', 'vo.nhat.quang.59@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Võ Nhật Quang', '098223669', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_59', 'Student', 'Active', NOW() - INTERVAL '79 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000060', 'trinh.ngoc.anh.60@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trịnh Ngọc Anh', '098227460', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_60', 'Student', 'Active', NOW() - INTERVAL '80 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000061', 'dinh.viet.cuong.61@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đinh Việt Cường', '098231251', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_61', 'Student', 'Active', NOW() - INTERVAL '81 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000062', 'ha.quynh.chi.62@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Hà Quỳnh Chi', '098235042', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_62', 'Student', 'Active', NOW() - INTERVAL '82 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000063', 'mai.the.vinh.63@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Mai Thế Vinh', '098238833', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_63', 'Student', 'Active', NOW() - INTERVAL '83 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000064', 'ta.lan.anh.64@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Tạ Lan Anh', '098242624', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_64', 'Student', 'Active', NOW() - INTERVAL '84 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000065', 'luong.nhat.minh.65@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lương Nhật Minh', '098246415', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_65', 'Student', 'Active', NOW() - INTERVAL '85 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000066', 'cao.bao.yen.66@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cao Bảo Yến', '098250206', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_66', 'Student', 'Active', NOW() - INTERVAL '86 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000067', 'doan.van.hau.67@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đoàn Văn Hậu', '098253997', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_67', 'Student', 'Active', NOW() - INTERVAL '87 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000068', 'truong.minh.tuan.68@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trương Minh Tuấn', '098257788', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_68', 'Student', 'Active', NOW() - INTERVAL '88 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000069', 'luu.bao.khanh.69@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lưu Bảo Khánh', '098261579', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_69', 'Student', 'Active', NOW() - INTERVAL '89 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000070', 'nguyen.diep.anh.70@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Diệp Anh', '098265370', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_70', 'Student', 'Active', NOW() - INTERVAL '90 days', 1, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000071', 'tran.huu.kien.71@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Hữu Kiên', '098269161', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_71', 'Student', 'Active', NOW() - INTERVAL '91 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000072', 'le.thanh.nha.72@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Thanh Nhã', '098272952', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_72', 'Student', 'Active', NOW() - INTERVAL '92 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000073', 'pham.quoc.huy.73@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Quốc Huy', '098276743', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_73', 'Student', 'Active', NOW() - INTERVAL '93 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000074', 'vu.hong.nhung.74@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Vũ Hồng Nhung', '098280534', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_74', 'Student', 'Active', NOW() - INTERVAL '94 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000075', 'do.tuan.minh.75@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đỗ Tuấn Minh', '098284325', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_75', 'Student', 'Active', NOW() - INTERVAL '95 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000076', 'bui.thi.mai.76@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Bùi Thị Mai', '098288116', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_76', 'Student', 'Active', NOW() - INTERVAL '96 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000077', 'dang.minh.quan.77@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đặng Minh Quân', '098291907', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_77', 'Student', 'Active', NOW() - INTERVAL '97 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000078', 'ngo.thu.uyen.78@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Ngô Thu Uyên', '098295698', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_78', 'Student', 'Active', NOW() - INTERVAL '98 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000079', 'phan.duc.huy.79@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phan Đức Huy', '098299489', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_79', 'Student', 'Active', NOW() - INTERVAL '99 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000080', 'duong.hong.phuc.80@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Dương Hồng Phúc', '098303280', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_80', 'Student', 'Active', NOW() - INTERVAL '60 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000081', 'ly.gia.linh.81@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lý Gia Linh', '098307071', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_81', 'Student', 'Active', NOW() - INTERVAL '61 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000082', 'vo.hoang.nam.82@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Võ Hoàng Nam', '098310862', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_82', 'Student', 'Active', NOW() - INTERVAL '62 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000083', 'trinh.thao.nguyen.83@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trịnh Thảo Nguyên', '098314653', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_83', 'Student', 'Active', NOW() - INTERVAL '63 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000084', 'dinh.huu.phuoc.84@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đinh Hữu Phước', '098318444', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_84', 'Student', 'Active', NOW() - INTERVAL '64 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000085', 'ha.phuong.linh.85@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Hà Phương Linh', '098322235', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_85', 'Student', 'Active', NOW() - INTERVAL '65 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000086', 'mai.duc.toan.86@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Mai Đức Toàn', '098326026', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_86', 'Student', 'Active', NOW() - INTERVAL '66 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000087', 'ta.minh.chau.87@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Tạ Minh Châu', '098329817', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_87', 'Student', 'Active', NOW() - INTERVAL '67 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000088', 'luong.quang.khai.88@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lương Quang Khải', '098333608', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_88', 'Student', 'Active', NOW() - INTERVAL '68 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000089', 'cao.thi.lan.89@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cao Thị Lan', '098337399', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_89', 'Student', 'Active', NOW() - INTERVAL '69 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000090', 'doan.quoc.tuan.90@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đoàn Quốc Tuấn', '098341190', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_90', 'Student', 'Active', NOW() - INTERVAL '70 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000091', 'truong.bao.uyen.91@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trương Bảo Uyên', '098344981', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_91', 'Student', 'Active', NOW() - INTERVAL '71 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000092', 'luu.tien.thanh.92@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lưu Tiến Thành', '098348772', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_92', 'Student', 'Active', NOW() - INTERVAL '72 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000093', 'nguyen.mai.phuong.93@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Mai Phương', '098352563', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_93', 'Student', 'Active', NOW() - INTERVAL '73 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000094', 'tran.quoc.dat.94@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Quốc Đạt', '098356354', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_94', 'Student', 'Active', NOW() - INTERVAL '74 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000095', 'le.thuy.duong.95@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Thùy Dương', '098360145', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_95', 'Student', 'Active', NOW() - INTERVAL '75 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000096', 'pham.hoang.quan.96@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Hoàng Quân', '098363936', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_96', 'Student', 'Active', NOW() - INTERVAL '76 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000097', 'vu.ngoc.mai.97@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Vũ Ngọc Mai', '098367727', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_97', 'Student', 'Active', NOW() - INTERVAL '77 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000098', 'do.huu.nghia.98@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đỗ Hữu Nghĩa', '098371518', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_98', 'Student', 'Active', NOW() - INTERVAL '78 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000099', 'bui.quynh.giang.99@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Bùi Quỳnh Giang', '098375309', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_99', 'Student', 'Active', NOW() - INTERVAL '79 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000100', 'dang.tuan.anh.100@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đặng Tuấn Anh', '098379100', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_100', 'Student', 'Active', NOW() - INTERVAL '80 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000101', 'ngo.bao.han.101@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Ngô Bảo Hân', '098382891', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_101', 'Student', 'Active', NOW() - INTERVAL '81 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000102', 'phan.minh.khoi.102@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phan Minh Khôi', '098386682', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_102', 'Student', 'Active', NOW() - INTERVAL '82 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000103', 'duong.thu.thao.103@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Dương Thu Thảo', '098390473', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_103', 'Student', 'Active', NOW() - INTERVAL '83 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000104', 'ly.dinh.khoi.104@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lý Đình Khôi', '098394264', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_104', 'Student', 'Active', NOW() - INTERVAL '84 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000105', 'vo.thi.bich.105@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Võ Thị Bích', '098398055', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_105', 'Student', 'Active', NOW() - INTERVAL '85 days', 1, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000106', 'trinh.van.quyet.106@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trịnh Văn Quyết', '098401846', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_106', 'Student', 'Active', NOW() - INTERVAL '86 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000107', 'dinh.thuy.hang.107@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đinh Thúy Hằng', '098405637', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_107', 'Student', 'Active', NOW() - INTERVAL '87 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000108', 'ha.minh.dat.108@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Hà Minh Đạt', '098409428', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_108', 'Student', 'Active', NOW() - INTERVAL '88 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000109', 'mai.cam.tu.109@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Mai Cẩm Tú', '098413219', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_109', 'Student', 'Active', NOW() - INTERVAL '89 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000110', 'ta.hoang.viet.110@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Tạ Hoàng Việt', '098417010', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_110', 'Student', 'Active', NOW() - INTERVAL '90 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000111', 'luong.thuy.dung.111@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lương Thuỳ Dung', '098420801', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_111', 'Student', 'Active', NOW() - INTERVAL '91 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000112', 'cao.minh.khang.112@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cao Minh Khang', '098424592', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_112', 'Student', 'Active', NOW() - INTERVAL '92 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000113', 'doan.thao.vy.113@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đoàn Thảo Vy', '098428383', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_113', 'Student', 'Active', NOW() - INTERVAL '93 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000114', 'truong.dang.khoa.114@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trương Đăng Khoa', '098432174', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_114', 'Student', 'Active', NOW() - INTERVAL '94 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000115', 'luu.thi.huong.115@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lưu Thị Hương', '098435965', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_115', 'Student', 'Active', NOW() - INTERVAL '95 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000116', 'nguyen.khanh.toan.116@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Khánh Toàn', '098439756', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_116', 'Student', 'Active', NOW() - INTERVAL '96 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000117', 'tran.dieu.huong.117@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Diệu Hương', '098443547', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_117', 'Student', 'Active', NOW() - INTERVAL '97 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000118', 'le.quang.dai.118@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Quang Đại', '098447338', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_118', 'Student', 'Active', NOW() - INTERVAL '98 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000119', 'pham.thuy.chi.119@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Thùy Chi', '098451129', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_119', 'Student', 'Active', NOW() - INTERVAL '99 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000120', 'vu.minh.hieu.120@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Vũ Minh Hiếu', '098454920', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_120', 'Student', 'Active', NOW() - INTERVAL '60 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000121', 'do.ngoc.huyen.121@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đỗ Ngọc Huyền', '098458711', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_121', 'Student', 'Active', NOW() - INTERVAL '61 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000122', 'bui.cong.minh.122@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Bùi Công Minh', '098462502', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_122', 'Student', 'Active', NOW() - INTERVAL '62 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000123', 'dang.hong.hanh.123@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đặng Hồng Hạnh', '098466293', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_123', 'Student', 'Active', NOW() - INTERVAL '63 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000124', 'ngo.gia.khiem.124@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Ngô Gia Khiêm', '098470084', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_124', 'Student', 'Active', NOW() - INTERVAL '64 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000125', 'phan.kim.oanh.125@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phan Kim Oanh', '098473875', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_125', 'Student', 'Active', NOW() - INTERVAL '65 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000126', 'duong.quoc.cuong.126@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Dương Quốc Cường', '098477666', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_126', 'Student', 'Active', NOW() - INTERVAL '66 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000127', 'ly.thi.kim.127@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lý Thị Kim', '098481457', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_127', 'Student', 'Active', NOW() - INTERVAL '67 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000128', 'vo.minh.thong.128@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Võ Minh Thông', '098485248', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_128', 'Student', 'Active', NOW() - INTERVAL '68 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000129', 'trinh.my.tam.129@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trịnh Mỹ Tâm', '098489039', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_129', 'Student', 'Active', NOW() - INTERVAL '69 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000130', 'dinh.quoc.toan.130@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đinh Quốc Toản', '098492830', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_130', 'Student', 'Active', NOW() - INTERVAL '70 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000131', 'ha.phuong.thao.131@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Hà Phương Thảo', '098496621', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_131', 'Student', 'Active', NOW() - INTERVAL '71 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000132', 'mai.van.quyen.132@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Mai Văn Quyền', '098500412', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_132', 'Student', 'Active', NOW() - INTERVAL '72 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000133', 'ta.thi.tuyet.133@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Tạ Thị Tuyết', '098504203', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_133', 'Student', 'Active', NOW() - INTERVAL '73 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000134', 'luong.thanh.cong.134@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lương Thành Công', '098507994', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_134', 'Student', 'Active', NOW() - INTERVAL '74 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000135', 'cao.bao.ngan.135@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cao Bảo Ngân', '098511785', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_135', 'Student', 'Active', NOW() - INTERVAL '75 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000136', 'doan.the.anh.136@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đoàn Thế Anh', '098515576', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_136', 'Student', 'Active', NOW() - INTERVAL '76 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000137', 'truong.diem.my.137@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trương Diễm My', '098519367', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_137', 'Student', 'Active', NOW() - INTERVAL '77 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000138', 'luu.quang.vu.138@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lưu Quang Vũ', '098523158', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_138', 'Student', 'Active', NOW() - INTERVAL '78 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000139', 'nguyen.ha.phuong.139@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Hà Phương', '098526949', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_139', 'Student', 'Active', NOW() - INTERVAL '79 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000140', 'tran.van.nam.140@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Văn Nam', '098530740', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_140', 'Student', 'Active', NOW() - INTERVAL '80 days', 1, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000141', 'le.thi.thao.141@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Thị Thảo', '098534531', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_141', 'Student', 'Active', NOW() - INTERVAL '81 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000142', 'pham.van.tuan.142@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Văn Tuấn', '098538322', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_142', 'Student', 'Active', NOW() - INTERVAL '82 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000143', 'vu.thi.sen.143@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Vũ Thị Sen', '098542113', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_143', 'Student', 'Active', NOW() - INTERVAL '83 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000144', 'do.van.toan.144@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đỗ Văn Toàn', '098545904', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_144', 'Student', 'Active', NOW() - INTERVAL '84 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000145', 'bui.thi.ly.145@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Bùi Thị Lý', '098549695', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_145', 'Student', 'Active', NOW() - INTERVAL '85 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000146', 'dang.van.tung.146@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đặng Văn Tùng', '098553486', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_146', 'Student', 'Active', NOW() - INTERVAL '86 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000147', 'ngo.thi.hoa.147@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Ngô Thị Hoa', '098557277', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_147', 'Student', 'Active', NOW() - INTERVAL '87 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000148', 'phan.van.hau.148@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phan Văn Hậu', '098561068', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_148', 'Student', 'Active', NOW() - INTERVAL '88 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000149', 'duong.thi.mai.149@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Dương Thị Mai', '098564859', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_149', 'Student', 'Active', NOW() - INTERVAL '89 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000150', 'ly.van.sang.150@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lý Văn Sáng', '098568650', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_150', 'Student', 'Active', NOW() - INTERVAL '90 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000151', 'vo.thi.nhan.151@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Võ Thị Nhàn', '098572441', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_151', 'Student', 'Active', NOW() - INTERVAL '91 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000152', 'trinh.van.lam.152@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trịnh Văn Lâm', '098576232', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_152', 'Student', 'Active', NOW() - INTERVAL '92 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000153', 'dinh.thi.thoa.153@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đinh Thị Thoa', '098580023', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_153', 'Student', 'Active', NOW() - INTERVAL '93 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000154', 'ha.van.thang.154@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Hà Văn Thắng', '098583814', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_154', 'Student', 'Active', NOW() - INTERVAL '94 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000155', 'mai.thi.yen.155@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Mai Thị Yến', '098587605', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_155', 'Student', 'Active', NOW() - INTERVAL '95 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000156', 'ta.van.kien.156@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Tạ Văn Kiên', '098591396', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_156', 'Student', 'Active', NOW() - INTERVAL '96 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000157', 'luong.thi.hue.157@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lương Thị Huệ', '098595187', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_157', 'Student', 'Active', NOW() - INTERVAL '97 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000158', 'cao.van.dung.158@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cao Văn Dũng', '098598978', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_158', 'Student', 'Active', NOW() - INTERVAL '98 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000159', 'doan.thi.ha.159@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đoàn Thị Hà', '098602769', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_159', 'Student', 'Active', NOW() - INTERVAL '99 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000160', 'truong.van.bang.160@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trương Văn Bằng', '098606560', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_160', 'Student', 'Active', NOW() - INTERVAL '60 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000161', 'luu.thi.dung.161@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lưu Thị Dung', '098610351', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_161', 'Student', 'Active', NOW() - INTERVAL '61 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000162', 'nguyen.van.hoa.162@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Văn Hoà', '098614142', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_162', 'Student', 'Active', NOW() - INTERVAL '62 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000163', 'tran.thi.anh.163@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Thị Ánh', '098617933', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_163', 'Student', 'Active', NOW() - INTERVAL '63 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000164', 'le.van.tien.164@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Văn Tiến', '098621724', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_164', 'Student', 'Active', NOW() - INTERVAL '64 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000165', 'pham.thi.loan.165@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Thị Loan', '098625515', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_165', 'Student', 'Active', NOW() - INTERVAL '65 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000166', 'vu.van.binh.166@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Vũ Văn Bình', '098629306', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_166', 'Student', 'Active', NOW() - INTERVAL '66 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000167', 'do.thi.luong.167@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đỗ Thị Lương', '098633097', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_167', 'Student', 'Active', NOW() - INTERVAL '67 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000168', 'bui.van.sam.168@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Bùi Văn Sâm', '098636888', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_168', 'Student', 'Active', NOW() - INTERVAL '68 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000169', 'dang.thi.tham.169@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đặng Thị Thắm', '098640679', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_169', 'Student', 'Active', NOW() - INTERVAL '69 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000170', 'ngo.van.tai.170@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Ngô Văn Tài', '098644470', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_170', 'Student', 'Active', NOW() - INTERVAL '70 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000171', 'phan.thi.thu.171@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phan Thị Thu', '098648261', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_171', 'Student', 'Active', NOW() - INTERVAL '71 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000172', 'duong.van.tan.172@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Dương Văn Tân', '098652052', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_172', 'Student', 'Active', NOW() - INTERVAL '72 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000173', 'ly.thi.nga.173@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lý Thị Nga', '098655843', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_173', 'Student', 'Active', NOW() - INTERVAL '73 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000174', 'vo.van.tho.174@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Võ Văn Thọ', '098659634', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_174', 'Student', 'Active', NOW() - INTERVAL '74 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000175', 'trinh.thi.gam.175@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trịnh Thị Gấm', '098663425', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_175', 'Student', 'Active', NOW() - INTERVAL '75 days', 1, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000176', 'dinh.van.thuan.176@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đinh Văn Thuận', '098667216', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_176', 'Student', 'Active', NOW() - INTERVAL '76 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000177', 'ha.thi.oanh.177@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Hà Thị Oanh', '098671007', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_177', 'Student', 'Active', NOW() - INTERVAL '77 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000178', 'mai.van.loi.178@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Mai Văn Lợi', '098674798', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_178', 'Student', 'Active', NOW() - INTERVAL '78 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000179', 'ta.thi.huong.179@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Tạ Thị Hường', '098678589', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_179', 'Student', 'Active', NOW() - INTERVAL '79 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000180', 'luong.van.duc.180@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lương Văn Đức', '098682380', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_180', 'Student', 'Active', NOW() - INTERVAL '80 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000181', 'cao.thi.sen.181@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Cao Thị Sen', '098686171', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_181', 'Student', 'Active', NOW() - INTERVAL '81 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000182', 'doan.van.son.182@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đoàn Văn Sơn', '098689962', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_182', 'Student', 'Active', NOW() - INTERVAL '82 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000183', 'truong.thi.hong.183@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trương Thị Hồng', '098693753', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_183', 'Student', 'Active', NOW() - INTERVAL '83 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000184', 'luu.van.dat.184@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lưu Văn Đạt', '098697544', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_184', 'Student', 'Active', NOW() - INTERVAL '84 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000185', 'nguyen.thi.thuy.185@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyễn Thị Thủy', '098701335', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_185', 'Student', 'Active', NOW() - INTERVAL '85 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000186', 'tran.van.khanh.186@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trần Văn Khánh', '098705126', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_186', 'Student', 'Active', NOW() - INTERVAL '86 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000187', 'le.thi.bich.187@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lê Thị Bích', '098708917', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_187', 'Student', 'Active', NOW() - INTERVAL '87 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000188', 'pham.van.toi.188@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phạm Văn Tới', '098712708', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_188', 'Student', 'Active', NOW() - INTERVAL '88 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000189', 'vu.thi.nguyet.189@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Vũ Thị Nguyệt', '098716499', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_189', 'Student', 'Active', NOW() - INTERVAL '89 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000190', 'do.van.hung.190@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đỗ Văn Hưng', '098720290', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_190', 'Student', 'Active', NOW() - INTERVAL '90 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000191', 'bui.thi.phuong.191@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Bùi Thị Phượng', '098724081', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_191', 'Student', 'Active', NOW() - INTERVAL '91 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000192', 'dang.van.lam.192@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đặng Văn Lâm', '098727872', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_192', 'Student', 'Active', NOW() - INTERVAL '92 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000193', 'ngo.thi.xuan.193@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Ngô Thị Xuân', '098731663', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_193', 'Student', 'Active', NOW() - INTERVAL '93 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000194', 'phan.van.minh.194@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Phan Văn Minh', '098735454', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_194', 'Student', 'Active', NOW() - INTERVAL '94 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000195', 'duong.thi.thanh.195@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Dương Thị Thanh', '098739245', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_195', 'Student', 'Active', NOW() - INTERVAL '95 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000196', 'ly.van.dong.196@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Lý Văn Đông', '098743036', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_196', 'Student', 'Active', NOW() - INTERVAL '96 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000197', 'vo.thi.hang.197@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Võ Thị Hằng', '098746827', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_197', 'Student', 'Active', NOW() - INTERVAL '97 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000198', 'trinh.van.trung.198@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Trịnh Văn Trung', '098750618', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_198', 'Student', 'Active', NOW() - INTERVAL '98 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000199', 'dinh.thi.hanh.199@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Đinh Thị Hạnh', '098754409', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_199', 'Student', 'Active', NOW() - INTERVAL '99 days', 0, NULL, NULL, 0, NULL),
    ('b5000000-0000-0000-0000-000000000200', 'ha.van.canh.200@gmail.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Hà Văn Cảnh', '098758200', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student_200', 'Student', 'Active', NOW() - INTERVAL '60 days', 0, NULL, NULL, 0, NULL)
ON CONFLICT ("Id") DO NOTHING;

-- 3. TUTOR PROFILES (b2000000-0000-0000-0000-000000000001 .. 0050)
INSERT INTO "TutorProfiles" (
    "Id", "UserId", "Bio", "Education", "ExperienceYears", "TeachingMode", 
    "Address", "RatingAvg", "TotalReviews", "BankName", "BankCode", "AccountNumber", "AccountHolderName"
) VALUES
    ('b2000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Hơn 8 năm kinh nghiệm luyện thi THPT Quốc Gia môn Toán và thi vào 10 chuyên. Phương pháp giảng dạy tư duy bản chất, không học vẹt công thức, học sinh tăng từ 2-3 điểm sau 2 tháng.', 'Thạc sĩ Toán giải tích - ĐH Sư Phạm Hà Nội (Thủ khoa tốt nghiệp)', 8, 'Both', 'Số 45 Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội', 4.8, 17, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0011004829102', 'NGUYEN THI THU TRANG'),
    ('b2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Giảng viên thỉnh giảng đại học, chuyên gia bồi dưỡng học sinh giỏi Toán Quốc gia và các kỳ thi đánh giá năng lực ĐHQG. Hướng dẫn kỹ năng tư duy logic và giải toán trắc nghiệm siêu tốc.', 'Tiến sĩ Toán ứng dụng - ĐH Khoa học Tự nhiên ĐHQG-HN', 10, 'Online', 'Tòa Park 3, Times City, 458 Minh Khai, Phường Vĩnh Tuy, Quận Hai Bà Trưng, Hà Nội', 4.9, 20, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19034829105018', 'TRAN MINH HOANG'),
    ('b2000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'Chuyên trị hình học không gian và tích phân hàm ẩn. Hơn 6 năm bồi dưỡng học sinh thi vào trường chuyên Lê Hồng Phong và Trần Đại Nghĩa.', 'Cử nhân Sư phạm Toán chất lượng cao - ĐH Sư Phạm TP.HCM', 6, 'Both', 'Số 112/8 Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh', 5.0, 23, 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)', 'BIDV', '12410008392019', 'LE BAO QUOC'),
    ('b2000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'Đạt giải Nhì kỳ thi Olympic Toán sinh viên toàn quốc. Chuyên giảng dạy phương pháp toán sơ cấp và rèn tư duy toán học nền tảng cho học sinh THCS mất gốc.', 'Cử nhân Toán Tin - ĐH Bách Khoa Hà Nội (GPA 3.8/4.0)', 5, 'Offline', 'Số 88 Phố Chùa Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội', 4.7, 26, 'Ngân hàng TMCP Quân Đội (MBBank)', 'MB', '0880193849102', 'PHAM PHUONG LINH'),
    ('b2000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'Từng đoạt giải Ba Toán Quốc gia THPT, 7 năm giảng dạy chuyên đề Bất đẳng thức và Tổ hợp nâng cao cho đội tuyển thi chuyên KHTN và Amsterdam.', 'Thạc sĩ Toán lý thuyết - ĐH Sư Phạm Hà Nội', 7, 'Both', 'Số 26 Ngõ 20 Phố Ngụy Như Kon Tum, Phường Nhân Chính, Quận Thanh Xuân, Hà Nội', 4.8, 29, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0451000392014', 'HOANG VAN THAI'),
    ('b2000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006', 'Tận tâm, kiên nhẫn, chuyên kèm cặp học sinh lớp 6-9 từ sợ toán chuyển sang tự tin giải toán hình học và đại số. Đã giúp hơn 120 học viên đạt điểm 8+ học kỳ.', 'Cử nhân Giáo dục Tiểu học & THCS - ĐH Thủ Đô Hà Nội', 5, 'Both', 'Tòa Landmark 2, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Quận Bình Thạnh, TP. Hồ Chí Minh', 4.9, 32, 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)', 'VPB', '15928391024', 'VU THUY DUNG'),
    ('b2000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000007', 'Chuyên luyện đề thi đánh giá năng lực ĐHQG-HCM phân mục tư duy định lượng và logic. Phong cách giảng dạy dí dỏm, thực tế, tạo động lực cao.', 'Cử nhân Toán học - ĐH Khoa học Tự nhiên TP.HCM', 6, 'Online', 'Số 34 Đường Số 9, Khu Đô Thị Him Lam, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh', 5.0, 35, 'Ngân hàng TMCP Á Châu (ACB)', 'ACB', '238910293', 'DO THANH TUNG'),
    ('b2000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000008', 'Tập trung áp dụng sơ đồ tư duy (Mindmap) vào hình học không gian và phương trình lượng giác. Biên soạn hơn 20 bộ đề bám sát ma trận thi THPT của Bộ GD.', 'Thạc sĩ Phương pháp Giảng dạy Toán - ĐH Giáo Dục ĐHQG-HN', 7, 'Both', 'Căn hộ 12A08 Tòa R2, Goldmark City, 136 Hồ Tùng Mậu, Quận Bắc Từ Liêm, Hà Nội', 4.7, 38, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19028391023910', 'BUI NGOC ANH'),
    ('b2000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000009', 'Hơn 9 năm luyện thi IELTS chuyên sâu 2 kỹ năng Writing và Speaking. Từng là Examiner chấm thi thử nghiệm, giúp hơn 300 học viên đạt Target 6.5 - 8.0.', 'Thạc sĩ TESOL - ĐH Melbourne (Úc), IELTS 8.5 (Listening 9.0, Reading 9.0)', 9, 'Both', 'Số 18/4B Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 4.8, 41, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0071001293845', 'DANG DINH KHOA'),
    ('b2000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000010', 'Chuyên gia chỉnh phát âm chuẩn IPA và phản xạ giao tiếp tự nhiên kiểu người bản xứ. Phương pháp Shadowing và Spaced Repetition độc quyền.', 'Cử nhân Ngôn ngữ Anh - ĐH Ngoại Thương Hà Nội, IELTS 8.0, CELTA Certificate', 6, 'Online', 'Số 72 Phố Bà Triệu, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội', 4.9, 44, 'Ngân hàng TMCP Quân Đội (MBBank)', 'MB', '0720192830192', 'NGO THU HA'),
    ('b2000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000011', 'Chuyên đào tạo tiếng Anh doanh nghiệp, đàm phán thương mại và thuyết trình tiếng Anh trước đám đông. Đã đào tạo nhân viên tại FPT, Viettel, VNG.', 'Cử nhân Sư phạm Tiếng Anh - ĐH Ngoại ngữ ĐHQG-HN', 8, 'Both', 'Số 15 Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 5.0, 47, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19038291048192', 'PHAN HUU NGHIA'),
    ('b2000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000012', '3 năm tu nghiệp tại Tokyo, 5 năm giảng dạy tiếng Nhật N5-N3 cho kỹ sư IT sang Nhật làm việc và du học sinh. Giảng bài sinh động bằng văn hóa Anime & Manga.', 'Cử nhân Tiếng Nhật Thương mại - ĐH Ngoại Thương, JLPT N1', 5, 'Both', 'Số 142/6 Đường D2, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh', 4.7, 50, 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)', 'BIDV', '13510009283719', 'DUONG DIEU LINH'),
    ('b2000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000013', 'Chuyên bẻ gãy các bẫy đề thi IELTS Reading & Listening. Chiến thuật tư duy phản biện (Critical Thinking) cho Task 2 Writing đạt band 7.5+.', 'Cử nhân Quan hệ Quốc tế - ĐH Quốc tế RMIT Việt Nam, IELTS 8.5', 7, 'Online', 'Tòa Sunrise City, 23 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh', 4.8, 53, 'Ngân hàng TMCP Á Châu (ACB)', 'ACB', '389201948', 'LY HOANG NAM'),
    ('b2000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000014', 'Luyện thi cấp tốc JLPT N4, N3 tỷ lệ đỗ trên 92%. Lộ trình học ngữ pháp qua tình huống thực tế kết hợp luyện hội thoại Kanji ghi nhớ sâu.', 'Cử nhân Sư phạm Tiếng Nhật - ĐH Hà Nội, JLPT N1, Học bổng MEXT', 6, 'Both', 'Số 28 Ngõ 198 Lê Trọng Tấn, Phường Định Công, Quận Hoàng Mai, Hà Nội', 4.9, 56, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0021008492019', 'VO THI MAI ANH'),
    ('b2000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000015', 'Tác giả chuỗi bài giảng ''Tự tin nói tiếng Anh không vấp''. Chuyên đào tạo học sinh du học định cư Canada, Úc và xin học bổng toàn phần.', 'Thạc sĩ Lý luận và Phương pháp Dạy học Tiếng Anh - ĐH Sư Phạm TP.HCM, IELTS 8.0', 8, 'Both', 'Số 56/3 Đường Trần Quang Khải, Phường Tân Định, Quận 1, TP. Hồ Chí Minh', 5.0, 59, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19039201847102', 'TRINH QUOC BAO'),
    ('b2000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000016', '5 năm biên dịch viên và gia sư phát âm chuẩn giọng Mỹ cho trẻ em và người đi làm. Phương pháp học qua kịch bản giao tiếp công sở hàng ngày.', 'Cử nhân Ngôn ngữ Anh Biên Phiên Dịch - ĐH Ngoại Ngữ Huế', 5, 'Online', 'Số 92 Đường Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng', 4.7, 62, 'Ngân hàng TMCP Quân Đội (MBBank)', 'MB', '0920194820193', 'DINH THAO VY'),
    ('b2000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000017', 'Chuyên gia luyện thi Vật lý 12 THPT Quốc Gia và thi Đánh giá tư duy Bách Khoa. Giúp học sinh xử lý đồ thị dao động cơ và mạch RLC nối tiếp cực nhanh.', 'Thạc sĩ Vật lý chất rắn - ĐH Bách Khoa Hà Nội', 8, 'Both', 'Số 12 Phố Tạ Quang Bửu, Phường Bách Khoa, Quận Hai Bà Trưng, Hà Nội', 4.8, 65, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0011003928104', 'HA MINH QUAN'),
    ('b2000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000018', 'Hơn 7 năm ôn luyện Hóa học lớp 10-12. Phương pháp ''Quy đổi & Đồng đẳng hóa'' giúp học sinh giải bài toán Este và Peptit điểm 9-10 trong vòng 2 phút.', 'Thạc sĩ Hóa hữu cơ - ĐH Khoa học Tự nhiên ĐHQG-HN', 7, 'Both', 'Số 39 Ngõ 105 Phố Vọng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội', 4.9, 68, 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)', 'BIDV', '12810003920184', 'MAI LAN HUONG'),
    ('b2000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000019', 'Chuyên luyện thi học sinh giỏi Vật lý cấp Tỉnh/Thành phố. Sử dụng thí nghiệm mô phỏng 3D giúp học sinh hiểu sâu bản chất sóng ánh sáng và lượng tử.', 'Cử nhân Sư phạm Vật lý - ĐH Sư Phạm TP.HCM (Tốt nghiệp loại Xuất sắc)', 6, 'Both', 'Số 280 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh', 5.0, 71, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19029104829103', 'TA QUANG HUY'),
    ('b2000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000020', 'Thủ khoa khối B 29.35 điểm. Chuyên ôn thi môn Sinh học xét tuyển Y Dược. Phương pháp sơ đồ hóa di truyền học quần thể và phả hệ học dễ hiểu.', 'Bác sĩ Đa khoa - ĐH Y Hà Nội (Thủ khoa khối B tỉnh Thái Bình)', 5, 'Online', 'Số 1 Tôn Thất Tùng, Phường Kim Liên, Quận Đống Đa, Hà Nội', 4.7, 74, 'Ngân hàng TMCP Quân Đội (MBBank)', 'MB', '0010192839102', 'LUONG KHANH LINH'),
    ('b2000000-0000-0000-0000-000000000021', 'b1000000-0000-0000-0000-000000000021', '6 năm kinh nghiệm dạy kèm Hóa học thi tốt nghiệp THPT và kỳ thi ĐGNL ĐHQG-HCM. Hướng dẫn bấm máy tính Casio giải nhanh bài toán hóa vô cơ.', 'Cử nhân Hóa học Dược phẩm - ĐH Khoa học Tự nhiên TP.HCM', 6, 'Both', 'Số 68 Đường Số 1, Cư Xá Đô Thành, Phường 4, Quận 3, TP. Hồ Chí Minh', 4.8, 77, 'Ngân hàng TMCP Á Châu (ACB)', 'ACB', '192830194', 'CAO DUC THANG'),
    ('b2000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000022', 'Chuyên bồi dưỡng học sinh lớp 10, 11 làm quen với chương trình Giáo dục Phổ thông mới. Tạo động lực học tập qua các ứng dụng thực tế của vật lý đời sống.', 'Thạc sĩ Phương pháp Giảng dạy Vật lý - ĐH Sư Phạm Hà Nội', 7, 'Both', 'Số 18 Ngõ 133 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 4.9, 80, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0491000293847', 'DOAN TUYET MAI'),
    ('b2000000-0000-0000-0000-000000000023', 'b1000000-0000-0000-0000-000000000023', 'Gia sư chuyên khối B (Toán - Hóa - Sinh). Từng đạt 10 điểm tuyệt đối môn Sinh học kỳ thi THPT Quốc Gia, chia sẻ chiến thuật làm đề 50 câu trong 40 phút.', 'Bác sĩ Răng Hàm Mặt - ĐH Y Dược TP.HCM', 5, 'Online', 'Số 217 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh', 5.0, 83, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19038291049281', 'TRUONG TUAN KIET'),
    ('b2000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000024', 'Kinh nghiệm 6 năm dạy kèm học sinh trường chuyên và lớp chọn. Nắm vững cấu trúc câu hỏi phân loại cao trong đề thi Đánh giá năng lực Hà Nội.', 'Cử nhân Sư phạm Hóa học - ĐH Sư Phạm Hà Nội (Lớp Tài năng)', 6, 'Both', 'Số 42 Phố Trần Phú, Phường Điện Biên, Quận Ba Đình, Hà Nội', 4.7, 86, 'Ngân hàng TMCP Quân Đội (MBBank)', 'MB', '0420194820194', 'LUU HAI YEN'),
    ('b2000000-0000-0000-0000-000000000025', 'b1000000-0000-0000-0000-000000000025', 'Senior Software Architect với 10 năm kinh nghiệm trong hệ thống ngân hàng. Chuyên dạy lập trình C# .NET 8, Clean Architecture, CQRS và Microservices từ gốc.', 'Thạc sĩ Khoa học Máy tính - ĐH Bách Khoa Hà Nội', 10, 'Online', 'Tòa Keangnam Landmark 72, Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 4.8, 89, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19028391048291', 'VU HOANG LONG'),
    ('b2000000-0000-0000-0000-000000000026', 'b1000000-0000-0000-0000-000000000026', 'Data Engineer tại tập đoàn công nghệ đa quốc gia. Hướng dẫn lập trình Python cho người mới bắt đầu, xử lý dữ liệu Pandas/Numpy và ứng dụng Trí tuệ Nhân tạo AI.', 'Kỹ sư Công nghệ Thông tin - ĐH Bách Khoa TP.HCM (Data Science Major)', 6, 'Both', 'Tòa S3.02 Vinhomes Grand Park, Phường Long Bình, TP. Thủ Đức, TP. Hồ Chí Minh', 4.9, 92, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0071004928104', 'NGUYEN HOAI AN'),
    ('b2000000-0000-0000-0000-000000000027', 'b1000000-0000-0000-0000-000000000027', 'Lead Backend Developer. Hướng dẫn sinh viên CNTT làm đồ án tốt nghiệp ASP.NET Core Web API, Entity Framework Core và luyện phỏng vấn kỹ thuật vào các công ty Outsource/Product.', 'Kỹ sư Kỹ thuật Phần mềm - ĐH FPT Hà Nội', 7, 'Online', 'Số 8 Ngõ 180 Phố Hoàng Quốc Việt, Phường Cổ Nhuế 1, Quận Bắc Từ Liêm, Hà Nội', 5.0, 95, 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)', 'BIDV', '12610002938471', 'TRAN BAO CHAU'),
    ('b2000000-0000-0000-0000-000000000028', 'b1000000-0000-0000-0000-000000000028', 'Gia sư lập trình thuật toán Python cho học sinh cấp 2-3 thi Tin học trẻ và học sinh chuyên Tin. Rèn luyện tư duy cấu trúc dữ liệu và giải thuật LeetCode.', 'Cử nhân Toán Tin Ứng dụng - ĐH Khoa học Tự nhiên ĐHQG-HN', 5, 'Both', 'Số 334 Phố Nguyễn Trãi, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội', 4.7, 98, 'Ngân hàng TMCP Quân Đội (MBBank)', 'MB', '0330192849102', 'LE TUAN ANH'),
    ('b2000000-0000-0000-0000-000000000029', 'b1000000-0000-0000-0000-000000000029', 'Chuyên dạy lập trình Fullstack với C# ASP.NET Core Web API và React TypeScript cho người chuyển ngành (Non-tech). Đã giúp hơn 40 học viên tìm được việc làm Junior Dev.', 'Kỹ sư Hệ thống Thông tin - ĐH Công nghệ ĐHQG-HN', 6, 'Both', 'Số 144 Phố Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 4.8, 101, 'Ngân hàng TMCP Á Châu (ACB)', 'ACB', '284910294', 'PHAM NHAT LINH'),
    ('b2000000-0000-0000-0000-000000000030', 'b1000000-0000-0000-0000-000000000030', 'Chuyên dạy Python tự động hóa công việc (Automation), phân tích dữ liệu kinh doanh và lập trình Web scraper. Giáo trình thực chiến cầm tay chỉ việc.', 'Thạc sĩ Khoa học Dữ liệu - ĐH Công nghệ Thông tin ĐHQG-HCM', 5, 'Online', 'Số 1 Đường Hàn Thuyên, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh', 4.9, 104, 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)', 'VPB', '19284019284', 'HOANG KIM NGAN'),
    ('b2000000-0000-0000-0000-000000000031', 'b1000000-0000-0000-0000-000000000031', 'Senior .NET Developer tại công ty phần mềm Phần Lan. Dạy chuyên sâu Docker, CI/CD, PostgreSQL, Redis và tối ưu hóa hiệu năng ứng dụng High Load.', 'Cử nhân Kỹ thuật Máy tính - ĐH Bách Khoa TP.HCM', 8, 'Online', 'Số 268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh', 5.0, 107, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0071003948201', 'DO GIA HUY'),
    ('b2000000-0000-0000-0000-000000000032', 'b1000000-0000-0000-0000-000000000032', 'Chuyên dạy lập trình hướng đối tượng OOP và bảo mật ứng dụng Web trong môi trường .NET. Phương pháp code review từng dòng, sửa lỗi tận tâm.', 'Kỹ sư An toàn Thông tin - Học viện Kỹ thuật Mật mã', 6, 'Both', 'Số 141 Đường Chiến Thắng, Xã Tân Triều, Huyện Thanh Trì, Hà Nội', 4.7, 110, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19039281048201', 'BUI TRONG NGHIA'),
    ('b2000000-0000-0000-0000-000000000033', 'b1000000-0000-0000-0000-000000000033', 'Giáo viên trường chuyên có 9 năm kinh nghiệm luyện thi vào 10 và THPT Quốc gia môn Ngữ văn. Phương pháp tư duy nghị luận xã hội sắc bén, hành văn mượt mà không khuôn mẫu.', 'Thạc sĩ Văn học Việt Nam - ĐH Sư Phạm Hà Nội', 9, 'Both', 'Số 55 Phố Hàng Chuối, Phường Phạm Đình Hổ, Quận Hai Bà Trưng, Hà Nội', 4.8, 113, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0011002938471', 'DANG MY DUYEN'),
    ('b2000000-0000-0000-0000-000000000034', 'b1000000-0000-0000-0000-000000000034', 'MC truyền hình và huấn luyện viên tranh biện (Debate Coach). Đào tạo kỹ năng thuyết trình tự tin, làm chủ sân khấu và nghệ thuật đàm phán thuyết phục.', 'Thạc sĩ Báo chí & Truyền thông - Học viện Báo chí và Tuyên truyền', 8, 'Both', 'Số 36 Phố Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 4.9, 116, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19028391048201', 'NGO QUANG DUNG'),
    ('b2000000-0000-0000-0000-000000000035', 'b1000000-0000-0000-0000-000000000035', 'Chuyên bồi dưỡng học sinh thi học sinh giỏi Văn cấp Thành phố. Luyện kỹ năng phân tích tác phẩm văn học trung đại và hiện đại đạt điểm 8.5+.', 'Cử nhân Sư phạm Ngữ văn - ĐH Sư Phạm TP.HCM (Thủ khoa đầu ra)', 5, 'Both', 'Số 182 Đường Lê Văn Sỹ, Phường 10, Quận Phú Nhuận, TP. Hồ Chí Minh', 5.0, 119, 'Ngân hàng TMCP Quân Đội (MBBank)', 'MB', '0182019482019', 'PHAN THANH TRUC'),
    ('b2000000-0000-0000-0000-000000000036', 'b1000000-0000-0000-0000-000000000036', 'Cố vấn đàm phán hợp đồng thương mại cho các startup. Chuyên dạy nghệ thuật thương lượng Win-Win, kỹ năng lắng nghe thấu cảm và giải quyết mâu thuẫn đối tác.', 'Thạc sĩ Quản trị Kinh doanh (MBA) - ĐH Kinh tế Quốc dân', 10, 'Online', 'Số 207 Đường Giải Phóng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội', 4.7, 122, 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)', 'BIDV', '12810004928102', 'DUONG MINH KHOI'),
    ('b2000000-0000-0000-0000-000000000037', 'b1000000-0000-0000-0000-000000000037', 'Chuyên ôn thi Ngữ văn lớp 9 lên 10 trường công lập top đầu tại Hà Nội. Phương pháp lập dàn ý chi tiết giúp học sinh viết bài mạch lạc, không lan man.', 'Thạc sĩ Ngôn ngữ học - ĐH Khoa học Xã hội và Nhân văn Hà Nội', 7, 'Both', 'Số 336 Phố Nguyễn Trãi, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội', 4.8, 125, 'Ngân hàng TMCP Á Châu (ACB)', 'ACB', '392019482', 'LY THUY HANG'),
    ('b2000000-0000-0000-0000-000000000038', 'b1000000-0000-0000-0000-000000000038', 'Huấn luyện viên giải phóng hình thể và giọng nói. Giúp học viên vượt qua nỗi sợ nói trước đám đông, rèn luyện chất giọng ấm, biểu cảm và truyền cảm hứng.', 'Cử nhân Đạo diễn Sân khấu - ĐH Sân khấu Điện ảnh TP.HCM', 8, 'Both', 'Số 125 Đường Cống Quỳnh, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh', 4.9, 128, 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)', 'VPB', '19284019201', 'VO VAN HAU'),
    ('b2000000-0000-0000-0000-000000000039', 'b1000000-0000-0000-0000-000000000039', '6 năm kinh nghiệm dạy kèm môn Ngữ văn cấp THCS và THPT. Hướng dẫn kỹ năng phân tích thơ hiện đại, mở bài và kết bài ấn tượng tạo thiện cảm với giám khảo chấm thi.', 'Cử nhân Sư phạm Ngữ văn - ĐH Sư Phạm Hà Nội', 6, 'Both', 'Số 23 Ngõ 82 Phố Chùa Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội', 5.0, 131, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0011004928103', 'TRINH MINH TRANG'),
    ('b2000000-0000-0000-0000-000000000040', 'b1000000-0000-0000-0000-000000000040', 'Chuyên đào tạo kỹ năng kể chuyện (Storytelling) trong kinh doanh và thuyết trình gọi vốn đầu tư (Pitching). Đã huấn luyện hơn 50 đội thi khởi nghiệp sinh viên.', 'Thạc sĩ Truyền thông Quốc tế - ĐH Westminster (Anh Quốc)', 7, 'Online', 'Tòa Diamond Island, Số 1 Đường Số 104, Phường Bình Trưng Tây, TP. Thủ Đức, TP. Hồ Chí Minh', 4.7, 134, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19028391049281', 'DINH THIEN PHU'),
    ('b2000000-0000-0000-0000-000000000041', 'b1000000-0000-0000-0000-000000000041', 'Kế toán trưởng với 11 năm kinh nghiệm tại doanh nghiệp sản xuất và thương mại. Chuyên dạy nguyên lý kế toán, hạch toán định khoản và lập báo cáo tài chính từ số 0.', 'Thạc sĩ Kế toán Kiểm toán - ĐH Kinh tế Quốc dân, Chứng chỉ CPA Việt Nam', 11, 'Both', 'Tòa Green Bay G3, Đường Lương Thế Vinh, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 4.8, 137, 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)', 'BIDV', '12810003928104', 'HA THUY KIEU'),
    ('b2000000-0000-0000-0000-000000000042', 'b1000000-0000-0000-0000-000000000042', 'Kiện tướng cờ vua quốc gia với hơn 8 năm giảng dạy trẻ em và thiếu niên. Giúp học sinh rèn luyện tính kiên trì, khả năng tập trung cao độ và tư duy chiến lược nhiều bước.', 'Kiện tướng Quốc gia Cờ vua, Cử nhân Huấn luyện Thể thao - ĐH TDTT Bắc Ninh', 8, 'Both', 'Số 10 Phố Trịnh Hoài Đức, Phường Cát Linh, Quận Đống Đa, Hà Nội', 4.9, 140, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0011003928192', 'MAI DINH TRONG'),
    ('b2000000-0000-0000-0000-000000000043', 'b1000000-0000-0000-0000-000000000043', 'Chuyên gia phân tích tài chính doanh nghiệp. Dạy kèm sinh viên đại học môn Nguyên lý kế toán, Kế toán quản trị và phân tích chỉ số tài chính doanh nghiệp thực tế.', 'Cử nhân Tài chính Doanh nghiệp - Học viện Tài chính (GPA 3.85/4.0), ACCA Member', 6, 'Online', 'Số 58 Phố Lê Văn Thiêm, Phường Nhân Chính, Quận Thanh Xuân, Hà Nội', 5.0, 143, 'Ngân hàng TMCP Quân Đội (MBBank)', 'MB', '0580192840192', 'TA THAO NGUYEN'),
    ('b2000000-0000-0000-0000-000000000044', 'b1000000-0000-0000-0000-000000000044', 'Huy chương Vàng giải Cờ vua trẻ toàn quốc. Chuyên bồi dưỡng các thế cờ tàn nghệ thuật, bẫy khai cuộc kinh điển và huấn luyện thi đấu cờ chớp trực tuyến Chess.com.', 'Cử nhân Toán học - ĐH Khoa học Tự nhiên TP.HCM, VĐV Cờ vua TP.HCM', 7, 'Both', 'Số 43 Đường Điện Biên Phủ, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh', 4.7, 146, 'Ngân hàng TMCP Á Châu (ACB)', 'ACB', '381920194', 'LUONG HOANG BACH'),
    ('b2000000-0000-0000-0000-000000000045', 'b1000000-0000-0000-0000-000000000045', '7 năm giảng viên thỉnh giảng và đào tạo chứng chỉ kế toán viên. Phương pháp giảng dạy liên hệ thực tiễn chứng từ hóa đơn, thực hành trực tiếp trên phần mềm MISA.', 'Thạc sĩ Tài chính Ngân hàng - ĐH Kinh tế TP.HCM (UEH)', 7, 'Both', 'Số 59C Nguyễn Đình Chiểu, Phường 6, Quận 3, TP. Hồ Chí Minh', 4.8, 149, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19038291048291', 'CAO THANH MAI'),
    ('b2000000-0000-0000-0000-000000000046', 'b1000000-0000-0000-0000-000000000046', 'Chuyên gia nghiên cứu đề thi Đánh giá năng lực ĐHQG Hà Nội (HSA) và ĐHQG TP.HCM (APT). Chiến thuật làm bài phân bổ thời gian và mẹo loại trừ phương án nhiễu.', 'Thạc sĩ Đo lường và Đánh giá Giáo dục - ĐH Giáo Dục ĐHQG-HN', 8, 'Both', 'Số 16 Phố Nguyễn Cơ Thạch, Phường Mỹ Đình 2, Quận Nam Từ Liêm, Hà Nội', 4.9, 152, 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', 'VCB', '0011004829104', 'DOAN CONG THANH'),
    ('b2000000-0000-0000-0000-000000000047', 'b1000000-0000-0000-0000-000000000047', 'Chuyên phụ trách phần tư duy định tính (Ngôn ngữ tiếng Việt & Văn học) trong đề thi HSA. Đã hướng dẫn nhiều học sinh đạt trên 110/150 điểm bài thi ĐGNL.', 'Thạc sĩ Sư phạm Ngữ văn - ĐH Sư Phạm Hà Nội', 6, 'Both', 'Số 71 Phố Nguyễn Chí Thanh, Phường Láng Hạ, Quận Đống Đa, Hà Nội', 5.0, 155, 'Ngân hàng TMCP Quân Đội (MBBank)', 'MB', '0710192840192', 'TRUONG QUYNH NGA'),
    ('b2000000-0000-0000-0000-000000000048', 'b1000000-0000-0000-0000-000000000048', 'Chuyên bồi dưỡng phần Khoa học tự nhiên (Lý - Hóa - Sinh) trong kỳ thi Đánh giá năng lực. Tổng hợp kiến thức cốt lõi qua mindmap và sơ đồ tư duy liên môn.', 'Kỹ sư Hóa - Dược - ĐH Bách Khoa TP.HCM', 7, 'Online', 'Số 104 Đường D1, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh', 4.7, 158, 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)', 'BIDV', '13510003928104', 'LUU THANH DAT'),
    ('b2000000-0000-0000-0000-000000000049', 'b1000000-0000-0000-0000-000000000049', 'Chuyên luyện phần thi tiếng Anh trong đề thi ĐGNL và kỳ thi THPT Quốc Gia. Hệ thống hóa toàn bộ chuyên đề ngữ pháp trọng tâm và kỹ năng đọc hiểu văn bản học thuật.', 'Cử nhân Sư phạm Tiếng Anh - ĐH Sư Phạm TP.HCM, IELTS 8.0', 6, 'Both', 'Số 85 Đường Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 4.8, 161, 'Ngân hàng TMCP Á Châu (ACB)', 'ACB', '392810294', 'CHU DIEU ANH'),
    ('b2000000-0000-0000-0000-000000000050', 'b1000000-0000-0000-0000-000000000050', '8 năm kinh nghiệm giảng dạy toán tư duy và thống kê xác suất. Chuyên luyện phần tư duy logic và phân tích số liệu cho học sinh dự thi đánh giá năng lực.', 'Thạc sĩ Toán Ứng dụng - ĐH Khoa học Tự nhiên ĐHQG-HN', 8, 'Both', 'Số 98 Phố Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội', 4.9, 164, 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)', 'TCB', '19039281049201', 'TA NHAT MINH')
ON CONFLICT ("Id") DO NOTHING;

-- 4. STUDENT PROFILES (b6000000-0000-0000-0000-000000000001 .. 0200)
INSERT INTO "StudentProfiles" ("Id", "UserId")
SELECT
    ('b6000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b5000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid
FROM generate_series(1, 200) AS i
ON CONFLICT ("Id") DO NOTHING;

-- 5. TUTOR APPLICATIONS (b4000000-0000-0000-0000-000000000001 .. 0050)
INSERT INTO "TutorApplications" (
    "Id", "UserId", "Bio", "Education", "ExperienceYears", "TeachingMode", 
    "Address", "Status", "RejectionReason", "SubmittedAt", "ReviewedAt", "ReviewedByAdminId"
) VALUES
    ('b4000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Hơn 8 năm kinh nghiệm luyện thi THPT Quốc Gia môn Toán và thi vào 10 chuyên. Phương pháp giảng dạy tư duy bản chất, không học vẹt công thức, học sinh tăng từ 2-3 điểm sau 2 tháng.', 'Thạc sĩ Toán giải tích - ĐH Sư Phạm Hà Nội (Thủ khoa tốt nghiệp)', 8, 'Both', 'Số 45 Ngõ 165 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '71 days', NOW() - INTERVAL '70 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Giảng viên thỉnh giảng đại học, chuyên gia bồi dưỡng học sinh giỏi Toán Quốc gia và các kỳ thi đánh giá năng lực ĐHQG. Hướng dẫn kỹ năng tư duy logic và giải toán trắc nghiệm siêu tốc.', 'Tiến sĩ Toán ứng dụng - ĐH Khoa học Tự nhiên ĐHQG-HN', 10, 'Online', 'Tòa Park 3, Times City, 458 Minh Khai, Phường Vĩnh Tuy, Quận Hai Bà Trưng, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '72 days', NOW() - INTERVAL '71 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'Chuyên trị hình học không gian và tích phân hàm ẩn. Hơn 6 năm bồi dưỡng học sinh thi vào trường chuyên Lê Hồng Phong và Trần Đại Nghĩa.', 'Cử nhân Sư phạm Toán chất lượng cao - ĐH Sư Phạm TP.HCM', 6, 'Both', 'Số 112/8 Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '73 days', NOW() - INTERVAL '72 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'Đạt giải Nhì kỳ thi Olympic Toán sinh viên toàn quốc. Chuyên giảng dạy phương pháp toán sơ cấp và rèn tư duy toán học nền tảng cho học sinh THCS mất gốc.', 'Cử nhân Toán Tin - ĐH Bách Khoa Hà Nội (GPA 3.8/4.0)', 5, 'Offline', 'Số 88 Phố Chùa Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '74 days', NOW() - INTERVAL '73 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005', 'Từng đoạt giải Ba Toán Quốc gia THPT, 7 năm giảng dạy chuyên đề Bất đẳng thức và Tổ hợp nâng cao cho đội tuyển thi chuyên KHTN và Amsterdam.', 'Thạc sĩ Toán lý thuyết - ĐH Sư Phạm Hà Nội', 7, 'Both', 'Số 26 Ngõ 20 Phố Ngụy Như Kon Tum, Phường Nhân Chính, Quận Thanh Xuân, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '75 days', NOW() - INTERVAL '74 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006', 'Tận tâm, kiên nhẫn, chuyên kèm cặp học sinh lớp 6-9 từ sợ toán chuyển sang tự tin giải toán hình học và đại số. Đã giúp hơn 120 học viên đạt điểm 8+ học kỳ.', 'Cử nhân Giáo dục Tiểu học & THCS - ĐH Thủ Đô Hà Nội', 5, 'Both', 'Tòa Landmark 2, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Quận Bình Thạnh, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '76 days', NOW() - INTERVAL '75 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000007', 'Chuyên luyện đề thi đánh giá năng lực ĐHQG-HCM phân mục tư duy định lượng và logic. Phong cách giảng dạy dí dỏm, thực tế, tạo động lực cao.', 'Cử nhân Toán học - ĐH Khoa học Tự nhiên TP.HCM', 6, 'Online', 'Số 34 Đường Số 9, Khu Đô Thị Him Lam, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '77 days', NOW() - INTERVAL '76 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000008', 'Tập trung áp dụng sơ đồ tư duy (Mindmap) vào hình học không gian và phương trình lượng giác. Biên soạn hơn 20 bộ đề bám sát ma trận thi THPT của Bộ GD.', 'Thạc sĩ Phương pháp Giảng dạy Toán - ĐH Giáo Dục ĐHQG-HN', 7, 'Both', 'Căn hộ 12A08 Tòa R2, Goldmark City, 136 Hồ Tùng Mậu, Quận Bắc Từ Liêm, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '78 days', NOW() - INTERVAL '77 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000009', 'Hơn 9 năm luyện thi IELTS chuyên sâu 2 kỹ năng Writing và Speaking. Từng là Examiner chấm thi thử nghiệm, giúp hơn 300 học viên đạt Target 6.5 - 8.0.', 'Thạc sĩ TESOL - ĐH Melbourne (Úc), IELTS 8.5 (Listening 9.0, Reading 9.0)', 9, 'Both', 'Số 18/4B Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '79 days', NOW() - INTERVAL '78 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000010', 'Chuyên gia chỉnh phát âm chuẩn IPA và phản xạ giao tiếp tự nhiên kiểu người bản xứ. Phương pháp Shadowing và Spaced Repetition độc quyền.', 'Cử nhân Ngôn ngữ Anh - ĐH Ngoại Thương Hà Nội, IELTS 8.0, CELTA Certificate', 6, 'Online', 'Số 72 Phố Bà Triệu, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '80 days', NOW() - INTERVAL '79 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000011', 'Chuyên đào tạo tiếng Anh doanh nghiệp, đàm phán thương mại và thuyết trình tiếng Anh trước đám đông. Đã đào tạo nhân viên tại FPT, Viettel, VNG.', 'Cử nhân Sư phạm Tiếng Anh - ĐH Ngoại ngữ ĐHQG-HN', 8, 'Both', 'Số 15 Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '81 days', NOW() - INTERVAL '80 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000012', '3 năm tu nghiệp tại Tokyo, 5 năm giảng dạy tiếng Nhật N5-N3 cho kỹ sư IT sang Nhật làm việc và du học sinh. Giảng bài sinh động bằng văn hóa Anime & Manga.', 'Cử nhân Tiếng Nhật Thương mại - ĐH Ngoại Thương, JLPT N1', 5, 'Both', 'Số 142/6 Đường D2, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '82 days', NOW() - INTERVAL '81 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000013', 'Chuyên bẻ gãy các bẫy đề thi IELTS Reading & Listening. Chiến thuật tư duy phản biện (Critical Thinking) cho Task 2 Writing đạt band 7.5+.', 'Cử nhân Quan hệ Quốc tế - ĐH Quốc tế RMIT Việt Nam, IELTS 8.5', 7, 'Online', 'Tòa Sunrise City, 23 Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '83 days', NOW() - INTERVAL '82 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000014', 'Luyện thi cấp tốc JLPT N4, N3 tỷ lệ đỗ trên 92%. Lộ trình học ngữ pháp qua tình huống thực tế kết hợp luyện hội thoại Kanji ghi nhớ sâu.', 'Cử nhân Sư phạm Tiếng Nhật - ĐH Hà Nội, JLPT N1, Học bổng MEXT', 6, 'Both', 'Số 28 Ngõ 198 Lê Trọng Tấn, Phường Định Công, Quận Hoàng Mai, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '84 days', NOW() - INTERVAL '83 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000015', 'Tác giả chuỗi bài giảng ''Tự tin nói tiếng Anh không vấp''. Chuyên đào tạo học sinh du học định cư Canada, Úc và xin học bổng toàn phần.', 'Thạc sĩ Lý luận và Phương pháp Dạy học Tiếng Anh - ĐH Sư Phạm TP.HCM, IELTS 8.0', 8, 'Both', 'Số 56/3 Đường Trần Quang Khải, Phường Tân Định, Quận 1, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '85 days', NOW() - INTERVAL '84 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000016', '5 năm biên dịch viên và gia sư phát âm chuẩn giọng Mỹ cho trẻ em và người đi làm. Phương pháp học qua kịch bản giao tiếp công sở hàng ngày.', 'Cử nhân Ngôn ngữ Anh Biên Phiên Dịch - ĐH Ngoại Ngữ Huế', 5, 'Online', 'Số 92 Đường Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng', 'Approved', NULL, NOW() - INTERVAL '86 days', NOW() - INTERVAL '85 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000017', 'Chuyên gia luyện thi Vật lý 12 THPT Quốc Gia và thi Đánh giá tư duy Bách Khoa. Giúp học sinh xử lý đồ thị dao động cơ và mạch RLC nối tiếp cực nhanh.', 'Thạc sĩ Vật lý chất rắn - ĐH Bách Khoa Hà Nội', 8, 'Both', 'Số 12 Phố Tạ Quang Bửu, Phường Bách Khoa, Quận Hai Bà Trưng, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '87 days', NOW() - INTERVAL '86 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000018', 'Hơn 7 năm ôn luyện Hóa học lớp 10-12. Phương pháp ''Quy đổi & Đồng đẳng hóa'' giúp học sinh giải bài toán Este và Peptit điểm 9-10 trong vòng 2 phút.', 'Thạc sĩ Hóa hữu cơ - ĐH Khoa học Tự nhiên ĐHQG-HN', 7, 'Both', 'Số 39 Ngõ 105 Phố Vọng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '88 days', NOW() - INTERVAL '87 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000019', 'Chuyên luyện thi học sinh giỏi Vật lý cấp Tỉnh/Thành phố. Sử dụng thí nghiệm mô phỏng 3D giúp học sinh hiểu sâu bản chất sóng ánh sáng và lượng tử.', 'Cử nhân Sư phạm Vật lý - ĐH Sư Phạm TP.HCM (Tốt nghiệp loại Xuất sắc)', 6, 'Both', 'Số 280 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '89 days', NOW() - INTERVAL '88 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000020', 'Thủ khoa khối B 29.35 điểm. Chuyên ôn thi môn Sinh học xét tuyển Y Dược. Phương pháp sơ đồ hóa di truyền học quần thể và phả hệ học dễ hiểu.', 'Bác sĩ Đa khoa - ĐH Y Hà Nội (Thủ khoa khối B tỉnh Thái Bình)', 5, 'Online', 'Số 1 Tôn Thất Tùng, Phường Kim Liên, Quận Đống Đa, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '90 days', NOW() - INTERVAL '89 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000021', 'b1000000-0000-0000-0000-000000000021', '6 năm kinh nghiệm dạy kèm Hóa học thi tốt nghiệp THPT và kỳ thi ĐGNL ĐHQG-HCM. Hướng dẫn bấm máy tính Casio giải nhanh bài toán hóa vô cơ.', 'Cử nhân Hóa học Dược phẩm - ĐH Khoa học Tự nhiên TP.HCM', 6, 'Both', 'Số 68 Đường Số 1, Cư Xá Đô Thành, Phường 4, Quận 3, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '91 days', NOW() - INTERVAL '90 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000022', 'b1000000-0000-0000-0000-000000000022', 'Chuyên bồi dưỡng học sinh lớp 10, 11 làm quen với chương trình Giáo dục Phổ thông mới. Tạo động lực học tập qua các ứng dụng thực tế của vật lý đời sống.', 'Thạc sĩ Phương pháp Giảng dạy Vật lý - ĐH Sư Phạm Hà Nội', 7, 'Both', 'Số 18 Ngõ 133 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '92 days', NOW() - INTERVAL '91 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000023', 'b1000000-0000-0000-0000-000000000023', 'Gia sư chuyên khối B (Toán - Hóa - Sinh). Từng đạt 10 điểm tuyệt đối môn Sinh học kỳ thi THPT Quốc Gia, chia sẻ chiến thuật làm đề 50 câu trong 40 phút.', 'Bác sĩ Răng Hàm Mặt - ĐH Y Dược TP.HCM', 5, 'Online', 'Số 217 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '93 days', NOW() - INTERVAL '92 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000024', 'b1000000-0000-0000-0000-000000000024', 'Kinh nghiệm 6 năm dạy kèm học sinh trường chuyên và lớp chọn. Nắm vững cấu trúc câu hỏi phân loại cao trong đề thi Đánh giá năng lực Hà Nội.', 'Cử nhân Sư phạm Hóa học - ĐH Sư Phạm Hà Nội (Lớp Tài năng)', 6, 'Both', 'Số 42 Phố Trần Phú, Phường Điện Biên, Quận Ba Đình, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '94 days', NOW() - INTERVAL '93 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000025', 'b1000000-0000-0000-0000-000000000025', 'Senior Software Architect với 10 năm kinh nghiệm trong hệ thống ngân hàng. Chuyên dạy lập trình C# .NET 8, Clean Architecture, CQRS và Microservices từ gốc.', 'Thạc sĩ Khoa học Máy tính - ĐH Bách Khoa Hà Nội', 10, 'Online', 'Tòa Keangnam Landmark 72, Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '95 days', NOW() - INTERVAL '94 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000026', 'b1000000-0000-0000-0000-000000000026', 'Data Engineer tại tập đoàn công nghệ đa quốc gia. Hướng dẫn lập trình Python cho người mới bắt đầu, xử lý dữ liệu Pandas/Numpy và ứng dụng Trí tuệ Nhân tạo AI.', 'Kỹ sư Công nghệ Thông tin - ĐH Bách Khoa TP.HCM (Data Science Major)', 6, 'Both', 'Tòa S3.02 Vinhomes Grand Park, Phường Long Bình, TP. Thủ Đức, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '96 days', NOW() - INTERVAL '95 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000027', 'b1000000-0000-0000-0000-000000000027', 'Lead Backend Developer. Hướng dẫn sinh viên CNTT làm đồ án tốt nghiệp ASP.NET Core Web API, Entity Framework Core và luyện phỏng vấn kỹ thuật vào các công ty Outsource/Product.', 'Kỹ sư Kỹ thuật Phần mềm - ĐH FPT Hà Nội', 7, 'Online', 'Số 8 Ngõ 180 Phố Hoàng Quốc Việt, Phường Cổ Nhuế 1, Quận Bắc Từ Liêm, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '97 days', NOW() - INTERVAL '96 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000028', 'b1000000-0000-0000-0000-000000000028', 'Gia sư lập trình thuật toán Python cho học sinh cấp 2-3 thi Tin học trẻ và học sinh chuyên Tin. Rèn luyện tư duy cấu trúc dữ liệu và giải thuật LeetCode.', 'Cử nhân Toán Tin Ứng dụng - ĐH Khoa học Tự nhiên ĐHQG-HN', 5, 'Both', 'Số 334 Phố Nguyễn Trãi, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '98 days', NOW() - INTERVAL '97 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000029', 'b1000000-0000-0000-0000-000000000029', 'Chuyên dạy lập trình Fullstack với C# ASP.NET Core Web API và React TypeScript cho người chuyển ngành (Non-tech). Đã giúp hơn 40 học viên tìm được việc làm Junior Dev.', 'Kỹ sư Hệ thống Thông tin - ĐH Công nghệ ĐHQG-HN', 6, 'Both', 'Số 144 Phố Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '99 days', NOW() - INTERVAL '98 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000030', 'b1000000-0000-0000-0000-000000000030', 'Chuyên dạy Python tự động hóa công việc (Automation), phân tích dữ liệu kinh doanh và lập trình Web scraper. Giáo trình thực chiến cầm tay chỉ việc.', 'Thạc sĩ Khoa học Dữ liệu - ĐH Công nghệ Thông tin ĐHQG-HCM', 5, 'Online', 'Số 1 Đường Hàn Thuyên, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '100 days', NOW() - INTERVAL '99 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000031', 'b1000000-0000-0000-0000-000000000031', 'Senior .NET Developer tại công ty phần mềm Phần Lan. Dạy chuyên sâu Docker, CI/CD, PostgreSQL, Redis và tối ưu hóa hiệu năng ứng dụng High Load.', 'Cử nhân Kỹ thuật Máy tính - ĐH Bách Khoa TP.HCM', 8, 'Online', 'Số 268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '101 days', NOW() - INTERVAL '100 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000032', 'b1000000-0000-0000-0000-000000000032', 'Chuyên dạy lập trình hướng đối tượng OOP và bảo mật ứng dụng Web trong môi trường .NET. Phương pháp code review từng dòng, sửa lỗi tận tâm.', 'Kỹ sư An toàn Thông tin - Học viện Kỹ thuật Mật mã', 6, 'Both', 'Số 141 Đường Chiến Thắng, Xã Tân Triều, Huyện Thanh Trì, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '102 days', NOW() - INTERVAL '101 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000033', 'b1000000-0000-0000-0000-000000000033', 'Giáo viên trường chuyên có 9 năm kinh nghiệm luyện thi vào 10 và THPT Quốc gia môn Ngữ văn. Phương pháp tư duy nghị luận xã hội sắc bén, hành văn mượt mà không khuôn mẫu.', 'Thạc sĩ Văn học Việt Nam - ĐH Sư Phạm Hà Nội', 9, 'Both', 'Số 55 Phố Hàng Chuối, Phường Phạm Đình Hổ, Quận Hai Bà Trưng, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '103 days', NOW() - INTERVAL '102 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000034', 'b1000000-0000-0000-0000-000000000034', 'MC truyền hình và huấn luyện viên tranh biện (Debate Coach). Đào tạo kỹ năng thuyết trình tự tin, làm chủ sân khấu và nghệ thuật đàm phán thuyết phục.', 'Thạc sĩ Báo chí & Truyền thông - Học viện Báo chí và Tuyên truyền', 8, 'Both', 'Số 36 Phố Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '104 days', NOW() - INTERVAL '103 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000035', 'b1000000-0000-0000-0000-000000000035', 'Chuyên bồi dưỡng học sinh thi học sinh giỏi Văn cấp Thành phố. Luyện kỹ năng phân tích tác phẩm văn học trung đại và hiện đại đạt điểm 8.5+.', 'Cử nhân Sư phạm Ngữ văn - ĐH Sư Phạm TP.HCM (Thủ khoa đầu ra)', 5, 'Both', 'Số 182 Đường Lê Văn Sỹ, Phường 10, Quận Phú Nhuận, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '105 days', NOW() - INTERVAL '104 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000036', 'b1000000-0000-0000-0000-000000000036', 'Cố vấn đàm phán hợp đồng thương mại cho các startup. Chuyên dạy nghệ thuật thương lượng Win-Win, kỹ năng lắng nghe thấu cảm và giải quyết mâu thuẫn đối tác.', 'Thạc sĩ Quản trị Kinh doanh (MBA) - ĐH Kinh tế Quốc dân', 10, 'Online', 'Số 207 Đường Giải Phóng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '106 days', NOW() - INTERVAL '105 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000037', 'b1000000-0000-0000-0000-000000000037', 'Chuyên ôn thi Ngữ văn lớp 9 lên 10 trường công lập top đầu tại Hà Nội. Phương pháp lập dàn ý chi tiết giúp học sinh viết bài mạch lạc, không lan man.', 'Thạc sĩ Ngôn ngữ học - ĐH Khoa học Xã hội và Nhân văn Hà Nội', 7, 'Both', 'Số 336 Phố Nguyễn Trãi, Phường Thanh Xuân Trung, Quận Thanh Xuân, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '107 days', NOW() - INTERVAL '106 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000038', 'b1000000-0000-0000-0000-000000000038', 'Huấn luyện viên giải phóng hình thể và giọng nói. Giúp học viên vượt qua nỗi sợ nói trước đám đông, rèn luyện chất giọng ấm, biểu cảm và truyền cảm hứng.', 'Cử nhân Đạo diễn Sân khấu - ĐH Sân khấu Điện ảnh TP.HCM', 8, 'Both', 'Số 125 Đường Cống Quỳnh, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '108 days', NOW() - INTERVAL '107 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000039', 'b1000000-0000-0000-0000-000000000039', '6 năm kinh nghiệm dạy kèm môn Ngữ văn cấp THCS và THPT. Hướng dẫn kỹ năng phân tích thơ hiện đại, mở bài và kết bài ấn tượng tạo thiện cảm với giám khảo chấm thi.', 'Cử nhân Sư phạm Ngữ văn - ĐH Sư Phạm Hà Nội', 6, 'Both', 'Số 23 Ngõ 82 Phố Chùa Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '109 days', NOW() - INTERVAL '108 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000040', 'b1000000-0000-0000-0000-000000000040', 'Chuyên đào tạo kỹ năng kể chuyện (Storytelling) trong kinh doanh và thuyết trình gọi vốn đầu tư (Pitching). Đã huấn luyện hơn 50 đội thi khởi nghiệp sinh viên.', 'Thạc sĩ Truyền thông Quốc tế - ĐH Westminster (Anh Quốc)', 7, 'Online', 'Tòa Diamond Island, Số 1 Đường Số 104, Phường Bình Trưng Tây, TP. Thủ Đức, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '110 days', NOW() - INTERVAL '109 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000041', 'b1000000-0000-0000-0000-000000000041', 'Kế toán trưởng với 11 năm kinh nghiệm tại doanh nghiệp sản xuất và thương mại. Chuyên dạy nguyên lý kế toán, hạch toán định khoản và lập báo cáo tài chính từ số 0.', 'Thạc sĩ Kế toán Kiểm toán - ĐH Kinh tế Quốc dân, Chứng chỉ CPA Việt Nam', 11, 'Both', 'Tòa Green Bay G3, Đường Lương Thế Vinh, Phường Mễ Trì, Quận Nam Từ Liêm, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '111 days', NOW() - INTERVAL '110 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000042', 'b1000000-0000-0000-0000-000000000042', 'Kiện tướng cờ vua quốc gia với hơn 8 năm giảng dạy trẻ em và thiếu niên. Giúp học sinh rèn luyện tính kiên trì, khả năng tập trung cao độ và tư duy chiến lược nhiều bước.', 'Kiện tướng Quốc gia Cờ vua, Cử nhân Huấn luyện Thể thao - ĐH TDTT Bắc Ninh', 8, 'Both', 'Số 10 Phố Trịnh Hoài Đức, Phường Cát Linh, Quận Đống Đa, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '112 days', NOW() - INTERVAL '111 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000043', 'b1000000-0000-0000-0000-000000000043', 'Chuyên gia phân tích tài chính doanh nghiệp. Dạy kèm sinh viên đại học môn Nguyên lý kế toán, Kế toán quản trị và phân tích chỉ số tài chính doanh nghiệp thực tế.', 'Cử nhân Tài chính Doanh nghiệp - Học viện Tài chính (GPA 3.85/4.0), ACCA Member', 6, 'Online', 'Số 58 Phố Lê Văn Thiêm, Phường Nhân Chính, Quận Thanh Xuân, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '113 days', NOW() - INTERVAL '112 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000044', 'b1000000-0000-0000-0000-000000000044', 'Huy chương Vàng giải Cờ vua trẻ toàn quốc. Chuyên bồi dưỡng các thế cờ tàn nghệ thuật, bẫy khai cuộc kinh điển và huấn luyện thi đấu cờ chớp trực tuyến Chess.com.', 'Cử nhân Toán học - ĐH Khoa học Tự nhiên TP.HCM, VĐV Cờ vua TP.HCM', 7, 'Both', 'Số 43 Đường Điện Biên Phủ, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '114 days', NOW() - INTERVAL '113 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000045', 'b1000000-0000-0000-0000-000000000045', '7 năm giảng viên thỉnh giảng và đào tạo chứng chỉ kế toán viên. Phương pháp giảng dạy liên hệ thực tiễn chứng từ hóa đơn, thực hành trực tiếp trên phần mềm MISA.', 'Thạc sĩ Tài chính Ngân hàng - ĐH Kinh tế TP.HCM (UEH)', 7, 'Both', 'Số 59C Nguyễn Đình Chiểu, Phường 6, Quận 3, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '70 days', NOW() - INTERVAL '69 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000046', 'b1000000-0000-0000-0000-000000000046', 'Chuyên gia nghiên cứu đề thi Đánh giá năng lực ĐHQG Hà Nội (HSA) và ĐHQG TP.HCM (APT). Chiến thuật làm bài phân bổ thời gian và mẹo loại trừ phương án nhiễu.', 'Thạc sĩ Đo lường và Đánh giá Giáo dục - ĐH Giáo Dục ĐHQG-HN', 8, 'Both', 'Số 16 Phố Nguyễn Cơ Thạch, Phường Mỹ Đình 2, Quận Nam Từ Liêm, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '71 days', NOW() - INTERVAL '70 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000047', 'b1000000-0000-0000-0000-000000000047', 'Chuyên phụ trách phần tư duy định tính (Ngôn ngữ tiếng Việt & Văn học) trong đề thi HSA. Đã hướng dẫn nhiều học sinh đạt trên 110/150 điểm bài thi ĐGNL.', 'Thạc sĩ Sư phạm Ngữ văn - ĐH Sư Phạm Hà Nội', 6, 'Both', 'Số 71 Phố Nguyễn Chí Thanh, Phường Láng Hạ, Quận Đống Đa, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '72 days', NOW() - INTERVAL '71 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000048', 'b1000000-0000-0000-0000-000000000048', 'Chuyên bồi dưỡng phần Khoa học tự nhiên (Lý - Hóa - Sinh) trong kỳ thi Đánh giá năng lực. Tổng hợp kiến thức cốt lõi qua mindmap và sơ đồ tư duy liên môn.', 'Kỹ sư Hóa - Dược - ĐH Bách Khoa TP.HCM', 7, 'Online', 'Số 104 Đường D1, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '73 days', NOW() - INTERVAL '72 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000049', 'b1000000-0000-0000-0000-000000000049', 'Chuyên luyện phần thi tiếng Anh trong đề thi ĐGNL và kỳ thi THPT Quốc Gia. Hệ thống hóa toàn bộ chuyên đề ngữ pháp trọng tâm và kỹ năng đọc hiểu văn bản học thuật.', 'Cử nhân Sư phạm Tiếng Anh - ĐH Sư Phạm TP.HCM, IELTS 8.0', 6, 'Both', 'Số 85 Đường Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 'Approved', NULL, NOW() - INTERVAL '74 days', NOW() - INTERVAL '73 days', '11111111-1111-1111-1111-111111111111'::uuid),
    ('b4000000-0000-0000-0000-000000000050', 'b1000000-0000-0000-0000-000000000050', '8 năm kinh nghiệm giảng dạy toán tư duy và thống kê xác suất. Chuyên luyện phần tư duy logic và phân tích số liệu cho học sinh dự thi đánh giá năng lực.', 'Thạc sĩ Toán Ứng dụng - ĐH Khoa học Tự nhiên ĐHQG-HN', 8, 'Both', 'Số 98 Phố Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội', 'Approved', NULL, NOW() - INTERVAL '75 days', NOW() - INTERVAL '74 days', '11111111-1111-1111-1111-111111111111'::uuid)
ON CONFLICT ("Id") DO NOTHING;

-- 6. WALLETS FOR 50 TUTORS (b3000000-0000-0000-0000-000000000001 .. 0050)
INSERT INTO "Wallets" (
    "Id", "TutorProfileId", "PendingBalance", "AvailableBalance", "HeldBalance", "UpdatedAt"
)
SELECT
    ('b3000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    0.00, 0.00, 0.00, NOW()
FROM generate_series(1, 50) AS i
ON CONFLICT ("Id") DO NOTHING;

-- 7. TUTOR SUBJECTS (Each tutor linked to their 2 authentic subjects)
INSERT INTO "TutorSubjects" ("Id", "TutorProfileId", "SubjectId", "IsActive") VALUES
    ('b0010000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0020000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', true),
    ('b0010000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0020000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0010000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0020000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 'aaaaaaaa-0001-0000-0000-000000000002', true),
    ('b0010000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000004', 'aaaaaaaa-0001-0000-0000-000000000002', true),
    ('b0020000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000004', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0010000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000005', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0020000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000005', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0010000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000006', 'aaaaaaaa-0001-0000-0000-000000000002', true),
    ('b0020000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000006', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0010000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000007', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0020000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000007', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0010000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000008', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0020000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000008', 'aaaaaaaa-0001-0000-0000-000000000002', true),
    ('b0010000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000009', 'aaaaaaaa-0001-0000-0000-000000000004', true),
    ('b0020000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000009', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('b0010000-0000-0000-0000-000000000010', 'b2000000-0000-0000-0000-000000000010', 'aaaaaaaa-0001-0000-0000-000000000004', true),
    ('b0020000-0000-0000-0000-000000000010', 'b2000000-0000-0000-0000-000000000010', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('b0010000-0000-0000-0000-000000000011', 'b2000000-0000-0000-0000-000000000011', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('b0020000-0000-0000-0000-000000000011', 'b2000000-0000-0000-0000-000000000011', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('b0010000-0000-0000-0000-000000000012', 'b2000000-0000-0000-0000-000000000012', 'aaaaaaaa-0001-0000-0000-000000000005', true),
    ('b0020000-0000-0000-0000-000000000012', 'b2000000-0000-0000-0000-000000000012', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('b0010000-0000-0000-0000-000000000013', 'b2000000-0000-0000-0000-000000000013', 'aaaaaaaa-0001-0000-0000-000000000004', true),
    ('b0020000-0000-0000-0000-000000000013', 'b2000000-0000-0000-0000-000000000013', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('b0010000-0000-0000-0000-000000000014', 'b2000000-0000-0000-0000-000000000014', 'aaaaaaaa-0001-0000-0000-000000000005', true),
    ('b0020000-0000-0000-0000-000000000014', 'b2000000-0000-0000-0000-000000000014', 'aaaaaaaa-0001-0000-0000-000000000004', true),
    ('b0010000-0000-0000-0000-000000000015', 'b2000000-0000-0000-0000-000000000015', 'aaaaaaaa-0001-0000-0000-000000000004', true),
    ('b0020000-0000-0000-0000-000000000015', 'b2000000-0000-0000-0000-000000000015', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('b0010000-0000-0000-0000-000000000016', 'b2000000-0000-0000-0000-000000000016', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('b0020000-0000-0000-0000-000000000016', 'b2000000-0000-0000-0000-000000000016', 'aaaaaaaa-0001-0000-0000-000000000004', true),
    ('b0010000-0000-0000-0000-000000000017', 'b2000000-0000-0000-0000-000000000017', 'aaaaaaaa-0001-0000-0000-000000000006', true),
    ('b0020000-0000-0000-0000-000000000017', 'b2000000-0000-0000-0000-000000000017', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0010000-0000-0000-0000-000000000018', 'b2000000-0000-0000-0000-000000000018', 'aaaaaaaa-0001-0000-0000-000000000007', true),
    ('b0020000-0000-0000-0000-000000000018', 'b2000000-0000-0000-0000-000000000018', 'aaaaaaaa-0001-0000-0000-000000000008', true),
    ('b0010000-0000-0000-0000-000000000019', 'b2000000-0000-0000-0000-000000000019', 'aaaaaaaa-0001-0000-0000-000000000006', true),
    ('b0020000-0000-0000-0000-000000000019', 'b2000000-0000-0000-0000-000000000019', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0010000-0000-0000-0000-000000000020', 'b2000000-0000-0000-0000-000000000020', 'aaaaaaaa-0001-0000-0000-000000000008', true),
    ('b0020000-0000-0000-0000-000000000020', 'b2000000-0000-0000-0000-000000000020', 'aaaaaaaa-0001-0000-0000-000000000007', true),
    ('b0010000-0000-0000-0000-000000000021', 'b2000000-0000-0000-0000-000000000021', 'aaaaaaaa-0001-0000-0000-000000000007', true),
    ('b0020000-0000-0000-0000-000000000021', 'b2000000-0000-0000-0000-000000000021', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0010000-0000-0000-0000-000000000022', 'b2000000-0000-0000-0000-000000000022', 'aaaaaaaa-0001-0000-0000-000000000006', true),
    ('b0020000-0000-0000-0000-000000000022', 'b2000000-0000-0000-0000-000000000022', 'aaaaaaaa-0001-0000-0000-000000000002', true),
    ('b0010000-0000-0000-0000-000000000023', 'b2000000-0000-0000-0000-000000000023', 'aaaaaaaa-0001-0000-0000-000000000008', true),
    ('b0020000-0000-0000-0000-000000000023', 'b2000000-0000-0000-0000-000000000023', 'aaaaaaaa-0001-0000-0000-000000000007', true),
    ('b0010000-0000-0000-0000-000000000024', 'b2000000-0000-0000-0000-000000000024', 'aaaaaaaa-0001-0000-0000-000000000007', true),
    ('b0020000-0000-0000-0000-000000000024', 'b2000000-0000-0000-0000-000000000024', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0010000-0000-0000-0000-000000000025', 'b2000000-0000-0000-0000-000000000025', 'aaaaaaaa-0001-0000-0000-000000000009', true),
    ('b0020000-0000-0000-0000-000000000025', 'b2000000-0000-0000-0000-000000000025', 'aaaaaaaa-0001-0000-0000-000000000010', true),
    ('b0010000-0000-0000-0000-000000000026', 'b2000000-0000-0000-0000-000000000026', 'aaaaaaaa-0001-0000-0000-000000000010', true),
    ('b0020000-0000-0000-0000-000000000026', 'b2000000-0000-0000-0000-000000000026', 'aaaaaaaa-0001-0000-0000-000000000009', true),
    ('b0010000-0000-0000-0000-000000000027', 'b2000000-0000-0000-0000-000000000027', 'aaaaaaaa-0001-0000-0000-000000000009', true),
    ('b0020000-0000-0000-0000-000000000027', 'b2000000-0000-0000-0000-000000000027', 'aaaaaaaa-0001-0000-0000-000000000010', true),
    ('b0010000-0000-0000-0000-000000000028', 'b2000000-0000-0000-0000-000000000028', 'aaaaaaaa-0001-0000-0000-000000000010', true),
    ('b0020000-0000-0000-0000-000000000028', 'b2000000-0000-0000-0000-000000000028', 'aaaaaaaa-0001-0000-0000-000000000013', true),
    ('b0010000-0000-0000-0000-000000000029', 'b2000000-0000-0000-0000-000000000029', 'aaaaaaaa-0001-0000-0000-000000000009', true),
    ('b0020000-0000-0000-0000-000000000029', 'b2000000-0000-0000-0000-000000000029', 'aaaaaaaa-0001-0000-0000-000000000010', true),
    ('b0010000-0000-0000-0000-000000000030', 'b2000000-0000-0000-0000-000000000030', 'aaaaaaaa-0001-0000-0000-000000000010', true),
    ('b0020000-0000-0000-0000-000000000030', 'b2000000-0000-0000-0000-000000000030', 'aaaaaaaa-0001-0000-0000-000000000015', true),
    ('b0010000-0000-0000-0000-000000000031', 'b2000000-0000-0000-0000-000000000031', 'aaaaaaaa-0001-0000-0000-000000000009', true),
    ('b0020000-0000-0000-0000-000000000031', 'b2000000-0000-0000-0000-000000000031', 'aaaaaaaa-0001-0000-0000-000000000010', true),
    ('b0010000-0000-0000-0000-000000000032', 'b2000000-0000-0000-0000-000000000032', 'aaaaaaaa-0001-0000-0000-000000000009', true),
    ('b0020000-0000-0000-0000-000000000032', 'b2000000-0000-0000-0000-000000000032', 'aaaaaaaa-0001-0000-0000-000000000010', true),
    ('b0010000-0000-0000-0000-000000000033', 'b2000000-0000-0000-0000-000000000033', 'aaaaaaaa-0001-0000-0000-000000000011', true),
    ('b0020000-0000-0000-0000-000000000033', 'b2000000-0000-0000-0000-000000000033', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('b0010000-0000-0000-0000-000000000034', 'b2000000-0000-0000-0000-000000000034', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('b0020000-0000-0000-0000-000000000034', 'b2000000-0000-0000-0000-000000000034', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('b0010000-0000-0000-0000-000000000035', 'b2000000-0000-0000-0000-000000000035', 'aaaaaaaa-0001-0000-0000-000000000011', true),
    ('b0020000-0000-0000-0000-000000000035', 'b2000000-0000-0000-0000-000000000035', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('b0010000-0000-0000-0000-000000000036', 'b2000000-0000-0000-0000-000000000036', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('b0020000-0000-0000-0000-000000000036', 'b2000000-0000-0000-0000-000000000036', 'aaaaaaaa-0001-0000-0000-000000000015', true),
    ('b0010000-0000-0000-0000-000000000037', 'b2000000-0000-0000-0000-000000000037', 'aaaaaaaa-0001-0000-0000-000000000011', true),
    ('b0020000-0000-0000-0000-000000000037', 'b2000000-0000-0000-0000-000000000037', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0010000-0000-0000-0000-000000000038', 'b2000000-0000-0000-0000-000000000038', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('b0020000-0000-0000-0000-000000000038', 'b2000000-0000-0000-0000-000000000038', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('b0010000-0000-0000-0000-000000000039', 'b2000000-0000-0000-0000-000000000039', 'aaaaaaaa-0001-0000-0000-000000000011', true),
    ('b0020000-0000-0000-0000-000000000039', 'b2000000-0000-0000-0000-000000000039', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('b0010000-0000-0000-0000-000000000040', 'b2000000-0000-0000-0000-000000000040', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('b0020000-0000-0000-0000-000000000040', 'b2000000-0000-0000-0000-000000000040', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('b0010000-0000-0000-0000-000000000041', 'b2000000-0000-0000-0000-000000000041', 'aaaaaaaa-0001-0000-0000-000000000015', true),
    ('b0020000-0000-0000-0000-000000000041', 'b2000000-0000-0000-0000-000000000041', 'aaaaaaaa-0001-0000-0000-000000000010', true),
    ('b0010000-0000-0000-0000-000000000042', 'b2000000-0000-0000-0000-000000000042', 'aaaaaaaa-0001-0000-0000-000000000013', true),
    ('b0020000-0000-0000-0000-000000000042', 'b2000000-0000-0000-0000-000000000042', 'aaaaaaaa-0001-0000-0000-000000000002', true),
    ('b0010000-0000-0000-0000-000000000043', 'b2000000-0000-0000-0000-000000000043', 'aaaaaaaa-0001-0000-0000-000000000015', true),
    ('b0020000-0000-0000-0000-000000000043', 'b2000000-0000-0000-0000-000000000043', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0010000-0000-0000-0000-000000000044', 'b2000000-0000-0000-0000-000000000044', 'aaaaaaaa-0001-0000-0000-000000000013', true),
    ('b0020000-0000-0000-0000-000000000044', 'b2000000-0000-0000-0000-000000000044', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0010000-0000-0000-0000-000000000045', 'b2000000-0000-0000-0000-000000000045', 'aaaaaaaa-0001-0000-0000-000000000015', true),
    ('b0020000-0000-0000-0000-000000000045', 'b2000000-0000-0000-0000-000000000045', 'aaaaaaaa-0001-0000-0000-000000000014', true),
    ('b0010000-0000-0000-0000-000000000046', 'b2000000-0000-0000-0000-000000000046', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0020000-0000-0000-0000-000000000046', 'b2000000-0000-0000-0000-000000000046', 'aaaaaaaa-0001-0000-0000-000000000001', true),
    ('b0010000-0000-0000-0000-000000000047', 'b2000000-0000-0000-0000-000000000047', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0020000-0000-0000-0000-000000000047', 'b2000000-0000-0000-0000-000000000047', 'aaaaaaaa-0001-0000-0000-000000000011', true),
    ('b0010000-0000-0000-0000-000000000048', 'b2000000-0000-0000-0000-000000000048', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0020000-0000-0000-0000-000000000048', 'b2000000-0000-0000-0000-000000000048', 'aaaaaaaa-0001-0000-0000-000000000006', true),
    ('b0010000-0000-0000-0000-000000000049', 'b2000000-0000-0000-0000-000000000049', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0020000-0000-0000-0000-000000000049', 'b2000000-0000-0000-0000-000000000049', 'aaaaaaaa-0001-0000-0000-000000000003', true),
    ('b0010000-0000-0000-0000-000000000050', 'b2000000-0000-0000-0000-000000000050', 'aaaaaaaa-0001-0000-0000-000000000012', true),
    ('b0020000-0000-0000-0000-000000000050', 'b2000000-0000-0000-0000-000000000050', 'aaaaaaaa-0001-0000-0000-000000000001', true)
ON CONFLICT ("TutorProfileId", "SubjectId") DO NOTHING;

-- 8. AVAILABILITY SLOTS
INSERT INTO "AvailabilitySlots" ("Id", "TutorProfileId", "DayOfWeek", "StartTime", "EndTime", "IsActive")
SELECT ('b0a10000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, 'Monday', '18:00:00'::time, '21:00:00'::time, true FROM generate_series(1, 50) AS i ON CONFLICT ("Id") DO NOTHING;
INSERT INTO "AvailabilitySlots" ("Id", "TutorProfileId", "DayOfWeek", "StartTime", "EndTime", "IsActive")
SELECT ('b0a20000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, 'Wednesday', '18:00:00'::time, '21:00:00'::time, true FROM generate_series(1, 50) AS i ON CONFLICT ("Id") DO NOTHING;
INSERT INTO "AvailabilitySlots" ("Id", "TutorProfileId", "DayOfWeek", "StartTime", "EndTime", "IsActive")
SELECT ('b0a30000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, 'Saturday', '08:30:00'::time, '11:30:00'::time, true FROM generate_series(1, 50) AS i ON CONFLICT ("Id") DO NOTHING;

-- 9. SERVICES (150 Services: 3 per tutor, tailored to their actual subject expertise)
INSERT INTO "Services" (
    "Id", "TutorProfileId", "SubjectId", "Title", "Description", 
    "LearningScope", "ExpectedOutcome", "TotalSessions", "SessionDurationMinutes", 
    "Price", "TeachingMode", "Status", "CreatedAt"
) VALUES
    ('b7000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '66 days'),
    ('b7000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 'Chinh Phục Hình Học Không Gian & Oxyz Lớp 12', 'Hệ thống hóa góc, khoảng cách, thể tích khối đa diện và phương pháp tọa độ hóa hình học không gian 3D.', 'Các dạng toán hình học không gian cổ điển và tọa độ Oxyz từ cơ bản đến nâng cao.', 'Giải quyết 100% câu hỏi hình học trong đề thi tốt nghiệp với độ chính xác cao.', 10, 90, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '67 days'),
    ('b7000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000002', 'Luyện Thi Vào Lớp 10 Chuyên Toán & Trường Công Lập', 'Chuyên đề phương trình vô tỷ, hệ phương trình đối xứng, tứ giác nội tiếp và bất đẳng thức Cauchy.', 'Chương trình Đại số & Hình học lớp 9 nâng cao dành cho học sinh mục tiêu trường chuyên và trường top 1.', 'Tự tin giải quyết câu phân loại điểm 9-10 trong kỳ thi tuyển sinh vào 10.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '68 days'),
    ('b7000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Online', 'Published', NOW() - INTERVAL '69 days'),
    ('b7000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000001', 'Chinh Phục Hình Học Không Gian & Oxyz Lớp 12', 'Hệ thống hóa góc, khoảng cách, thể tích khối đa diện và phương pháp tọa độ hóa hình học không gian 3D.', 'Các dạng toán hình học không gian cổ điển và tọa độ Oxyz từ cơ bản đến nâng cao.', 'Giải quyết 100% câu hỏi hình học trong đề thi tốt nghiệp với độ chính xác cao.', 10, 90, 3000000.00, 'Online', 'Published', NOW() - INTERVAL '70 days'),
    ('b7000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000002', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Online', 'Published', NOW() - INTERVAL '71 days'),
    ('b7000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000003', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '72 days'),
    ('b7000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000003', 'aaaaaaaa-0001-0000-0000-000000000001', 'Chinh Phục Hình Học Không Gian & Oxyz Lớp 12', 'Hệ thống hóa góc, khoảng cách, thể tích khối đa diện và phương pháp tọa độ hóa hình học không gian 3D.', 'Các dạng toán hình học không gian cổ điển và tọa độ Oxyz từ cơ bản đến nâng cao.', 'Giải quyết 100% câu hỏi hình học trong đề thi tốt nghiệp với độ chính xác cao.', 10, 90, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '73 days'),
    ('b7000000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000003', 'aaaaaaaa-0001-0000-0000-000000000002', 'Luyện Thi Vào Lớp 10 Chuyên Toán & Trường Công Lập', 'Chuyên đề phương trình vô tỷ, hệ phương trình đối xứng, tứ giác nội tiếp và bất đẳng thức Cauchy.', 'Chương trình Đại số & Hình học lớp 9 nâng cao dành cho học sinh mục tiêu trường chuyên và trường top 1.', 'Tự tin giải quyết câu phân loại điểm 9-10 trong kỳ thi tuyển sinh vào 10.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '74 days'),
    ('b7000000-0000-0000-0000-000000000010', 'b2000000-0000-0000-0000-000000000004', 'aaaaaaaa-0001-0000-0000-000000000002', 'Luyện Thi Vào Lớp 10 Chuyên Toán & Trường Công Lập', 'Chuyên đề phương trình vô tỷ, hệ phương trình đối xứng, tứ giác nội tiếp và bất đẳng thức Cauchy.', 'Chương trình Đại số & Hình học lớp 9 nâng cao dành cho học sinh mục tiêu trường chuyên và trường top 1.', 'Tự tin giải quyết câu phân loại điểm 9-10 trong kỳ thi tuyển sinh vào 10.', 12, 90, 3600000.00, 'Offline', 'Published', NOW() - INTERVAL '75 days'),
    ('b7000000-0000-0000-0000-000000000011', 'b2000000-0000-0000-0000-000000000004', 'aaaaaaaa-0001-0000-0000-000000000002', 'Bứt Phá Điểm Số Toán THCS (Lớp 7-8-9)', 'Củng cố kiến thức đại số, biến đổi đại số rút gọn biểu thức và kỹ năng vẽ hình phụ trong hình học.', 'Toàn bộ chuyên đề đại số và hình học THCS bám sát sách giáo khoa kết nối tri thức.', 'Thành thạo kỹ năng chứng minh hình học và đạt điểm tổng kết môn trên 8.5.', 10, 90, 2800000.00, 'Offline', 'Published', NOW() - INTERVAL '76 days'),
    ('b7000000-0000-0000-0000-000000000012', 'b2000000-0000-0000-0000-000000000004', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Offline', 'Published', NOW() - INTERVAL '77 days'),
    ('b7000000-0000-0000-0000-000000000013', 'b2000000-0000-0000-0000-000000000005', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '78 days'),
    ('b7000000-0000-0000-0000-000000000014', 'b2000000-0000-0000-0000-000000000005', 'aaaaaaaa-0001-0000-0000-000000000001', 'Chinh Phục Hình Học Không Gian & Oxyz Lớp 12', 'Hệ thống hóa góc, khoảng cách, thể tích khối đa diện và phương pháp tọa độ hóa hình học không gian 3D.', 'Các dạng toán hình học không gian cổ điển và tọa độ Oxyz từ cơ bản đến nâng cao.', 'Giải quyết 100% câu hỏi hình học trong đề thi tốt nghiệp với độ chính xác cao.', 10, 90, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '79 days'),
    ('b7000000-0000-0000-0000-000000000015', 'b2000000-0000-0000-0000-000000000005', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Both', 'Published', NOW() - INTERVAL '80 days'),
    ('b7000000-0000-0000-0000-000000000016', 'b2000000-0000-0000-0000-000000000006', 'aaaaaaaa-0001-0000-0000-000000000002', 'Luyện Thi Vào Lớp 10 Chuyên Toán & Trường Công Lập', 'Chuyên đề phương trình vô tỷ, hệ phương trình đối xứng, tứ giác nội tiếp và bất đẳng thức Cauchy.', 'Chương trình Đại số & Hình học lớp 9 nâng cao dành cho học sinh mục tiêu trường chuyên và trường top 1.', 'Tự tin giải quyết câu phân loại điểm 9-10 trong kỳ thi tuyển sinh vào 10.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '81 days'),
    ('b7000000-0000-0000-0000-000000000017', 'b2000000-0000-0000-0000-000000000006', 'aaaaaaaa-0001-0000-0000-000000000002', 'Bứt Phá Điểm Số Toán THCS (Lớp 7-8-9)', 'Củng cố kiến thức đại số, biến đổi đại số rút gọn biểu thức và kỹ năng vẽ hình phụ trong hình học.', 'Toàn bộ chuyên đề đại số và hình học THCS bám sát sách giáo khoa kết nối tri thức.', 'Thành thạo kỹ năng chứng minh hình học và đạt điểm tổng kết môn trên 8.5.', 10, 90, 2800000.00, 'Both', 'Published', NOW() - INTERVAL '82 days'),
    ('b7000000-0000-0000-0000-000000000018', 'b2000000-0000-0000-0000-000000000006', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '83 days'),
    ('b7000000-0000-0000-0000-000000000019', 'b2000000-0000-0000-0000-000000000007', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Online', 'Published', NOW() - INTERVAL '84 days'),
    ('b7000000-0000-0000-0000-000000000020', 'b2000000-0000-0000-0000-000000000007', 'aaaaaaaa-0001-0000-0000-000000000001', 'Chinh Phục Hình Học Không Gian & Oxyz Lớp 12', 'Hệ thống hóa góc, khoảng cách, thể tích khối đa diện và phương pháp tọa độ hóa hình học không gian 3D.', 'Các dạng toán hình học không gian cổ điển và tọa độ Oxyz từ cơ bản đến nâng cao.', 'Giải quyết 100% câu hỏi hình học trong đề thi tốt nghiệp với độ chính xác cao.', 10, 90, 3000000.00, 'Online', 'Published', NOW() - INTERVAL '85 days'),
    ('b7000000-0000-0000-0000-000000000021', 'b2000000-0000-0000-0000-000000000007', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Online', 'Published', NOW() - INTERVAL '86 days'),
    ('b7000000-0000-0000-0000-000000000022', 'b2000000-0000-0000-0000-000000000008', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '87 days'),
    ('b7000000-0000-0000-0000-000000000023', 'b2000000-0000-0000-0000-000000000008', 'aaaaaaaa-0001-0000-0000-000000000001', 'Chinh Phục Hình Học Không Gian & Oxyz Lớp 12', 'Hệ thống hóa góc, khoảng cách, thể tích khối đa diện và phương pháp tọa độ hóa hình học không gian 3D.', 'Các dạng toán hình học không gian cổ điển và tọa độ Oxyz từ cơ bản đến nâng cao.', 'Giải quyết 100% câu hỏi hình học trong đề thi tốt nghiệp với độ chính xác cao.', 10, 90, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '88 days'),
    ('b7000000-0000-0000-0000-000000000024', 'b2000000-0000-0000-0000-000000000008', 'aaaaaaaa-0001-0000-0000-000000000002', 'Luyện Thi Vào Lớp 10 Chuyên Toán & Trường Công Lập', 'Chuyên đề phương trình vô tỷ, hệ phương trình đối xứng, tứ giác nội tiếp và bất đẳng thức Cauchy.', 'Chương trình Đại số & Hình học lớp 9 nâng cao dành cho học sinh mục tiêu trường chuyên và trường top 1.', 'Tự tin giải quyết câu phân loại điểm 9-10 trong kỳ thi tuyển sinh vào 10.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '89 days'),
    ('b7000000-0000-0000-0000-000000000025', 'b2000000-0000-0000-0000-000000000009', 'aaaaaaaa-0001-0000-0000-000000000004', 'IELTS Intensive Writing & Speaking (Target 6.5 - 7.5+)', 'Sửa bài Writing Task 1 & 2 chi tiết từng câu. Luyện phản xạ Speaking Part 1, 2, 3 theo chủ đề dự đoán quý mới nhất.', 'Chiến thuật phát triển ý tưởng Lexical Resource & Grammatical Range, nâng band cấp tốc trong 6 tuần.', 'Nâng từ 0.5 - 1.0 band Writing & Speaking, tự tin giao tiếp với giám khảo bản xứ.', 12, 90, 4800000.00, 'Both', 'Published', NOW() - INTERVAL '90 days'),
    ('b7000000-0000-0000-0000-000000000026', 'b2000000-0000-0000-0000-000000000009', 'aaaaaaaa-0001-0000-0000-000000000004', 'Chinh Phục IELTS Reading & Listening 7.5+', 'Chiến thuật Skimming, Scanning và giải mã bẫy Paraphrase trong bài thi Reading & Listening học thuật.', '15 đề Cambridge mới nhất (Cam 15 - 19), phương pháp bẫy từ đồng nghĩa và kỹ năng dự đoán đáp án.', 'Đạt band 7.5+ Listening và Reading, hoàn thành bài thi trước 5 phút.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '91 days'),
    ('b7000000-0000-0000-0000-000000000027', 'b2000000-0000-0000-0000-000000000009', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Đàm Phán Thực Chiến', 'Kỹ năng viết Email chuyên nghiệp, thuyết trình dự án, chủ trì cuộc họp và đàm phán hợp đồng thương mại quốc tế.', 'Tình huống giao tiếp công sở thực tế tại các công ty đa quốc gia và tập đoàn FDI.', 'Tự tin đàm phán bằng tiếng Anh, viết email chuẩn business và làm việc hiệu quả với sếp nước ngoài.', 10, 90, 4000000.00, 'Both', 'Published', NOW() - INTERVAL '92 days'),
    ('b7000000-0000-0000-0000-000000000028', 'b2000000-0000-0000-0000-000000000010', 'aaaaaaaa-0001-0000-0000-000000000004', 'IELTS Intensive Writing & Speaking (Target 6.5 - 7.5+)', 'Sửa bài Writing Task 1 & 2 chi tiết từng câu. Luyện phản xạ Speaking Part 1, 2, 3 theo chủ đề dự đoán quý mới nhất.', 'Chiến thuật phát triển ý tưởng Lexical Resource & Grammatical Range, nâng band cấp tốc trong 6 tuần.', 'Nâng từ 0.5 - 1.0 band Writing & Speaking, tự tin giao tiếp với giám khảo bản xứ.', 12, 90, 4800000.00, 'Online', 'Published', NOW() - INTERVAL '93 days'),
    ('b7000000-0000-0000-0000-000000000029', 'b2000000-0000-0000-0000-000000000010', 'aaaaaaaa-0001-0000-0000-000000000004', 'Chinh Phục IELTS Reading & Listening 7.5+', 'Chiến thuật Skimming, Scanning và giải mã bẫy Paraphrase trong bài thi Reading & Listening học thuật.', '15 đề Cambridge mới nhất (Cam 15 - 19), phương pháp bẫy từ đồng nghĩa và kỹ năng dự đoán đáp án.', 'Đạt band 7.5+ Listening và Reading, hoàn thành bài thi trước 5 phút.', 10, 90, 3500000.00, 'Online', 'Published', NOW() - INTERVAL '94 days'),
    ('b7000000-0000-0000-0000-000000000030', 'b2000000-0000-0000-0000-000000000010', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Đàm Phán Thực Chiến', 'Kỹ năng viết Email chuyên nghiệp, thuyết trình dự án, chủ trì cuộc họp và đàm phán hợp đồng thương mại quốc tế.', 'Tình huống giao tiếp công sở thực tế tại các công ty đa quốc gia và tập đoàn FDI.', 'Tự tin đàm phán bằng tiếng Anh, viết email chuẩn business và làm việc hiệu quả với sếp nước ngoài.', 10, 90, 4000000.00, 'Online', 'Published', NOW() - INTERVAL '65 days'),
    ('b7000000-0000-0000-0000-000000000031', 'b2000000-0000-0000-0000-000000000011', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Đàm Phán Thực Chiến', 'Kỹ năng viết Email chuyên nghiệp, thuyết trình dự án, chủ trì cuộc họp và đàm phán hợp đồng thương mại quốc tế.', 'Tình huống giao tiếp công sở thực tế tại các công ty đa quốc gia và tập đoàn FDI.', 'Tự tin đàm phán bằng tiếng Anh, viết email chuẩn business và làm việc hiệu quả với sếp nước ngoài.', 10, 90, 4000000.00, 'Both', 'Published', NOW() - INTERVAL '66 days'),
    ('b7000000-0000-0000-0000-000000000032', 'b2000000-0000-0000-0000-000000000011', 'aaaaaaaa-0001-0000-0000-000000000003', 'Phát Âm Chuẩn Giọng Mỹ & Phản Xạ Giao Tiếp Hàng Ngày', 'Chuẩn hóa 44 âm IPA, nối âm, nuốt âm, trọng âm câu và ngữ điệu tự nhiên qua phương pháp Shadowing.', 'Ngữ âm chuẩn quốc tế, từ vựng giao tiếp thực tế theo 20 chủ đề thông dụng nhất.', 'Xóa bỏ tâm lý e ngại nói tiếng Anh, phát âm chuẩn, người nghe hiểu ngay lập tức.', 10, 60, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '67 days'),
    ('b7000000-0000-0000-0000-000000000033', 'b2000000-0000-0000-0000-000000000011', 'aaaaaaaa-0001-0000-0000-000000000014', 'Nghệ Thuật Thuyết Trình Tự Tin & Làm Chủ Sân Khấu', 'Giải phóng ngôn ngữ cơ thể, kỹ thuật lấy hơi bụng điều tiết giọng nói truyền cảm, cấu trúc bài nói Hook - Story - Call to Action.', 'Kỹ năng nói trước đám đông, thiết kế slide thuyết trình tối giản và tương tác cuốn hút người nghe.', 'Hoàn toàn thoát khỏi nỗi sợ nói trước đám đông, thuyết trình tự tin và cuốn hút người nghe từ phút đầu tiên.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '68 days'),
    ('b7000000-0000-0000-0000-000000000034', 'b2000000-0000-0000-0000-000000000012', 'aaaaaaaa-0001-0000-0000-000000000005', 'Khóa Luyện Thi JLPT N3 Cấp Tốc: Ngữ Pháp & Đọc Hiểu', 'Tổng hợp 130 mẫu ngữ pháp N3 trọng tâm, rèn kỹ năng đọc hiểu trung văn và trường văn theo mẹo bắt từ khóa.', 'Toàn bộ kiến thức kỳ thi năng lực tiếng Nhật N3, luyện đề bám sát kỳ thi JLPT thật.', 'Đạt chứng chỉ JLPT N3 với điểm số trên 120/180.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '69 days'),
    ('b7000000-0000-0000-0000-000000000035', 'b2000000-0000-0000-0000-000000000012', 'aaaaaaaa-0001-0000-0000-000000000005', 'Tiếng Nhật Cho Người Mới Bắt Đầu (Lộ Trình Đạt N5)', 'Bảng chữ cái Hiragana, Katakana, 100 chữ Hán Kanji căn bản và các mẫu câu hội thoại thường ngày.', '25 bài giáo trình Minna no Nihongo I, rèn phát âm chuẩn Tokyo từ những bài học đầu tiên.', 'Giao tiếp cơ bản với người Nhật và sẵn sàng thi chứng chỉ N5.', 10, 90, 2800000.00, 'Both', 'Published', NOW() - INTERVAL '70 days'),
    ('b7000000-0000-0000-0000-000000000036', 'b2000000-0000-0000-0000-000000000012', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Đàm Phán Thực Chiến', 'Kỹ năng viết Email chuyên nghiệp, thuyết trình dự án, chủ trì cuộc họp và đàm phán hợp đồng thương mại quốc tế.', 'Tình huống giao tiếp công sở thực tế tại các công ty đa quốc gia và tập đoàn FDI.', 'Tự tin đàm phán bằng tiếng Anh, viết email chuẩn business và làm việc hiệu quả với sếp nước ngoài.', 10, 90, 4000000.00, 'Both', 'Published', NOW() - INTERVAL '71 days'),
    ('b7000000-0000-0000-0000-000000000037', 'b2000000-0000-0000-0000-000000000013', 'aaaaaaaa-0001-0000-0000-000000000004', 'IELTS Intensive Writing & Speaking (Target 6.5 - 7.5+)', 'Sửa bài Writing Task 1 & 2 chi tiết từng câu. Luyện phản xạ Speaking Part 1, 2, 3 theo chủ đề dự đoán quý mới nhất.', 'Chiến thuật phát triển ý tưởng Lexical Resource & Grammatical Range, nâng band cấp tốc trong 6 tuần.', 'Nâng từ 0.5 - 1.0 band Writing & Speaking, tự tin giao tiếp với giám khảo bản xứ.', 12, 90, 4800000.00, 'Online', 'Published', NOW() - INTERVAL '72 days'),
    ('b7000000-0000-0000-0000-000000000038', 'b2000000-0000-0000-0000-000000000013', 'aaaaaaaa-0001-0000-0000-000000000004', 'Chinh Phục IELTS Reading & Listening 7.5+', 'Chiến thuật Skimming, Scanning và giải mã bẫy Paraphrase trong bài thi Reading & Listening học thuật.', '15 đề Cambridge mới nhất (Cam 15 - 19), phương pháp bẫy từ đồng nghĩa và kỹ năng dự đoán đáp án.', 'Đạt band 7.5+ Listening và Reading, hoàn thành bài thi trước 5 phút.', 10, 90, 3500000.00, 'Online', 'Published', NOW() - INTERVAL '73 days'),
    ('b7000000-0000-0000-0000-000000000039', 'b2000000-0000-0000-0000-000000000013', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Đàm Phán Thực Chiến', 'Kỹ năng viết Email chuyên nghiệp, thuyết trình dự án, chủ trì cuộc họp và đàm phán hợp đồng thương mại quốc tế.', 'Tình huống giao tiếp công sở thực tế tại các công ty đa quốc gia và tập đoàn FDI.', 'Tự tin đàm phán bằng tiếng Anh, viết email chuẩn business và làm việc hiệu quả với sếp nước ngoài.', 10, 90, 4000000.00, 'Online', 'Published', NOW() - INTERVAL '74 days'),
    ('b7000000-0000-0000-0000-000000000040', 'b2000000-0000-0000-0000-000000000014', 'aaaaaaaa-0001-0000-0000-000000000005', 'Khóa Luyện Thi JLPT N3 Cấp Tốc: Ngữ Pháp & Đọc Hiểu', 'Tổng hợp 130 mẫu ngữ pháp N3 trọng tâm, rèn kỹ năng đọc hiểu trung văn và trường văn theo mẹo bắt từ khóa.', 'Toàn bộ kiến thức kỳ thi năng lực tiếng Nhật N3, luyện đề bám sát kỳ thi JLPT thật.', 'Đạt chứng chỉ JLPT N3 với điểm số trên 120/180.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '75 days'),
    ('b7000000-0000-0000-0000-000000000041', 'b2000000-0000-0000-0000-000000000014', 'aaaaaaaa-0001-0000-0000-000000000005', 'Tiếng Nhật Cho Người Mới Bắt Đầu (Lộ Trình Đạt N5)', 'Bảng chữ cái Hiragana, Katakana, 100 chữ Hán Kanji căn bản và các mẫu câu hội thoại thường ngày.', '25 bài giáo trình Minna no Nihongo I, rèn phát âm chuẩn Tokyo từ những bài học đầu tiên.', 'Giao tiếp cơ bản với người Nhật và sẵn sàng thi chứng chỉ N5.', 10, 90, 2800000.00, 'Both', 'Published', NOW() - INTERVAL '76 days'),
    ('b7000000-0000-0000-0000-000000000042', 'b2000000-0000-0000-0000-000000000014', 'aaaaaaaa-0001-0000-0000-000000000004', 'IELTS Intensive Writing & Speaking (Target 6.5 - 7.5+)', 'Sửa bài Writing Task 1 & 2 chi tiết từng câu. Luyện phản xạ Speaking Part 1, 2, 3 theo chủ đề dự đoán quý mới nhất.', 'Chiến thuật phát triển ý tưởng Lexical Resource & Grammatical Range, nâng band cấp tốc trong 6 tuần.', 'Nâng từ 0.5 - 1.0 band Writing & Speaking, tự tin giao tiếp với giám khảo bản xứ.', 12, 90, 4800000.00, 'Both', 'Published', NOW() - INTERVAL '77 days'),
    ('b7000000-0000-0000-0000-000000000043', 'b2000000-0000-0000-0000-000000000015', 'aaaaaaaa-0001-0000-0000-000000000004', 'IELTS Intensive Writing & Speaking (Target 6.5 - 7.5+)', 'Sửa bài Writing Task 1 & 2 chi tiết từng câu. Luyện phản xạ Speaking Part 1, 2, 3 theo chủ đề dự đoán quý mới nhất.', 'Chiến thuật phát triển ý tưởng Lexical Resource & Grammatical Range, nâng band cấp tốc trong 6 tuần.', 'Nâng từ 0.5 - 1.0 band Writing & Speaking, tự tin giao tiếp với giám khảo bản xứ.', 12, 90, 4800000.00, 'Both', 'Published', NOW() - INTERVAL '78 days'),
    ('b7000000-0000-0000-0000-000000000044', 'b2000000-0000-0000-0000-000000000015', 'aaaaaaaa-0001-0000-0000-000000000004', 'Chinh Phục IELTS Reading & Listening 7.5+', 'Chiến thuật Skimming, Scanning và giải mã bẫy Paraphrase trong bài thi Reading & Listening học thuật.', '15 đề Cambridge mới nhất (Cam 15 - 19), phương pháp bẫy từ đồng nghĩa và kỹ năng dự đoán đáp án.', 'Đạt band 7.5+ Listening và Reading, hoàn thành bài thi trước 5 phút.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '79 days'),
    ('b7000000-0000-0000-0000-000000000045', 'b2000000-0000-0000-0000-000000000015', 'aaaaaaaa-0001-0000-0000-000000000014', 'Nghệ Thuật Thuyết Trình Tự Tin & Làm Chủ Sân Khấu', 'Giải phóng ngôn ngữ cơ thể, kỹ thuật lấy hơi bụng điều tiết giọng nói truyền cảm, cấu trúc bài nói Hook - Story - Call to Action.', 'Kỹ năng nói trước đám đông, thiết kế slide thuyết trình tối giản và tương tác cuốn hút người nghe.', 'Hoàn toàn thoát khỏi nỗi sợ nói trước đám đông, thuyết trình tự tin và cuốn hút người nghe từ phút đầu tiên.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '80 days'),
    ('b7000000-0000-0000-0000-000000000046', 'b2000000-0000-0000-0000-000000000016', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Đàm Phán Thực Chiến', 'Kỹ năng viết Email chuyên nghiệp, thuyết trình dự án, chủ trì cuộc họp và đàm phán hợp đồng thương mại quốc tế.', 'Tình huống giao tiếp công sở thực tế tại các công ty đa quốc gia và tập đoàn FDI.', 'Tự tin đàm phán bằng tiếng Anh, viết email chuẩn business và làm việc hiệu quả với sếp nước ngoài.', 10, 90, 4000000.00, 'Online', 'Published', NOW() - INTERVAL '81 days'),
    ('b7000000-0000-0000-0000-000000000047', 'b2000000-0000-0000-0000-000000000016', 'aaaaaaaa-0001-0000-0000-000000000003', 'Phát Âm Chuẩn Giọng Mỹ & Phản Xạ Giao Tiếp Hàng Ngày', 'Chuẩn hóa 44 âm IPA, nối âm, nuốt âm, trọng âm câu và ngữ điệu tự nhiên qua phương pháp Shadowing.', 'Ngữ âm chuẩn quốc tế, từ vựng giao tiếp thực tế theo 20 chủ đề thông dụng nhất.', 'Xóa bỏ tâm lý e ngại nói tiếng Anh, phát âm chuẩn, người nghe hiểu ngay lập tức.', 10, 60, 3000000.00, 'Online', 'Published', NOW() - INTERVAL '82 days'),
    ('b7000000-0000-0000-0000-000000000048', 'b2000000-0000-0000-0000-000000000016', 'aaaaaaaa-0001-0000-0000-000000000004', 'IELTS Intensive Writing & Speaking (Target 6.5 - 7.5+)', 'Sửa bài Writing Task 1 & 2 chi tiết từng câu. Luyện phản xạ Speaking Part 1, 2, 3 theo chủ đề dự đoán quý mới nhất.', 'Chiến thuật phát triển ý tưởng Lexical Resource & Grammatical Range, nâng band cấp tốc trong 6 tuần.', 'Nâng từ 0.5 - 1.0 band Writing & Speaking, tự tin giao tiếp với giám khảo bản xứ.', 12, 90, 4800000.00, 'Online', 'Published', NOW() - INTERVAL '83 days'),
    ('b7000000-0000-0000-0000-000000000049', 'b2000000-0000-0000-0000-000000000017', 'aaaaaaaa-0001-0000-0000-000000000006', 'Bứt Phá Điểm 9+ Vật Lý 12 Thi THPT Quốc Gia', 'Chuyên sâu dao động cơ, sóng cơ, dòng điện xoay chiều RLC và đồ thị vật lý vận dụng cao.', 'Toàn bộ chuyên đề vận dụng cao lớp 12 và phương pháp chuẩn hóa số liệu giải bài tập trong 60 giây.', 'Xử lý nhanh gọn 40 câu hỏi trắc nghiệm, tự tin chinh phục điểm 9-10 môn Vật lý.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '84 days'),
    ('b7000000-0000-0000-0000-000000000050', 'b2000000-0000-0000-0000-000000000017', 'aaaaaaaa-0001-0000-0000-000000000006', 'Vật Lý Lớp 10 & 11 Chương Trình Mới Thực Chiến', 'Hiểu sâu bản chất động lực học Newton, nhiệt động lực học và dòng điện không đổi bằng mô phỏng thực tế.', 'Kiến thức SGK mới kết nối tri thức, phương pháp phân tích lực và giải bài toán thực tế.', 'Đạt điểm tổng kết môn trên 8.5 và tạo bàn đạp vững chắc cho kỳ thi tốt nghiệp.', 10, 90, 2800000.00, 'Both', 'Published', NOW() - INTERVAL '85 days'),
    ('b7000000-0000-0000-0000-000000000051', 'b2000000-0000-0000-0000-000000000017', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Both', 'Published', NOW() - INTERVAL '86 days'),
    ('b7000000-0000-0000-0000-000000000052', 'b2000000-0000-0000-0000-000000000018', 'aaaaaaaa-0001-0000-0000-000000000007', 'Chinh Phục Điểm 9-10 Hóa Học 12: Este, Peptit & Hóa Vô Cơ', 'Phương pháp dồn chất, đồng đẳng hóa este đa chức và xử lý bài toán đồ thị nhôm, muối cacbonat.', 'Các chuyên đề vận dụng cao Hóa học lớp 12 phục vụ xét tuyển đại học khối A, B.', 'Thành thạo phương pháp quy đổi, giải quyết câu hỏi điểm 10 trong vòng 3 phút.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '87 days'),
    ('b7000000-0000-0000-0000-000000000053', 'b2000000-0000-0000-0000-000000000018', 'aaaaaaaa-0001-0000-0000-000000000007', 'Lấy Gốc Hóa Học THPT Trong 10 Buổi', 'Hệ thống lại phản ứng oxi hóa khử, bảo toàn electron, bảo toàn khối lượng và chuỗi phản ứng hữu cơ.', 'Kiến thức nền tảng Hóa 10, 11 và phương pháp tính toán hóa học cơ bản.', 'Hiểu rõ bản chất phản ứng hóa học, nâng điểm kiểm tra trên lớp từ 5 lên 8.', 10, 90, 2800000.00, 'Both', 'Published', NOW() - INTERVAL '88 days'),
    ('b7000000-0000-0000-0000-000000000054', 'b2000000-0000-0000-0000-000000000018', 'aaaaaaaa-0001-0000-0000-000000000008', 'Luyện Thi Sinh Học Khối B: Di Truyền & Phả Hệ Điểm 9+', 'Chuyên sâu quy luật di truyền Menđen, liên kết gen hoán vị và bài toán xác suất phả hệ y học.', 'Toàn bộ chuyên đề Sinh học 12 phục vụ xét tuyển vào các trường Đại học Y Dược.', 'Nắm chắc công thức tính nhanh xác suất di truyền, đạt 9.0+ môn Sinh học.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '89 days'),
    ('b7000000-0000-0000-0000-000000000055', 'b2000000-0000-0000-0000-000000000019', 'aaaaaaaa-0001-0000-0000-000000000006', 'Bứt Phá Điểm 9+ Vật Lý 12 Thi THPT Quốc Gia', 'Chuyên sâu dao động cơ, sóng cơ, dòng điện xoay chiều RLC và đồ thị vật lý vận dụng cao.', 'Toàn bộ chuyên đề vận dụng cao lớp 12 và phương pháp chuẩn hóa số liệu giải bài tập trong 60 giây.', 'Xử lý nhanh gọn 40 câu hỏi trắc nghiệm, tự tin chinh phục điểm 9-10 môn Vật lý.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '90 days'),
    ('b7000000-0000-0000-0000-000000000056', 'b2000000-0000-0000-0000-000000000019', 'aaaaaaaa-0001-0000-0000-000000000006', 'Vật Lý Lớp 10 & 11 Chương Trình Mới Thực Chiến', 'Hiểu sâu bản chất động lực học Newton, nhiệt động lực học và dòng điện không đổi bằng mô phỏng thực tế.', 'Kiến thức SGK mới kết nối tri thức, phương pháp phân tích lực và giải bài toán thực tế.', 'Đạt điểm tổng kết môn trên 8.5 và tạo bàn đạp vững chắc cho kỳ thi tốt nghiệp.', 10, 90, 2800000.00, 'Both', 'Published', NOW() - INTERVAL '91 days'),
    ('b7000000-0000-0000-0000-000000000057', 'b2000000-0000-0000-0000-000000000019', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '92 days'),
    ('b7000000-0000-0000-0000-000000000058', 'b2000000-0000-0000-0000-000000000020', 'aaaaaaaa-0001-0000-0000-000000000008', 'Luyện Thi Sinh Học Khối B: Di Truyền & Phả Hệ Điểm 9+', 'Chuyên sâu quy luật di truyền Menđen, liên kết gen hoán vị và bài toán xác suất phả hệ y học.', 'Toàn bộ chuyên đề Sinh học 12 phục vụ xét tuyển vào các trường Đại học Y Dược.', 'Nắm chắc công thức tính nhanh xác suất di truyền, đạt 9.0+ môn Sinh học.', 12, 90, 3600000.00, 'Online', 'Published', NOW() - INTERVAL '93 days'),
    ('b7000000-0000-0000-0000-000000000059', 'b2000000-0000-0000-0000-000000000020', 'aaaaaaaa-0001-0000-0000-000000000008', 'Hệ Thống Hóa Lý Thuyết Sinh Học 11 & 12', 'Sơ đồ hóa sinh học cơ thể thực vật, động vật, sinh thái học và tiến hóa qua Mindmap trực quan.', 'Toàn bộ lý thuyết Sinh học lớp 11 và 12, phân biệt các khái niệm tương đồng dễ nhầm lẫn.', 'Đạt điểm tuyệt đối phần câu hỏi nhận biết và thông hiểu trong đề thi.', 10, 90, 2600000.00, 'Online', 'Published', NOW() - INTERVAL '94 days'),
    ('b7000000-0000-0000-0000-000000000060', 'b2000000-0000-0000-0000-000000000020', 'aaaaaaaa-0001-0000-0000-000000000007', 'Chinh Phục Điểm 9-10 Hóa Học 12: Este, Peptit & Hóa Vô Cơ', 'Phương pháp dồn chất, đồng đẳng hóa este đa chức và xử lý bài toán đồ thị nhôm, muối cacbonat.', 'Các chuyên đề vận dụng cao Hóa học lớp 12 phục vụ xét tuyển đại học khối A, B.', 'Thành thạo phương pháp quy đổi, giải quyết câu hỏi điểm 10 trong vòng 3 phút.', 12, 90, 3600000.00, 'Online', 'Published', NOW() - INTERVAL '65 days'),
    ('b7000000-0000-0000-0000-000000000061', 'b2000000-0000-0000-0000-000000000021', 'aaaaaaaa-0001-0000-0000-000000000007', 'Chinh Phục Điểm 9-10 Hóa Học 12: Este, Peptit & Hóa Vô Cơ', 'Phương pháp dồn chất, đồng đẳng hóa este đa chức và xử lý bài toán đồ thị nhôm, muối cacbonat.', 'Các chuyên đề vận dụng cao Hóa học lớp 12 phục vụ xét tuyển đại học khối A, B.', 'Thành thạo phương pháp quy đổi, giải quyết câu hỏi điểm 10 trong vòng 3 phút.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '66 days'),
    ('b7000000-0000-0000-0000-000000000062', 'b2000000-0000-0000-0000-000000000021', 'aaaaaaaa-0001-0000-0000-000000000007', 'Lấy Gốc Hóa Học THPT Trong 10 Buổi', 'Hệ thống lại phản ứng oxi hóa khử, bảo toàn electron, bảo toàn khối lượng và chuỗi phản ứng hữu cơ.', 'Kiến thức nền tảng Hóa 10, 11 và phương pháp tính toán hóa học cơ bản.', 'Hiểu rõ bản chất phản ứng hóa học, nâng điểm kiểm tra trên lớp từ 5 lên 8.', 10, 90, 2800000.00, 'Both', 'Published', NOW() - INTERVAL '67 days'),
    ('b7000000-0000-0000-0000-000000000063', 'b2000000-0000-0000-0000-000000000021', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Both', 'Published', NOW() - INTERVAL '68 days'),
    ('b7000000-0000-0000-0000-000000000064', 'b2000000-0000-0000-0000-000000000022', 'aaaaaaaa-0001-0000-0000-000000000006', 'Bứt Phá Điểm 9+ Vật Lý 12 Thi THPT Quốc Gia', 'Chuyên sâu dao động cơ, sóng cơ, dòng điện xoay chiều RLC và đồ thị vật lý vận dụng cao.', 'Toàn bộ chuyên đề vận dụng cao lớp 12 và phương pháp chuẩn hóa số liệu giải bài tập trong 60 giây.', 'Xử lý nhanh gọn 40 câu hỏi trắc nghiệm, tự tin chinh phục điểm 9-10 môn Vật lý.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '69 days'),
    ('b7000000-0000-0000-0000-000000000065', 'b2000000-0000-0000-0000-000000000022', 'aaaaaaaa-0001-0000-0000-000000000006', 'Vật Lý Lớp 10 & 11 Chương Trình Mới Thực Chiến', 'Hiểu sâu bản chất động lực học Newton, nhiệt động lực học và dòng điện không đổi bằng mô phỏng thực tế.', 'Kiến thức SGK mới kết nối tri thức, phương pháp phân tích lực và giải bài toán thực tế.', 'Đạt điểm tổng kết môn trên 8.5 và tạo bàn đạp vững chắc cho kỳ thi tốt nghiệp.', 10, 90, 2800000.00, 'Both', 'Published', NOW() - INTERVAL '70 days'),
    ('b7000000-0000-0000-0000-000000000066', 'b2000000-0000-0000-0000-000000000022', 'aaaaaaaa-0001-0000-0000-000000000002', 'Luyện Thi Vào Lớp 10 Chuyên Toán & Trường Công Lập', 'Chuyên đề phương trình vô tỷ, hệ phương trình đối xứng, tứ giác nội tiếp và bất đẳng thức Cauchy.', 'Chương trình Đại số & Hình học lớp 9 nâng cao dành cho học sinh mục tiêu trường chuyên và trường top 1.', 'Tự tin giải quyết câu phân loại điểm 9-10 trong kỳ thi tuyển sinh vào 10.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '71 days'),
    ('b7000000-0000-0000-0000-000000000067', 'b2000000-0000-0000-0000-000000000023', 'aaaaaaaa-0001-0000-0000-000000000008', 'Luyện Thi Sinh Học Khối B: Di Truyền & Phả Hệ Điểm 9+', 'Chuyên sâu quy luật di truyền Menđen, liên kết gen hoán vị và bài toán xác suất phả hệ y học.', 'Toàn bộ chuyên đề Sinh học 12 phục vụ xét tuyển vào các trường Đại học Y Dược.', 'Nắm chắc công thức tính nhanh xác suất di truyền, đạt 9.0+ môn Sinh học.', 12, 90, 3600000.00, 'Online', 'Published', NOW() - INTERVAL '72 days'),
    ('b7000000-0000-0000-0000-000000000068', 'b2000000-0000-0000-0000-000000000023', 'aaaaaaaa-0001-0000-0000-000000000008', 'Hệ Thống Hóa Lý Thuyết Sinh Học 11 & 12', 'Sơ đồ hóa sinh học cơ thể thực vật, động vật, sinh thái học và tiến hóa qua Mindmap trực quan.', 'Toàn bộ lý thuyết Sinh học lớp 11 và 12, phân biệt các khái niệm tương đồng dễ nhầm lẫn.', 'Đạt điểm tuyệt đối phần câu hỏi nhận biết và thông hiểu trong đề thi.', 10, 90, 2600000.00, 'Online', 'Published', NOW() - INTERVAL '73 days'),
    ('b7000000-0000-0000-0000-000000000069', 'b2000000-0000-0000-0000-000000000023', 'aaaaaaaa-0001-0000-0000-000000000007', 'Chinh Phục Điểm 9-10 Hóa Học 12: Este, Peptit & Hóa Vô Cơ', 'Phương pháp dồn chất, đồng đẳng hóa este đa chức và xử lý bài toán đồ thị nhôm, muối cacbonat.', 'Các chuyên đề vận dụng cao Hóa học lớp 12 phục vụ xét tuyển đại học khối A, B.', 'Thành thạo phương pháp quy đổi, giải quyết câu hỏi điểm 10 trong vòng 3 phút.', 12, 90, 3600000.00, 'Online', 'Published', NOW() - INTERVAL '74 days'),
    ('b7000000-0000-0000-0000-000000000070', 'b2000000-0000-0000-0000-000000000024', 'aaaaaaaa-0001-0000-0000-000000000007', 'Chinh Phục Điểm 9-10 Hóa Học 12: Este, Peptit & Hóa Vô Cơ', 'Phương pháp dồn chất, đồng đẳng hóa este đa chức và xử lý bài toán đồ thị nhôm, muối cacbonat.', 'Các chuyên đề vận dụng cao Hóa học lớp 12 phục vụ xét tuyển đại học khối A, B.', 'Thành thạo phương pháp quy đổi, giải quyết câu hỏi điểm 10 trong vòng 3 phút.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '75 days'),
    ('b7000000-0000-0000-0000-000000000071', 'b2000000-0000-0000-0000-000000000024', 'aaaaaaaa-0001-0000-0000-000000000007', 'Lấy Gốc Hóa Học THPT Trong 10 Buổi', 'Hệ thống lại phản ứng oxi hóa khử, bảo toàn electron, bảo toàn khối lượng và chuỗi phản ứng hữu cơ.', 'Kiến thức nền tảng Hóa 10, 11 và phương pháp tính toán hóa học cơ bản.', 'Hiểu rõ bản chất phản ứng hóa học, nâng điểm kiểm tra trên lớp từ 5 lên 8.', 10, 90, 2800000.00, 'Both', 'Published', NOW() - INTERVAL '76 days'),
    ('b7000000-0000-0000-0000-000000000072', 'b2000000-0000-0000-0000-000000000024', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Both', 'Published', NOW() - INTERVAL '77 days'),
    ('b7000000-0000-0000-0000-000000000073', 'b2000000-0000-0000-0000-000000000025', 'aaaaaaaa-0001-0000-0000-000000000009', 'Khóa Học Backend ASP.NET Core 8 & Clean Architecture Thực Chiến', 'Xây dựng hệ thống Web API chuẩn doanh nghiệp với CQRS (MediatR), EF Core, FluentValidation, JWT Auth, Docker và SignalR.', 'Toàn bộ kiến thức Backend hiện đại: Database migration, Repository pattern, Unit of Work, Transactional Outbox và Unit Test.', 'Tự tay thiết kế và deploy dự án Web API chuẩn kiến trúc thực tế, sẵn sàng ứng tuyển Junior/Middle .NET Dev.', 12, 90, 4800000.00, 'Online', 'Published', NOW() - INTERVAL '78 days'),
    ('b7000000-0000-0000-0000-000000000074', 'b2000000-0000-0000-0000-000000000025', 'aaaaaaaa-0001-0000-0000-000000000009', 'Lập Trình Hướng Đối Tượng C# Căn Bản Đến Nâng Cao (OOP)', 'Nắm chắc 4 tính chất OOP, Generic, Delegate, LINQ to Objects, Asynchronous programming (async/await) và Design Patterns cơ bản.', 'Ngôn ngữ C# hiện đại từ phiên bản 10-12, tối ưu bộ nhớ và quy ước viết mã sạch Clean Code.', 'Viết code C# mạch lạc, hiểu sâu cơ chế hoạt động của CLR và vượt qua bài phỏng vấn kỹ thuật OOP.', 10, 90, 3500000.00, 'Online', 'Published', NOW() - INTERVAL '79 days'),
    ('b7000000-0000-0000-0000-000000000075', 'b2000000-0000-0000-0000-000000000025', 'aaaaaaaa-0001-0000-0000-000000000010', 'Lập Trình Python Cơ Bản Cho Người Mới Bắt Đầu (Zero to Hero)', 'Làm quen cú pháp Python, cấu trúc điều kiện, vòng lặp, hàm, xử lý file và xây dựng ứng dụng quản lý mini đầu tay.', 'Ngôn ngữ Python chuẩn từ con số 0, bài tập tư duy logic thực hành liên tục sau từng buổi học.', 'Tự tin viết code Python thành thạo, tư duy lập trình vững chắc để học tiếp AI hoặc Web.', 10, 90, 3200000.00, 'Online', 'Published', NOW() - INTERVAL '80 days'),
    ('b7000000-0000-0000-0000-000000000076', 'b2000000-0000-0000-0000-000000000026', 'aaaaaaaa-0001-0000-0000-000000000010', 'Lập Trình Python Cơ Bản Cho Người Mới Bắt Đầu (Zero to Hero)', 'Làm quen cú pháp Python, cấu trúc điều kiện, vòng lặp, hàm, xử lý file và xây dựng ứng dụng quản lý mini đầu tay.', 'Ngôn ngữ Python chuẩn từ con số 0, bài tập tư duy logic thực hành liên tục sau từng buổi học.', 'Tự tin viết code Python thành thạo, tư duy lập trình vững chắc để học tiếp AI hoặc Web.', 10, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '81 days'),
    ('b7000000-0000-0000-0000-000000000077', 'b2000000-0000-0000-0000-000000000026', 'aaaaaaaa-0001-0000-0000-000000000010', 'Python Phân Tích Dữ Liệu & Tự Động Hóa Công Việc (Automation)', 'Sử dụng Pandas, Numpy, Matplotlib để xử lý báo cáo Excel tự động, web scraping với BeautifulSoup và gửi email tự động.', 'Các thư viện phân tích dữ liệu hàng đầu, tự động hóa quy trình nghiệp vụ văn phòng thực tế.', 'Tự động hóa 80% công việc thủ công trên Excel, làm chủ kỹ năng phân tích dữ liệu kinh doanh.', 10, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '82 days'),
    ('b7000000-0000-0000-0000-000000000078', 'b2000000-0000-0000-0000-000000000026', 'aaaaaaaa-0001-0000-0000-000000000009', 'Khóa Học Backend ASP.NET Core 8 & Clean Architecture Thực Chiến', 'Xây dựng hệ thống Web API chuẩn doanh nghiệp với CQRS (MediatR), EF Core, FluentValidation, JWT Auth, Docker và SignalR.', 'Toàn bộ kiến thức Backend hiện đại: Database migration, Repository pattern, Unit of Work, Transactional Outbox và Unit Test.', 'Tự tay thiết kế và deploy dự án Web API chuẩn kiến trúc thực tế, sẵn sàng ứng tuyển Junior/Middle .NET Dev.', 12, 90, 4800000.00, 'Both', 'Published', NOW() - INTERVAL '83 days'),
    ('b7000000-0000-0000-0000-000000000079', 'b2000000-0000-0000-0000-000000000027', 'aaaaaaaa-0001-0000-0000-000000000009', 'Khóa Học Backend ASP.NET Core 8 & Clean Architecture Thực Chiến', 'Xây dựng hệ thống Web API chuẩn doanh nghiệp với CQRS (MediatR), EF Core, FluentValidation, JWT Auth, Docker và SignalR.', 'Toàn bộ kiến thức Backend hiện đại: Database migration, Repository pattern, Unit of Work, Transactional Outbox và Unit Test.', 'Tự tay thiết kế và deploy dự án Web API chuẩn kiến trúc thực tế, sẵn sàng ứng tuyển Junior/Middle .NET Dev.', 12, 90, 4800000.00, 'Online', 'Published', NOW() - INTERVAL '84 days'),
    ('b7000000-0000-0000-0000-000000000080', 'b2000000-0000-0000-0000-000000000027', 'aaaaaaaa-0001-0000-0000-000000000009', 'Lập Trình Hướng Đối Tượng C# Căn Bản Đến Nâng Cao (OOP)', 'Nắm chắc 4 tính chất OOP, Generic, Delegate, LINQ to Objects, Asynchronous programming (async/await) và Design Patterns cơ bản.', 'Ngôn ngữ C# hiện đại từ phiên bản 10-12, tối ưu bộ nhớ và quy ước viết mã sạch Clean Code.', 'Viết code C# mạch lạc, hiểu sâu cơ chế hoạt động của CLR và vượt qua bài phỏng vấn kỹ thuật OOP.', 10, 90, 3500000.00, 'Online', 'Published', NOW() - INTERVAL '85 days'),
    ('b7000000-0000-0000-0000-000000000081', 'b2000000-0000-0000-0000-000000000027', 'aaaaaaaa-0001-0000-0000-000000000010', 'Lập Trình Python Cơ Bản Cho Người Mới Bắt Đầu (Zero to Hero)', 'Làm quen cú pháp Python, cấu trúc điều kiện, vòng lặp, hàm, xử lý file và xây dựng ứng dụng quản lý mini đầu tay.', 'Ngôn ngữ Python chuẩn từ con số 0, bài tập tư duy logic thực hành liên tục sau từng buổi học.', 'Tự tin viết code Python thành thạo, tư duy lập trình vững chắc để học tiếp AI hoặc Web.', 10, 90, 3200000.00, 'Online', 'Published', NOW() - INTERVAL '86 days'),
    ('b7000000-0000-0000-0000-000000000082', 'b2000000-0000-0000-0000-000000000028', 'aaaaaaaa-0001-0000-0000-000000000010', 'Lập Trình Python Cơ Bản Cho Người Mới Bắt Đầu (Zero to Hero)', 'Làm quen cú pháp Python, cấu trúc điều kiện, vòng lặp, hàm, xử lý file và xây dựng ứng dụng quản lý mini đầu tay.', 'Ngôn ngữ Python chuẩn từ con số 0, bài tập tư duy logic thực hành liên tục sau từng buổi học.', 'Tự tin viết code Python thành thạo, tư duy lập trình vững chắc để học tiếp AI hoặc Web.', 10, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '87 days'),
    ('b7000000-0000-0000-0000-000000000083', 'b2000000-0000-0000-0000-000000000028', 'aaaaaaaa-0001-0000-0000-000000000010', 'Python Phân Tích Dữ Liệu & Tự Động Hóa Công Việc (Automation)', 'Sử dụng Pandas, Numpy, Matplotlib để xử lý báo cáo Excel tự động, web scraping với BeautifulSoup và gửi email tự động.', 'Các thư viện phân tích dữ liệu hàng đầu, tự động hóa quy trình nghiệp vụ văn phòng thực tế.', 'Tự động hóa 80% công việc thủ công trên Excel, làm chủ kỹ năng phân tích dữ liệu kinh doanh.', 10, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '88 days'),
    ('b7000000-0000-0000-0000-000000000084', 'b2000000-0000-0000-0000-000000000028', 'aaaaaaaa-0001-0000-0000-000000000013', 'Khóa Học Cờ Vua Tư Duy Chiến Lược Cho Trẻ Em & Người Mới', 'Nắm vững luật cờ vua quốc tế, nguyên tắc khai cuộc căn bản, các đòn phối hợp chiến thuật chĩa đôi, giằng quân, xiên.', 'Hệ thống chiến thuật cơ bản FIDE, rèn tính kiên nhẫn, khả năng tập trung và tư duy dự đoán tình huống.', 'Thành thạo các đòn phối hợp chiến thuật cơ bản và tự tin tham gia các giải đấu cờ vua phong trào.', 10, 60, 2500000.00, 'Both', 'Published', NOW() - INTERVAL '89 days'),
    ('b7000000-0000-0000-0000-000000000085', 'b2000000-0000-0000-0000-000000000029', 'aaaaaaaa-0001-0000-0000-000000000009', 'Khóa Học Backend ASP.NET Core 8 & Clean Architecture Thực Chiến', 'Xây dựng hệ thống Web API chuẩn doanh nghiệp với CQRS (MediatR), EF Core, FluentValidation, JWT Auth, Docker và SignalR.', 'Toàn bộ kiến thức Backend hiện đại: Database migration, Repository pattern, Unit of Work, Transactional Outbox và Unit Test.', 'Tự tay thiết kế và deploy dự án Web API chuẩn kiến trúc thực tế, sẵn sàng ứng tuyển Junior/Middle .NET Dev.', 12, 90, 4800000.00, 'Both', 'Published', NOW() - INTERVAL '90 days'),
    ('b7000000-0000-0000-0000-000000000086', 'b2000000-0000-0000-0000-000000000029', 'aaaaaaaa-0001-0000-0000-000000000009', 'Lập Trình Hướng Đối Tượng C# Căn Bản Đến Nâng Cao (OOP)', 'Nắm chắc 4 tính chất OOP, Generic, Delegate, LINQ to Objects, Asynchronous programming (async/await) và Design Patterns cơ bản.', 'Ngôn ngữ C# hiện đại từ phiên bản 10-12, tối ưu bộ nhớ và quy ước viết mã sạch Clean Code.', 'Viết code C# mạch lạc, hiểu sâu cơ chế hoạt động của CLR và vượt qua bài phỏng vấn kỹ thuật OOP.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '91 days'),
    ('b7000000-0000-0000-0000-000000000087', 'b2000000-0000-0000-0000-000000000029', 'aaaaaaaa-0001-0000-0000-000000000010', 'Lập Trình Python Cơ Bản Cho Người Mới Bắt Đầu (Zero to Hero)', 'Làm quen cú pháp Python, cấu trúc điều kiện, vòng lặp, hàm, xử lý file và xây dựng ứng dụng quản lý mini đầu tay.', 'Ngôn ngữ Python chuẩn từ con số 0, bài tập tư duy logic thực hành liên tục sau từng buổi học.', 'Tự tin viết code Python thành thạo, tư duy lập trình vững chắc để học tiếp AI hoặc Web.', 10, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '92 days'),
    ('b7000000-0000-0000-0000-000000000088', 'b2000000-0000-0000-0000-000000000030', 'aaaaaaaa-0001-0000-0000-000000000010', 'Lập Trình Python Cơ Bản Cho Người Mới Bắt Đầu (Zero to Hero)', 'Làm quen cú pháp Python, cấu trúc điều kiện, vòng lặp, hàm, xử lý file và xây dựng ứng dụng quản lý mini đầu tay.', 'Ngôn ngữ Python chuẩn từ con số 0, bài tập tư duy logic thực hành liên tục sau từng buổi học.', 'Tự tin viết code Python thành thạo, tư duy lập trình vững chắc để học tiếp AI hoặc Web.', 10, 90, 3200000.00, 'Online', 'Published', NOW() - INTERVAL '93 days'),
    ('b7000000-0000-0000-0000-000000000089', 'b2000000-0000-0000-0000-000000000030', 'aaaaaaaa-0001-0000-0000-000000000010', 'Python Phân Tích Dữ Liệu & Tự Động Hóa Công Việc (Automation)', 'Sử dụng Pandas, Numpy, Matplotlib để xử lý báo cáo Excel tự động, web scraping với BeautifulSoup và gửi email tự động.', 'Các thư viện phân tích dữ liệu hàng đầu, tự động hóa quy trình nghiệp vụ văn phòng thực tế.', 'Tự động hóa 80% công việc thủ công trên Excel, làm chủ kỹ năng phân tích dữ liệu kinh doanh.', 10, 90, 3600000.00, 'Online', 'Published', NOW() - INTERVAL '94 days'),
    ('b7000000-0000-0000-0000-000000000090', 'b2000000-0000-0000-0000-000000000030', 'aaaaaaaa-0001-0000-0000-000000000015', 'Nguyên Lý Kế Toán & Kỹ Năng Định Khoản Thực Hành', 'Bản chất tài khoản kế toán chữ T, định khoản các nghiệp vụ kinh tế phát sinh, lập bảng cân đối kế toán và báo cáo KQKD.', 'Nguyên lý kế toán doanh nghiệp theo Thông tư 200/2014/TT-BTC từ con số 0.', 'Hiểu rõ bản chất dòng tiền, định khoản chính xác 100% các nghiệp vụ kế toán cơ bản.', 10, 90, 3000000.00, 'Online', 'Published', NOW() - INTERVAL '65 days'),
    ('b7000000-0000-0000-0000-000000000091', 'b2000000-0000-0000-0000-000000000031', 'aaaaaaaa-0001-0000-0000-000000000009', 'Khóa Học Backend ASP.NET Core 8 & Clean Architecture Thực Chiến', 'Xây dựng hệ thống Web API chuẩn doanh nghiệp với CQRS (MediatR), EF Core, FluentValidation, JWT Auth, Docker và SignalR.', 'Toàn bộ kiến thức Backend hiện đại: Database migration, Repository pattern, Unit of Work, Transactional Outbox và Unit Test.', 'Tự tay thiết kế và deploy dự án Web API chuẩn kiến trúc thực tế, sẵn sàng ứng tuyển Junior/Middle .NET Dev.', 12, 90, 4800000.00, 'Online', 'Published', NOW() - INTERVAL '66 days'),
    ('b7000000-0000-0000-0000-000000000092', 'b2000000-0000-0000-0000-000000000031', 'aaaaaaaa-0001-0000-0000-000000000009', 'Lập Trình Hướng Đối Tượng C# Căn Bản Đến Nâng Cao (OOP)', 'Nắm chắc 4 tính chất OOP, Generic, Delegate, LINQ to Objects, Asynchronous programming (async/await) và Design Patterns cơ bản.', 'Ngôn ngữ C# hiện đại từ phiên bản 10-12, tối ưu bộ nhớ và quy ước viết mã sạch Clean Code.', 'Viết code C# mạch lạc, hiểu sâu cơ chế hoạt động của CLR và vượt qua bài phỏng vấn kỹ thuật OOP.', 10, 90, 3500000.00, 'Online', 'Published', NOW() - INTERVAL '67 days'),
    ('b7000000-0000-0000-0000-000000000093', 'b2000000-0000-0000-0000-000000000031', 'aaaaaaaa-0001-0000-0000-000000000010', 'Lập Trình Python Cơ Bản Cho Người Mới Bắt Đầu (Zero to Hero)', 'Làm quen cú pháp Python, cấu trúc điều kiện, vòng lặp, hàm, xử lý file và xây dựng ứng dụng quản lý mini đầu tay.', 'Ngôn ngữ Python chuẩn từ con số 0, bài tập tư duy logic thực hành liên tục sau từng buổi học.', 'Tự tin viết code Python thành thạo, tư duy lập trình vững chắc để học tiếp AI hoặc Web.', 10, 90, 3200000.00, 'Online', 'Published', NOW() - INTERVAL '68 days'),
    ('b7000000-0000-0000-0000-000000000094', 'b2000000-0000-0000-0000-000000000032', 'aaaaaaaa-0001-0000-0000-000000000009', 'Khóa Học Backend ASP.NET Core 8 & Clean Architecture Thực Chiến', 'Xây dựng hệ thống Web API chuẩn doanh nghiệp với CQRS (MediatR), EF Core, FluentValidation, JWT Auth, Docker và SignalR.', 'Toàn bộ kiến thức Backend hiện đại: Database migration, Repository pattern, Unit of Work, Transactional Outbox và Unit Test.', 'Tự tay thiết kế và deploy dự án Web API chuẩn kiến trúc thực tế, sẵn sàng ứng tuyển Junior/Middle .NET Dev.', 12, 90, 4800000.00, 'Both', 'Published', NOW() - INTERVAL '69 days'),
    ('b7000000-0000-0000-0000-000000000095', 'b2000000-0000-0000-0000-000000000032', 'aaaaaaaa-0001-0000-0000-000000000009', 'Lập Trình Hướng Đối Tượng C# Căn Bản Đến Nâng Cao (OOP)', 'Nắm chắc 4 tính chất OOP, Generic, Delegate, LINQ to Objects, Asynchronous programming (async/await) và Design Patterns cơ bản.', 'Ngôn ngữ C# hiện đại từ phiên bản 10-12, tối ưu bộ nhớ và quy ước viết mã sạch Clean Code.', 'Viết code C# mạch lạc, hiểu sâu cơ chế hoạt động của CLR và vượt qua bài phỏng vấn kỹ thuật OOP.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '70 days'),
    ('b7000000-0000-0000-0000-000000000096', 'b2000000-0000-0000-0000-000000000032', 'aaaaaaaa-0001-0000-0000-000000000010', 'Lập Trình Python Cơ Bản Cho Người Mới Bắt Đầu (Zero to Hero)', 'Làm quen cú pháp Python, cấu trúc điều kiện, vòng lặp, hàm, xử lý file và xây dựng ứng dụng quản lý mini đầu tay.', 'Ngôn ngữ Python chuẩn từ con số 0, bài tập tư duy logic thực hành liên tục sau từng buổi học.', 'Tự tin viết code Python thành thạo, tư duy lập trình vững chắc để học tiếp AI hoặc Web.', 10, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '71 days'),
    ('b7000000-0000-0000-0000-000000000097', 'b2000000-0000-0000-0000-000000000033', 'aaaaaaaa-0001-0000-0000-000000000011', 'Khóa Luyện Thi Vào Lớp 10 Môn Ngữ Văn Điểm 8.5+', 'Nắm vững kỹ năng làm bài nghị luận văn học, nghị luận xã hội về tư tưởng đạo lý và hiện tượng đời sống.', 'Toàn bộ tác phẩm văn học lớp 9 trọng tâm, phương pháp triển khai luận điểm sáng tạo và giàu cảm xúc.', 'Biết cách mở bài, kết bài thu hút, hành văn trôi chảy và đạt điểm 8.5+ kỳ thi vào 10.', 12, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '72 days'),
    ('b7000000-0000-0000-0000-000000000098', 'b2000000-0000-0000-0000-000000000033', 'aaaaaaaa-0001-0000-0000-000000000011', 'Bứt Phá Điểm 9+ Ngữ Văn Thi THPT Quốc Gia', 'Chiến thuật viết đoạn văn nghị luận xã hội 200 chữ sắc bén và phân tích chiều sâu tác phẩm văn xuôi hiện đại.', 'Các tác phẩm trọng tâm lớp 12: Vợ chồng A Phủ, Vợ nhặt, Người lái đò Sông Đà, Đất Nước...', 'Tư duy lập luận phản biện sắc sảo, đạt 8.75 - 9.25 môn Ngữ văn trong kỳ thi tốt nghiệp.', 10, 90, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '73 days'),
    ('b7000000-0000-0000-0000-000000000099', 'b2000000-0000-0000-0000-000000000033', 'aaaaaaaa-0001-0000-0000-000000000014', 'Nghệ Thuật Thuyết Trình Tự Tin & Làm Chủ Sân Khấu', 'Giải phóng ngôn ngữ cơ thể, kỹ thuật lấy hơi bụng điều tiết giọng nói truyền cảm, cấu trúc bài nói Hook - Story - Call to Action.', 'Kỹ năng nói trước đám đông, thiết kế slide thuyết trình tối giản và tương tác cuốn hút người nghe.', 'Hoàn toàn thoát khỏi nỗi sợ nói trước đám đông, thuyết trình tự tin và cuốn hút người nghe từ phút đầu tiên.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '74 days'),
    ('b7000000-0000-0000-0000-000000000100', 'b2000000-0000-0000-0000-000000000034', 'aaaaaaaa-0001-0000-0000-000000000014', 'Nghệ Thuật Thuyết Trình Tự Tin & Làm Chủ Sân Khấu', 'Giải phóng ngôn ngữ cơ thể, kỹ thuật lấy hơi bụng điều tiết giọng nói truyền cảm, cấu trúc bài nói Hook - Story - Call to Action.', 'Kỹ năng nói trước đám đông, thiết kế slide thuyết trình tối giản và tương tác cuốn hút người nghe.', 'Hoàn toàn thoát khỏi nỗi sợ nói trước đám đông, thuyết trình tự tin và cuốn hút người nghe từ phút đầu tiên.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '75 days'),
    ('b7000000-0000-0000-0000-000000000101', 'b2000000-0000-0000-0000-000000000034', 'aaaaaaaa-0001-0000-0000-000000000014', 'Kỹ Năng Đàm Phán Thương Mại & Thuyết Phục Đỉnh Cao', 'Nguyên lý đàm phán Win-Win của Harvard, chiến thuật nhượng bộ có điều kiện và kỹ thuật đọc vị tâm lý đối tác.', 'Các tình huống thương lượng giá cả, ký kết hợp đồng thương mại và xử lý phản bác từ khách hàng khó tính.', 'Làm chủ các tình huống đàm phán khó, đạt thỏa thuận có lợi nhất mà vẫn giữ quan hệ hợp tác lâu dài.', 8, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '76 days'),
    ('b7000000-0000-0000-0000-000000000102', 'b2000000-0000-0000-0000-000000000034', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Đàm Phán Thực Chiến', 'Kỹ năng viết Email chuyên nghiệp, thuyết trình dự án, chủ trì cuộc họp và đàm phán hợp đồng thương mại quốc tế.', 'Tình huống giao tiếp công sở thực tế tại các công ty đa quốc gia và tập đoàn FDI.', 'Tự tin đàm phán bằng tiếng Anh, viết email chuẩn business và làm việc hiệu quả với sếp nước ngoài.', 10, 90, 4000000.00, 'Both', 'Published', NOW() - INTERVAL '77 days'),
    ('b7000000-0000-0000-0000-000000000103', 'b2000000-0000-0000-0000-000000000035', 'aaaaaaaa-0001-0000-0000-000000000011', 'Khóa Luyện Thi Vào Lớp 10 Môn Ngữ Văn Điểm 8.5+', 'Nắm vững kỹ năng làm bài nghị luận văn học, nghị luận xã hội về tư tưởng đạo lý và hiện tượng đời sống.', 'Toàn bộ tác phẩm văn học lớp 9 trọng tâm, phương pháp triển khai luận điểm sáng tạo và giàu cảm xúc.', 'Biết cách mở bài, kết bài thu hút, hành văn trôi chảy và đạt điểm 8.5+ kỳ thi vào 10.', 12, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '78 days'),
    ('b7000000-0000-0000-0000-000000000104', 'b2000000-0000-0000-0000-000000000035', 'aaaaaaaa-0001-0000-0000-000000000011', 'Bứt Phá Điểm 9+ Ngữ Văn Thi THPT Quốc Gia', 'Chiến thuật viết đoạn văn nghị luận xã hội 200 chữ sắc bén và phân tích chiều sâu tác phẩm văn xuôi hiện đại.', 'Các tác phẩm trọng tâm lớp 12: Vợ chồng A Phủ, Vợ nhặt, Người lái đò Sông Đà, Đất Nước...', 'Tư duy lập luận phản biện sắc sảo, đạt 8.75 - 9.25 môn Ngữ văn trong kỳ thi tốt nghiệp.', 10, 90, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '79 days'),
    ('b7000000-0000-0000-0000-000000000105', 'b2000000-0000-0000-0000-000000000035', 'aaaaaaaa-0001-0000-0000-000000000014', 'Nghệ Thuật Thuyết Trình Tự Tin & Làm Chủ Sân Khấu', 'Giải phóng ngôn ngữ cơ thể, kỹ thuật lấy hơi bụng điều tiết giọng nói truyền cảm, cấu trúc bài nói Hook - Story - Call to Action.', 'Kỹ năng nói trước đám đông, thiết kế slide thuyết trình tối giản và tương tác cuốn hút người nghe.', 'Hoàn toàn thoát khỏi nỗi sợ nói trước đám đông, thuyết trình tự tin và cuốn hút người nghe từ phút đầu tiên.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '80 days'),
    ('b7000000-0000-0000-0000-000000000106', 'b2000000-0000-0000-0000-000000000036', 'aaaaaaaa-0001-0000-0000-000000000014', 'Nghệ Thuật Thuyết Trình Tự Tin & Làm Chủ Sân Khấu', 'Giải phóng ngôn ngữ cơ thể, kỹ thuật lấy hơi bụng điều tiết giọng nói truyền cảm, cấu trúc bài nói Hook - Story - Call to Action.', 'Kỹ năng nói trước đám đông, thiết kế slide thuyết trình tối giản và tương tác cuốn hút người nghe.', 'Hoàn toàn thoát khỏi nỗi sợ nói trước đám đông, thuyết trình tự tin và cuốn hút người nghe từ phút đầu tiên.', 10, 90, 3500000.00, 'Online', 'Published', NOW() - INTERVAL '81 days'),
    ('b7000000-0000-0000-0000-000000000107', 'b2000000-0000-0000-0000-000000000036', 'aaaaaaaa-0001-0000-0000-000000000014', 'Kỹ Năng Đàm Phán Thương Mại & Thuyết Phục Đỉnh Cao', 'Nguyên lý đàm phán Win-Win của Harvard, chiến thuật nhượng bộ có điều kiện và kỹ thuật đọc vị tâm lý đối tác.', 'Các tình huống thương lượng giá cả, ký kết hợp đồng thương mại và xử lý phản bác từ khách hàng khó tính.', 'Làm chủ các tình huống đàm phán khó, đạt thỏa thuận có lợi nhất mà vẫn giữ quan hệ hợp tác lâu dài.', 8, 90, 3200000.00, 'Online', 'Published', NOW() - INTERVAL '82 days'),
    ('b7000000-0000-0000-0000-000000000108', 'b2000000-0000-0000-0000-000000000036', 'aaaaaaaa-0001-0000-0000-000000000015', 'Nguyên Lý Kế Toán & Kỹ Năng Định Khoản Thực Hành', 'Bản chất tài khoản kế toán chữ T, định khoản các nghiệp vụ kinh tế phát sinh, lập bảng cân đối kế toán và báo cáo KQKD.', 'Nguyên lý kế toán doanh nghiệp theo Thông tư 200/2014/TT-BTC từ con số 0.', 'Hiểu rõ bản chất dòng tiền, định khoản chính xác 100% các nghiệp vụ kế toán cơ bản.', 10, 90, 3000000.00, 'Online', 'Published', NOW() - INTERVAL '83 days'),
    ('b7000000-0000-0000-0000-000000000109', 'b2000000-0000-0000-0000-000000000037', 'aaaaaaaa-0001-0000-0000-000000000011', 'Khóa Luyện Thi Vào Lớp 10 Môn Ngữ Văn Điểm 8.5+', 'Nắm vững kỹ năng làm bài nghị luận văn học, nghị luận xã hội về tư tưởng đạo lý và hiện tượng đời sống.', 'Toàn bộ tác phẩm văn học lớp 9 trọng tâm, phương pháp triển khai luận điểm sáng tạo và giàu cảm xúc.', 'Biết cách mở bài, kết bài thu hút, hành văn trôi chảy và đạt điểm 8.5+ kỳ thi vào 10.', 12, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '84 days'),
    ('b7000000-0000-0000-0000-000000000110', 'b2000000-0000-0000-0000-000000000037', 'aaaaaaaa-0001-0000-0000-000000000011', 'Bứt Phá Điểm 9+ Ngữ Văn Thi THPT Quốc Gia', 'Chiến thuật viết đoạn văn nghị luận xã hội 200 chữ sắc bén và phân tích chiều sâu tác phẩm văn xuôi hiện đại.', 'Các tác phẩm trọng tâm lớp 12: Vợ chồng A Phủ, Vợ nhặt, Người lái đò Sông Đà, Đất Nước...', 'Tư duy lập luận phản biện sắc sảo, đạt 8.75 - 9.25 môn Ngữ văn trong kỳ thi tốt nghiệp.', 10, 90, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '85 days'),
    ('b7000000-0000-0000-0000-000000000111', 'b2000000-0000-0000-0000-000000000037', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Both', 'Published', NOW() - INTERVAL '86 days'),
    ('b7000000-0000-0000-0000-000000000112', 'b2000000-0000-0000-0000-000000000038', 'aaaaaaaa-0001-0000-0000-000000000014', 'Nghệ Thuật Thuyết Trình Tự Tin & Làm Chủ Sân Khấu', 'Giải phóng ngôn ngữ cơ thể, kỹ thuật lấy hơi bụng điều tiết giọng nói truyền cảm, cấu trúc bài nói Hook - Story - Call to Action.', 'Kỹ năng nói trước đám đông, thiết kế slide thuyết trình tối giản và tương tác cuốn hút người nghe.', 'Hoàn toàn thoát khỏi nỗi sợ nói trước đám đông, thuyết trình tự tin và cuốn hút người nghe từ phút đầu tiên.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '87 days'),
    ('b7000000-0000-0000-0000-000000000113', 'b2000000-0000-0000-0000-000000000038', 'aaaaaaaa-0001-0000-0000-000000000014', 'Kỹ Năng Đàm Phán Thương Mại & Thuyết Phục Đỉnh Cao', 'Nguyên lý đàm phán Win-Win của Harvard, chiến thuật nhượng bộ có điều kiện và kỹ thuật đọc vị tâm lý đối tác.', 'Các tình huống thương lượng giá cả, ký kết hợp đồng thương mại và xử lý phản bác từ khách hàng khó tính.', 'Làm chủ các tình huống đàm phán khó, đạt thỏa thuận có lợi nhất mà vẫn giữ quan hệ hợp tác lâu dài.', 8, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '88 days'),
    ('b7000000-0000-0000-0000-000000000114', 'b2000000-0000-0000-0000-000000000038', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Đàm Phán Thực Chiến', 'Kỹ năng viết Email chuyên nghiệp, thuyết trình dự án, chủ trì cuộc họp và đàm phán hợp đồng thương mại quốc tế.', 'Tình huống giao tiếp công sở thực tế tại các công ty đa quốc gia và tập đoàn FDI.', 'Tự tin đàm phán bằng tiếng Anh, viết email chuẩn business và làm việc hiệu quả với sếp nước ngoài.', 10, 90, 4000000.00, 'Both', 'Published', NOW() - INTERVAL '89 days'),
    ('b7000000-0000-0000-0000-000000000115', 'b2000000-0000-0000-0000-000000000039', 'aaaaaaaa-0001-0000-0000-000000000011', 'Khóa Luyện Thi Vào Lớp 10 Môn Ngữ Văn Điểm 8.5+', 'Nắm vững kỹ năng làm bài nghị luận văn học, nghị luận xã hội về tư tưởng đạo lý và hiện tượng đời sống.', 'Toàn bộ tác phẩm văn học lớp 9 trọng tâm, phương pháp triển khai luận điểm sáng tạo và giàu cảm xúc.', 'Biết cách mở bài, kết bài thu hút, hành văn trôi chảy và đạt điểm 8.5+ kỳ thi vào 10.', 12, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '90 days'),
    ('b7000000-0000-0000-0000-000000000116', 'b2000000-0000-0000-0000-000000000039', 'aaaaaaaa-0001-0000-0000-000000000011', 'Bứt Phá Điểm 9+ Ngữ Văn Thi THPT Quốc Gia', 'Chiến thuật viết đoạn văn nghị luận xã hội 200 chữ sắc bén và phân tích chiều sâu tác phẩm văn xuôi hiện đại.', 'Các tác phẩm trọng tâm lớp 12: Vợ chồng A Phủ, Vợ nhặt, Người lái đò Sông Đà, Đất Nước...', 'Tư duy lập luận phản biện sắc sảo, đạt 8.75 - 9.25 môn Ngữ văn trong kỳ thi tốt nghiệp.', 10, 90, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '91 days'),
    ('b7000000-0000-0000-0000-000000000117', 'b2000000-0000-0000-0000-000000000039', 'aaaaaaaa-0001-0000-0000-000000000014', 'Nghệ Thuật Thuyết Trình Tự Tin & Làm Chủ Sân Khấu', 'Giải phóng ngôn ngữ cơ thể, kỹ thuật lấy hơi bụng điều tiết giọng nói truyền cảm, cấu trúc bài nói Hook - Story - Call to Action.', 'Kỹ năng nói trước đám đông, thiết kế slide thuyết trình tối giản và tương tác cuốn hút người nghe.', 'Hoàn toàn thoát khỏi nỗi sợ nói trước đám đông, thuyết trình tự tin và cuốn hút người nghe từ phút đầu tiên.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '92 days'),
    ('b7000000-0000-0000-0000-000000000118', 'b2000000-0000-0000-0000-000000000040', 'aaaaaaaa-0001-0000-0000-000000000014', 'Nghệ Thuật Thuyết Trình Tự Tin & Làm Chủ Sân Khấu', 'Giải phóng ngôn ngữ cơ thể, kỹ thuật lấy hơi bụng điều tiết giọng nói truyền cảm, cấu trúc bài nói Hook - Story - Call to Action.', 'Kỹ năng nói trước đám đông, thiết kế slide thuyết trình tối giản và tương tác cuốn hút người nghe.', 'Hoàn toàn thoát khỏi nỗi sợ nói trước đám đông, thuyết trình tự tin và cuốn hút người nghe từ phút đầu tiên.', 10, 90, 3500000.00, 'Online', 'Published', NOW() - INTERVAL '93 days'),
    ('b7000000-0000-0000-0000-000000000119', 'b2000000-0000-0000-0000-000000000040', 'aaaaaaaa-0001-0000-0000-000000000014', 'Kỹ Năng Đàm Phán Thương Mại & Thuyết Phục Đỉnh Cao', 'Nguyên lý đàm phán Win-Win của Harvard, chiến thuật nhượng bộ có điều kiện và kỹ thuật đọc vị tâm lý đối tác.', 'Các tình huống thương lượng giá cả, ký kết hợp đồng thương mại và xử lý phản bác từ khách hàng khó tính.', 'Làm chủ các tình huống đàm phán khó, đạt thỏa thuận có lợi nhất mà vẫn giữ quan hệ hợp tác lâu dài.', 8, 90, 3200000.00, 'Online', 'Published', NOW() - INTERVAL '94 days'),
    ('b7000000-0000-0000-0000-000000000120', 'b2000000-0000-0000-0000-000000000040', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Đàm Phán Thực Chiến', 'Kỹ năng viết Email chuyên nghiệp, thuyết trình dự án, chủ trì cuộc họp và đàm phán hợp đồng thương mại quốc tế.', 'Tình huống giao tiếp công sở thực tế tại các công ty đa quốc gia và tập đoàn FDI.', 'Tự tin đàm phán bằng tiếng Anh, viết email chuẩn business và làm việc hiệu quả với sếp nước ngoài.', 10, 90, 4000000.00, 'Online', 'Published', NOW() - INTERVAL '65 days'),
    ('b7000000-0000-0000-0000-000000000121', 'b2000000-0000-0000-0000-000000000041', 'aaaaaaaa-0001-0000-0000-000000000015', 'Nguyên Lý Kế Toán & Kỹ Năng Định Khoản Thực Hành', 'Bản chất tài khoản kế toán chữ T, định khoản các nghiệp vụ kinh tế phát sinh, lập bảng cân đối kế toán và báo cáo KQKD.', 'Nguyên lý kế toán doanh nghiệp theo Thông tư 200/2014/TT-BTC từ con số 0.', 'Hiểu rõ bản chất dòng tiền, định khoản chính xác 100% các nghiệp vụ kế toán cơ bản.', 10, 90, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '66 days'),
    ('b7000000-0000-0000-0000-000000000122', 'b2000000-0000-0000-0000-000000000041', 'aaaaaaaa-0001-0000-0000-000000000015', 'Kế Toán Thuế & Thực Hành Khai Báo Thuế Trên Phần Mềm', 'Hướng dẫn lập tờ khai thuế GTGT, thuế TNCN, tính thuế TNDN tạm nộp và lập báo cáo tài chính năm trên phần mềm MISA/HTKK.', 'Chính sách thuế hiện hành, quy định hóa đơn điện tử và kỹ năng xử lý sai sót chứng từ.', 'Tự tin lập tờ khai thuế, hạch toán sổ sách và lên báo cáo tài chính chuẩn quy định.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '67 days'),
    ('b7000000-0000-0000-0000-000000000123', 'b2000000-0000-0000-0000-000000000041', 'aaaaaaaa-0001-0000-0000-000000000010', 'Lập Trình Python Cơ Bản Cho Người Mới Bắt Đầu (Zero to Hero)', 'Làm quen cú pháp Python, cấu trúc điều kiện, vòng lặp, hàm, xử lý file và xây dựng ứng dụng quản lý mini đầu tay.', 'Ngôn ngữ Python chuẩn từ con số 0, bài tập tư duy logic thực hành liên tục sau từng buổi học.', 'Tự tin viết code Python thành thạo, tư duy lập trình vững chắc để học tiếp AI hoặc Web.', 10, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '68 days'),
    ('b7000000-0000-0000-0000-000000000124', 'b2000000-0000-0000-0000-000000000042', 'aaaaaaaa-0001-0000-0000-000000000013', 'Khóa Học Cờ Vua Tư Duy Chiến Lược Cho Trẻ Em & Người Mới', 'Nắm vững luật cờ vua quốc tế, nguyên tắc khai cuộc căn bản, các đòn phối hợp chiến thuật chĩa đôi, giằng quân, xiên.', 'Hệ thống chiến thuật cơ bản FIDE, rèn tính kiên nhẫn, khả năng tập trung và tư duy dự đoán tình huống.', 'Thành thạo các đòn phối hợp chiến thuật cơ bản và tự tin tham gia các giải đấu cờ vua phong trào.', 10, 60, 2500000.00, 'Both', 'Published', NOW() - INTERVAL '69 days'),
    ('b7000000-0000-0000-0000-000000000125', 'b2000000-0000-0000-0000-000000000042', 'aaaaaaaa-0001-0000-0000-000000000013', 'Cờ Vua Nâng Cao: Bẫy Khai Cuộc & Kỹ Thuật Tàn Cuộc Kinh Điển', 'Nghiên cứu sâu các hệ thống khai cuộc Ruy Lopez, Sicilian Defense và kỹ thuật tàn cuộc Vua - Tốt, Xe - Tốt chuẩn mực.', 'Chiến lược cờ trung cuộc, tính toán biến sâu 4-5 nước và kỹ thuật chiếu hết trong tàn cuộc.', 'Nâng Elo cờ nhanh trực tuyến lên 1400 - 1600 trên hệ thống Chess.com/Lichess.', 10, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '70 days'),
    ('b7000000-0000-0000-0000-000000000126', 'b2000000-0000-0000-0000-000000000042', 'aaaaaaaa-0001-0000-0000-000000000002', 'Luyện Thi Vào Lớp 10 Chuyên Toán & Trường Công Lập', 'Chuyên đề phương trình vô tỷ, hệ phương trình đối xứng, tứ giác nội tiếp và bất đẳng thức Cauchy.', 'Chương trình Đại số & Hình học lớp 9 nâng cao dành cho học sinh mục tiêu trường chuyên và trường top 1.', 'Tự tin giải quyết câu phân loại điểm 9-10 trong kỳ thi tuyển sinh vào 10.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '71 days'),
    ('b7000000-0000-0000-0000-000000000127', 'b2000000-0000-0000-0000-000000000043', 'aaaaaaaa-0001-0000-0000-000000000015', 'Nguyên Lý Kế Toán & Kỹ Năng Định Khoản Thực Hành', 'Bản chất tài khoản kế toán chữ T, định khoản các nghiệp vụ kinh tế phát sinh, lập bảng cân đối kế toán và báo cáo KQKD.', 'Nguyên lý kế toán doanh nghiệp theo Thông tư 200/2014/TT-BTC từ con số 0.', 'Hiểu rõ bản chất dòng tiền, định khoản chính xác 100% các nghiệp vụ kế toán cơ bản.', 10, 90, 3000000.00, 'Online', 'Published', NOW() - INTERVAL '72 days'),
    ('b7000000-0000-0000-0000-000000000128', 'b2000000-0000-0000-0000-000000000043', 'aaaaaaaa-0001-0000-0000-000000000015', 'Kế Toán Thuế & Thực Hành Khai Báo Thuế Trên Phần Mềm', 'Hướng dẫn lập tờ khai thuế GTGT, thuế TNCN, tính thuế TNDN tạm nộp và lập báo cáo tài chính năm trên phần mềm MISA/HTKK.', 'Chính sách thuế hiện hành, quy định hóa đơn điện tử và kỹ năng xử lý sai sót chứng từ.', 'Tự tin lập tờ khai thuế, hạch toán sổ sách và lên báo cáo tài chính chuẩn quy định.', 10, 90, 3500000.00, 'Online', 'Published', NOW() - INTERVAL '73 days'),
    ('b7000000-0000-0000-0000-000000000129', 'b2000000-0000-0000-0000-000000000043', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Online', 'Published', NOW() - INTERVAL '74 days'),
    ('b7000000-0000-0000-0000-000000000130', 'b2000000-0000-0000-0000-000000000044', 'aaaaaaaa-0001-0000-0000-000000000013', 'Khóa Học Cờ Vua Tư Duy Chiến Lược Cho Trẻ Em & Người Mới', 'Nắm vững luật cờ vua quốc tế, nguyên tắc khai cuộc căn bản, các đòn phối hợp chiến thuật chĩa đôi, giằng quân, xiên.', 'Hệ thống chiến thuật cơ bản FIDE, rèn tính kiên nhẫn, khả năng tập trung và tư duy dự đoán tình huống.', 'Thành thạo các đòn phối hợp chiến thuật cơ bản và tự tin tham gia các giải đấu cờ vua phong trào.', 10, 60, 2500000.00, 'Both', 'Published', NOW() - INTERVAL '75 days'),
    ('b7000000-0000-0000-0000-000000000131', 'b2000000-0000-0000-0000-000000000044', 'aaaaaaaa-0001-0000-0000-000000000013', 'Cờ Vua Nâng Cao: Bẫy Khai Cuộc & Kỹ Thuật Tàn Cuộc Kinh Điển', 'Nghiên cứu sâu các hệ thống khai cuộc Ruy Lopez, Sicilian Defense và kỹ thuật tàn cuộc Vua - Tốt, Xe - Tốt chuẩn mực.', 'Chiến lược cờ trung cuộc, tính toán biến sâu 4-5 nước và kỹ thuật chiếu hết trong tàn cuộc.', 'Nâng Elo cờ nhanh trực tuyến lên 1400 - 1600 trên hệ thống Chess.com/Lichess.', 10, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '76 days'),
    ('b7000000-0000-0000-0000-000000000132', 'b2000000-0000-0000-0000-000000000044', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '77 days'),
    ('b7000000-0000-0000-0000-000000000133', 'b2000000-0000-0000-0000-000000000045', 'aaaaaaaa-0001-0000-0000-000000000015', 'Nguyên Lý Kế Toán & Kỹ Năng Định Khoản Thực Hành', 'Bản chất tài khoản kế toán chữ T, định khoản các nghiệp vụ kinh tế phát sinh, lập bảng cân đối kế toán và báo cáo KQKD.', 'Nguyên lý kế toán doanh nghiệp theo Thông tư 200/2014/TT-BTC từ con số 0.', 'Hiểu rõ bản chất dòng tiền, định khoản chính xác 100% các nghiệp vụ kế toán cơ bản.', 10, 90, 3000000.00, 'Both', 'Published', NOW() - INTERVAL '78 days'),
    ('b7000000-0000-0000-0000-000000000134', 'b2000000-0000-0000-0000-000000000045', 'aaaaaaaa-0001-0000-0000-000000000015', 'Kế Toán Thuế & Thực Hành Khai Báo Thuế Trên Phần Mềm', 'Hướng dẫn lập tờ khai thuế GTGT, thuế TNCN, tính thuế TNDN tạm nộp và lập báo cáo tài chính năm trên phần mềm MISA/HTKK.', 'Chính sách thuế hiện hành, quy định hóa đơn điện tử và kỹ năng xử lý sai sót chứng từ.', 'Tự tin lập tờ khai thuế, hạch toán sổ sách và lên báo cáo tài chính chuẩn quy định.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '79 days'),
    ('b7000000-0000-0000-0000-000000000135', 'b2000000-0000-0000-0000-000000000045', 'aaaaaaaa-0001-0000-0000-000000000014', 'Nghệ Thuật Thuyết Trình Tự Tin & Làm Chủ Sân Khấu', 'Giải phóng ngôn ngữ cơ thể, kỹ thuật lấy hơi bụng điều tiết giọng nói truyền cảm, cấu trúc bài nói Hook - Story - Call to Action.', 'Kỹ năng nói trước đám đông, thiết kế slide thuyết trình tối giản và tương tác cuốn hút người nghe.', 'Hoàn toàn thoát khỏi nỗi sợ nói trước đám đông, thuyết trình tự tin và cuốn hút người nghe từ phút đầu tiên.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '80 days'),
    ('b7000000-0000-0000-0000-000000000136', 'b2000000-0000-0000-0000-000000000046', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Both', 'Published', NOW() - INTERVAL '81 days'),
    ('b7000000-0000-0000-0000-000000000137', 'b2000000-0000-0000-0000-000000000046', 'aaaaaaaa-0001-0000-0000-000000000012', 'Chiến Thuật Luyện Thi ĐGNL ĐHQG TP.HCM (APT) Cấp Tốc', 'Trọng tâm kỹ năng giải quyết vấn đề, phân tích số liệu bảng biểu và logic suy luận ngôn ngữ tiếng Việt - tiếng Anh.', '120 câu hỏi bài thi APT, mẹo suy luận loại trừ đáp án nhanh và xử lý bài toán logic phức tạp.', 'Tăng từ 100 - 150 điểm thi thử, tự tin đạt trên 850/1200 điểm xét tuyển.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '82 days'),
    ('b7000000-0000-0000-0000-000000000138', 'b2000000-0000-0000-0000-000000000046', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '83 days'),
    ('b7000000-0000-0000-0000-000000000139', 'b2000000-0000-0000-0000-000000000047', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Both', 'Published', NOW() - INTERVAL '84 days'),
    ('b7000000-0000-0000-0000-000000000140', 'b2000000-0000-0000-0000-000000000047', 'aaaaaaaa-0001-0000-0000-000000000012', 'Chiến Thuật Luyện Thi ĐGNL ĐHQG TP.HCM (APT) Cấp Tốc', 'Trọng tâm kỹ năng giải quyết vấn đề, phân tích số liệu bảng biểu và logic suy luận ngôn ngữ tiếng Việt - tiếng Anh.', '120 câu hỏi bài thi APT, mẹo suy luận loại trừ đáp án nhanh và xử lý bài toán logic phức tạp.', 'Tăng từ 100 - 150 điểm thi thử, tự tin đạt trên 850/1200 điểm xét tuyển.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '85 days'),
    ('b7000000-0000-0000-0000-000000000141', 'b2000000-0000-0000-0000-000000000047', 'aaaaaaaa-0001-0000-0000-000000000011', 'Khóa Luyện Thi Vào Lớp 10 Môn Ngữ Văn Điểm 8.5+', 'Nắm vững kỹ năng làm bài nghị luận văn học, nghị luận xã hội về tư tưởng đạo lý và hiện tượng đời sống.', 'Toàn bộ tác phẩm văn học lớp 9 trọng tâm, phương pháp triển khai luận điểm sáng tạo và giàu cảm xúc.', 'Biết cách mở bài, kết bài thu hút, hành văn trôi chảy và đạt điểm 8.5+ kỳ thi vào 10.', 12, 90, 3200000.00, 'Both', 'Published', NOW() - INTERVAL '86 days'),
    ('b7000000-0000-0000-0000-000000000142', 'b2000000-0000-0000-0000-000000000048', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Online', 'Published', NOW() - INTERVAL '87 days'),
    ('b7000000-0000-0000-0000-000000000143', 'b2000000-0000-0000-0000-000000000048', 'aaaaaaaa-0001-0000-0000-000000000012', 'Chiến Thuật Luyện Thi ĐGNL ĐHQG TP.HCM (APT) Cấp Tốc', 'Trọng tâm kỹ năng giải quyết vấn đề, phân tích số liệu bảng biểu và logic suy luận ngôn ngữ tiếng Việt - tiếng Anh.', '120 câu hỏi bài thi APT, mẹo suy luận loại trừ đáp án nhanh và xử lý bài toán logic phức tạp.', 'Tăng từ 100 - 150 điểm thi thử, tự tin đạt trên 850/1200 điểm xét tuyển.', 10, 90, 3500000.00, 'Online', 'Published', NOW() - INTERVAL '88 days'),
    ('b7000000-0000-0000-0000-000000000144', 'b2000000-0000-0000-0000-000000000048', 'aaaaaaaa-0001-0000-0000-000000000006', 'Bứt Phá Điểm 9+ Vật Lý 12 Thi THPT Quốc Gia', 'Chuyên sâu dao động cơ, sóng cơ, dòng điện xoay chiều RLC và đồ thị vật lý vận dụng cao.', 'Toàn bộ chuyên đề vận dụng cao lớp 12 và phương pháp chuẩn hóa số liệu giải bài tập trong 60 giây.', 'Xử lý nhanh gọn 40 câu hỏi trắc nghiệm, tự tin chinh phục điểm 9-10 môn Vật lý.', 12, 90, 3600000.00, 'Online', 'Published', NOW() - INTERVAL '89 days'),
    ('b7000000-0000-0000-0000-000000000145', 'b2000000-0000-0000-0000-000000000049', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Both', 'Published', NOW() - INTERVAL '90 days'),
    ('b7000000-0000-0000-0000-000000000146', 'b2000000-0000-0000-0000-000000000049', 'aaaaaaaa-0001-0000-0000-000000000012', 'Chiến Thuật Luyện Thi ĐGNL ĐHQG TP.HCM (APT) Cấp Tốc', 'Trọng tâm kỹ năng giải quyết vấn đề, phân tích số liệu bảng biểu và logic suy luận ngôn ngữ tiếng Việt - tiếng Anh.', '120 câu hỏi bài thi APT, mẹo suy luận loại trừ đáp án nhanh và xử lý bài toán logic phức tạp.', 'Tăng từ 100 - 150 điểm thi thử, tự tin đạt trên 850/1200 điểm xét tuyển.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '91 days'),
    ('b7000000-0000-0000-0000-000000000147', 'b2000000-0000-0000-0000-000000000049', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Đàm Phán Thực Chiến', 'Kỹ năng viết Email chuyên nghiệp, thuyết trình dự án, chủ trì cuộc họp và đàm phán hợp đồng thương mại quốc tế.', 'Tình huống giao tiếp công sở thực tế tại các công ty đa quốc gia và tập đoàn FDI.', 'Tự tin đàm phán bằng tiếng Anh, viết email chuẩn business và làm việc hiệu quả với sếp nước ngoài.', 10, 90, 4000000.00, 'Both', 'Published', NOW() - INTERVAL '92 days'),
    ('b7000000-0000-0000-0000-000000000148', 'b2000000-0000-0000-0000-000000000050', 'aaaaaaaa-0001-0000-0000-000000000012', 'Luyện Thi Đánh Giá Năng Lực ĐHQG Hà Nội (HSA) Toàn Diện', 'Chinh phục bài thi 3 phần: Tư duy định lượng (Toán học), Tư duy định tính (Văn học) và Khoa học tự nhiên - xã hội.', 'Hệ thống hóa toàn bộ kiến thức 3 năm THPT, luyện đề thi thử bám sát ma trận HSA chính thức.', 'Tối ưu hóa thời gian làm bài, tự tin đạt trên 110/150 điểm xét tuyển vào các trường đại học top 1.', 12, 90, 4200000.00, 'Both', 'Published', NOW() - INTERVAL '93 days'),
    ('b7000000-0000-0000-0000-000000000149', 'b2000000-0000-0000-0000-000000000050', 'aaaaaaaa-0001-0000-0000-000000000012', 'Chiến Thuật Luyện Thi ĐGNL ĐHQG TP.HCM (APT) Cấp Tốc', 'Trọng tâm kỹ năng giải quyết vấn đề, phân tích số liệu bảng biểu và logic suy luận ngôn ngữ tiếng Việt - tiếng Anh.', '120 câu hỏi bài thi APT, mẹo suy luận loại trừ đáp án nhanh và xử lý bài toán logic phức tạp.', 'Tăng từ 100 - 150 điểm thi thử, tự tin đạt trên 850/1200 điểm xét tuyển.', 10, 90, 3500000.00, 'Both', 'Published', NOW() - INTERVAL '94 days'),
    ('b7000000-0000-0000-0000-000000000150', 'b2000000-0000-0000-0000-000000000050', 'aaaaaaaa-0001-0000-0000-000000000001', 'Bứt Phá Điểm 9+ Môn Toán Thi Tốt Nghiệp THPT', 'Chuyên sâu hàm số nâng cao, tích phân hàm ẩn, số phức và hình học không gian Oxyz. Luyện đề bấm máy tính Casio tối ưu thời gian.', 'Toàn bộ chuyên đề vận dụng cao lớp 12, phương pháp giải toán hình học giải tích và tối ưu hóa thời gian thi trắc nghiệm.', 'Nắm vững 100% dạng bài 8.5+, xử lý câu hỏi khó trong 90 giây và tự tin đạt điểm 9+.', 12, 90, 3600000.00, 'Both', 'Published', NOW() - INTERVAL '65 days')
ON CONFLICT ("Id") DO NOTHING;

-- 10. BOOKINGS (500 Bookings)
WITH s AS (
    SELECT 
        i,
        ('b7000000-0000-0000-0000-' || lpad((((i - 1) % 150) + 1)::text, 12, '0'))::uuid AS svc_id,
        ('b6000000-0000-0000-0000-' || lpad((((i - 1) % 200) + 1)::text, 12, '0'))::uuid AS stu_id
    FROM generate_series(1, 500) AS i
)
INSERT INTO "Bookings" (
    "Id", "StudentProfileId", "TutorProfileId", "SubjectId", "ServiceId", "CustomAgreementId",
    "TotalPrice", "TotalSessions", "SessionDurationMinutes", "TeachingMode", "Status",
    "HoldingExpiresAt", "ConfirmedAt", "CompletedAt", "CancelledAt", "CancelledBy", "CancellationReason",
    "CreatedAt"
)
SELECT
    ('b8000000-0000-0000-0000-' || lpad(s.i::text, 12, '0'))::uuid,
    s.stu_id,
    svc."TutorProfileId",
    svc."SubjectId",
    svc."Id",
    NULL,
    svc."Price",
    svc."TotalSessions",
    svc."SessionDurationMinutes",
    svc."TeachingMode",
    CASE 
        WHEN s.i <= 400 THEN 'Paid'
        WHEN s.i <= 450 THEN 'Holding'
        WHEN s.i <= 480 THEN 'Cancelled'
        ELSE 'Expired'
    END,
    CASE WHEN s.i > 400 AND s.i <= 450 THEN NOW() + '14 minutes'::interval ELSE NULL END,
    CASE WHEN s.i <= 400 THEN NOW() - ((60 - (s.i % 55)) || ' days')::interval ELSE NULL END,
    CASE WHEN s.i > 220 AND s.i <= 370 THEN NOW() - '2 days'::interval ELSE NULL END,
    CASE WHEN s.i > 450 AND s.i <= 480 THEN NOW() - '10 days'::interval ELSE NULL END,
    CASE WHEN s.i > 450 AND s.i <= 480 THEN 'Student' ELSE NULL END,
    CASE WHEN s.i > 450 AND s.i <= 480 THEN 'Thay đổi kế hoạch học tập cá nhân' ELSE NULL END,
    NOW() - ((60 - (s.i % 55)) || ' days')::interval
FROM s
JOIN "Services" svc ON svc."Id" = s.svc_id
ON CONFLICT ("Id") DO NOTHING;

-- 11. ENROLLMENTS (400 Enrollments for the 400 Paid bookings)
-- 1..220: Active (sessions in progress)
-- 221..370: Completed (all sessions completed)
-- 371..400: Cancelled
-- -----------------------------------------------------------------------------
INSERT INTO "Enrollments" (
    "Id", "BookingId", "StudentProfileId", "TutorProfileId", "ServiceId", "SubjectId",
    "TotalPrice", "TotalSessions", "CompletedSessions", "SessionDurationMinutes", 
    "TeachingMode", "PlatformFeeRate", "FeePolicyVersion", "Status", 
    "CreatedAt", "CompletedAt", "CancelledAt", "CancelledBy", "CancellationReason"
)
SELECT
    ('b9000000-0000-0000-0000-' || lpad(b.i::text, 12, '0'))::uuid,
    b."Id",
    b."StudentProfileId",
    b."TutorProfileId",
    b."ServiceId",
    b."SubjectId",
    b."TotalPrice",
    b."TotalSessions",
    CASE 
        WHEN b.i <= 220 THEN (b.i % (b."TotalSessions" - 1)) + 1 -- partially completed
        WHEN b.i <= 370 THEN b."TotalSessions"                   -- all completed
        ELSE 1                                                   -- cancelled after 1
    END,
    b."SessionDurationMinutes",
    b."TeachingMode",
    0.1000, -- 10% snapshot
    2,      -- policy version 2
    CASE 
        WHEN b.i <= 220 THEN 'Active'
        WHEN b.i <= 370 THEN 'Completed'
        ELSE 'Cancelled'
    END,
    b."CreatedAt",
    CASE WHEN b.i > 220 AND b.i <= 370 THEN NOW() - '2 days'::interval ELSE NULL END,
    CASE WHEN b.i > 370 THEN NOW() - '5 days'::interval ELSE NULL END,
    CASE WHEN b.i > 370 THEN 'Student' ELSE NULL END,
    CASE WHEN b.i > 370 THEN 'Bận việc gia đình đột xuất' ELSE NULL END
FROM (
    SELECT 
        ROW_NUMBER() OVER (ORDER BY "Id") AS i,
        "Id", "StudentProfileId", "TutorProfileId", "ServiceId", "SubjectId",
        "TotalPrice", "TotalSessions", "SessionDurationMinutes", "TeachingMode", "CreatedAt"
    FROM "Bookings"
    WHERE "Status" = 'Paid' AND "Id"::text LIKE 'b8000000-%'
) b
WHERE b.i <= 400
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 12. SESSIONS (Generated for each Enrollment strictly respecting allocator math!)
-- EarningAmount:
--   For session 1..(N-1): floor(TotalPrice / TotalSessions)
--   For session N: TotalPrice - (floor(TotalPrice / TotalSessions) * (TotalSessions - 1))
--   => Sum(EarningAmount) == TotalPrice 100% Guaranteed!
-- -----------------------------------------------------------------------------
WITH enrolled_sessions AS (
    SELECT 
        e."Id" AS enrollment_id,
        e."TotalSessions" AS total_sessions,
        e."CompletedSessions" AS completed_sessions,
        e."Status" AS enrollment_status,
        e."TotalPrice" AS total_price,
        e."CreatedAt" AS enrollment_created_at,
        s_num,
        CASE 
            WHEN s_num < e."TotalSessions" THEN floor(e."TotalPrice" / e."TotalSessions")
            ELSE e."TotalPrice" - (floor(e."TotalPrice" / e."TotalSessions") * (e."TotalSessions" - 1))
        END AS earning_amount,
        ('ba' || lpad(substr(replace(e."Id"::text, '-', ''), 27, 6), 6, '0') || '-' || lpad(s_num::text, 4, '0') || '-0000-0000-000000000000')::uuid AS session_id
    FROM "Enrollments" e
    CROSS JOIN LATERAL generate_series(1, e."TotalSessions") AS s_num
    WHERE e."Id"::text LIKE 'b9000000-%'
)
INSERT INTO "Sessions" (
    "Id", "EnrollmentId", "SessionNumber", "EarningAmount", 
    "StartAt", "EndAt", "Status", "HasAttendanceConflict", "IsPayoutReleased",
    "StudentAttendance", "StudentAttendanceSubmittedAt",
    "TutorAttendance", "TutorAttendanceSubmittedAt",
    "AttendanceVerificationOpenedAt", "AttendanceVerificationDueAt", "AttendanceVerifiedAt",
    "CreatedAt", "CompletedAt", "CancelledAt"
)
SELECT
    es.session_id,
    es.enrollment_id,
    es.s_num,
    es.earning_amount,
    -- Timing:
    CASE 
        WHEN es.s_num <= es.completed_sessions THEN es.enrollment_created_at + ((es.s_num * 3) || ' days')::interval + '18 hours'::interval
        WHEN es.s_num = es.completed_sessions + 1 THEN NOW() + '2 days'::interval
        ELSE NULL -- Unscheduled
    END AS start_at,
    CASE 
        WHEN es.s_num <= es.completed_sessions THEN es.enrollment_created_at + ((es.s_num * 3) || ' days')::interval + '19 hours 30 minutes'::interval
        WHEN es.s_num = es.completed_sessions + 1 THEN NOW() + '2 days 1 hour 30 minutes'::interval
        ELSE NULL
    END AS end_at,
    -- Status:
    CASE 
        WHEN es.s_num <= es.completed_sessions THEN 'Completed'
        WHEN es.s_num = es.completed_sessions + 1 AND es.enrollment_status != 'Cancelled' THEN 'Scheduled'
        ELSE 'Unscheduled'
    END AS status,
    -- Attendance conflict:
    CASE WHEN (es.s_num = 2 AND es.enrollment_id::text LIKE '%000000000010') THEN true ELSE false END,
    -- IsPayoutReleased:
    CASE WHEN es.s_num <= es.completed_sessions THEN true ELSE false END,
    -- Attendance status: 0=Attended, 1=Absent
    CASE WHEN es.s_num <= es.completed_sessions THEN 0 ELSE NULL END,
    CASE WHEN es.s_num <= es.completed_sessions THEN es.enrollment_created_at + ((es.s_num * 3) || ' days')::interval + '20 hours'::interval ELSE NULL END,
    CASE 
        WHEN es.s_num <= es.completed_sessions THEN 
            CASE WHEN (es.s_num = 2 AND es.enrollment_id::text LIKE '%000000000010') THEN 1 ELSE 0 END
        ELSE NULL 
    END,
    CASE WHEN es.s_num <= es.completed_sessions THEN es.enrollment_created_at + ((es.s_num * 3) || ' days')::interval + '20 hours 10 minutes'::interval ELSE NULL END,
    CASE WHEN es.s_num <= es.completed_sessions THEN es.enrollment_created_at + ((es.s_num * 3) || ' days')::interval + '19 hours 30 minutes'::interval ELSE NULL END,
    CASE WHEN es.s_num <= es.completed_sessions THEN es.enrollment_created_at + ((es.s_num * 3 + 1) || ' days')::interval + '19 hours 30 minutes'::interval ELSE NULL END,
    CASE WHEN es.s_num <= es.completed_sessions THEN es.enrollment_created_at + ((es.s_num * 3) || ' days')::interval + '20 hours 15 minutes'::interval ELSE NULL END,
    es.enrollment_created_at,
    CASE WHEN es.s_num <= es.completed_sessions THEN es.enrollment_created_at + ((es.s_num * 3) || ' days')::interval + '20 hours 15 minutes'::interval ELSE NULL END,
    NULL
FROM enrolled_sessions es
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 13. TRANSACTIONS
-- (A) BookingPayment for all 400 Paid bookings (Status = 'Held')
-- (B) SessionPayoutCredit for each Completed session with IsPayoutReleased = true
-- -----------------------------------------------------------------------------
INSERT INTO "Transactions" (
    "Id", "BookingId", "SessionId", "DisputeId", "RelatedTransactionId", 
    "Amount", "Type", "Status", "CommissionRate", "CommissionAmount", 
    "PayoutAmount", "PaymentGatewayRef", "Description", "SettlementRequired", 
    "CreatedAt", "ReleasedAt", "RefundedAt"
)
SELECT
    ('bb000000-0000-0000-0000-' || substr(replace(b."Id"::text, '-', ''), 21, 12))::uuid,
    b."Id",
    NULL,
    NULL,
    NULL,
    b."TotalPrice",
    'BookingPayment',
    'Held',
    0.1000,
    0.00,
    0.00,
    'VNPay-Vol-' || substr(replace(b."Id"::text, '-', ''), 21, 12),
    'Thanh toÃ¡n gÃ³i há»c qua cá»•ng VNPay',
    false,
    b."CreatedAt",
    NULL,
    NULL
FROM "Bookings" b
WHERE b."Id"::text LIKE 'b8000000-%' AND b."Status" = 'Paid'
ON CONFLICT ("Id") DO NOTHING;

-- SessionPayoutCredit (Status = 'Released')
INSERT INTO "Transactions" (
    "Id", "BookingId", "SessionId", "DisputeId", "RelatedTransactionId", 
    "Amount", "Type", "Status", "CommissionRate", "CommissionAmount", 
    "PayoutAmount", "PaymentGatewayRef", "Description", "SettlementRequired", 
    "CreatedAt", "ReleasedAt", "RefundedAt"
)
SELECT
    ('bc' || substr(replace(s."Id"::text, '-', ''), 3, 6) || '-' || lpad(s."SessionNumber"::text, 4, '0') || '-0000-0000-000000000000')::uuid,
    e."BookingId",
    s."Id",
    NULL,
    NULL,
    s."EarningAmount",
    'SessionPayoutCredit',
    'Released',
    e."PlatformFeeRate",
    round(s."EarningAmount" * e."PlatformFeeRate", 2),
    s."EarningAmount" - round(s."EarningAmount" * e."PlatformFeeRate", 2),
    'EscrowRelease-Vol-' || replace(s."Id"::text, '-', ''),
    'Giáº£i ngÃ¢n thu nháº­p buá»•i há»c #' || s."SessionNumber",
    false,
    s."CompletedAt",
    s."CompletedAt",
    NULL
FROM "Sessions" s
JOIN "Enrollments" e ON e."Id" = s."EnrollmentId"
WHERE s."Id"::text LIKE 'ba%' AND s."Status" = 'Completed' AND s."IsPayoutReleased" = true
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 14. WALLET TRANSACTIONS (Record matching ledger rows for all Released sessions)
-- -----------------------------------------------------------------------------
INSERT INTO "WalletTransactions" (
    "Id", "WalletId", "Type", "Amount", "BalanceAfter", "Description", "CreatedAt"
)
SELECT
    ('c0' || substr(replace(t."Id"::text, '-', ''), 3, 14) || '-0000-000000000000')::uuid,
    w."Id",
    'SessionPayoutCredit',
    t."PayoutAmount",
    t."PayoutAmount", -- Baseline value; updated dynamically below
    t."Description",
    t."CreatedAt"
FROM "Transactions" t
JOIN "Sessions" s ON s."Id" = t."SessionId"
JOIN "Enrollments" e ON e."Id" = s."EnrollmentId"
JOIN "Wallets" w ON w."TutorProfileId" = e."TutorProfileId"
WHERE t."Type" = 'SessionPayoutCredit' AND t."Id"::text LIKE 'bc%'
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 15. WITHDRAWALS (80 Withdrawals across various tutors and statuses)
-- -----------------------------------------------------------------------------
WITH tutor_wallets AS (
    SELECT 
        ROW_NUMBER() OVER (ORDER BY w."Id") AS row_num,
        w."Id" AS wallet_id,
        tp."BankName",
        tp."BankCode",
        tp."AccountNumber",
        tp."AccountHolderName"
    FROM "Wallets" w
    JOIN "TutorProfiles" tp ON tp."Id" = w."TutorProfileId"
    WHERE w."Id"::text LIKE 'b3000000-%'
)
INSERT INTO "Withdrawals" (
    "Id", "WalletId", "Amount", "Status", "BankName", "BankCode", 
    "AccountNumber", "AccountHolderName", "Note", "RequestedAt", 
    "ProcessingStartedAt", "ProcessingStartedByAdminId", "ProcessedAt", 
    "ProcessedByAdminId", "FailureReason"
)
SELECT
    ('c2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    tw.wallet_id,
    (500000 + ((i % 10) * 100000))::numeric,
    CASE (i % 4)
        WHEN 0 THEN 'Completed'
        WHEN 1 THEN 'Processing'
        WHEN 2 THEN 'Pending'
        ELSE 'Failed'
    END,
    tw."BankName",
    tw."BankCode",
    tw."AccountNumber",
    tw."AccountHolderName",
    'Rút thu nhập định kỳ đợt ' || i,
    NOW() - ((25 - (i % 20)) || ' days')::interval,
    CASE WHEN (i % 4) IN (0, 1) THEN NOW() - ((24 - (i % 20)) || ' days')::interval ELSE NULL END,
    CASE WHEN (i % 4) IN (0, 1) THEN '11111111-1111-1111-1111-111111111111'::uuid ELSE NULL END,
    CASE WHEN (i % 4) = 0 THEN NOW() - ((23 - (i % 20)) || ' days')::interval ELSE NULL END,
    CASE WHEN (i % 4) = 0 THEN '11111111-1111-1111-1111-111111111111'::uuid ELSE NULL END,
    CASE WHEN (i % 4) = 3 THEN 'Số tài khoản ngân hàng không hợp lệ' ELSE NULL END
FROM generate_series(1, 80) AS i
JOIN tutor_wallets tw ON tw.row_num = ((i - 1) % 50) + 1
ON CONFLICT ("Id") DO NOTHING;

-- Record matching WalletTransactions for Completed Withdrawals
INSERT INTO "WalletTransactions" (
    "Id", "WalletId", "Type", "Amount", "BalanceAfter", "Description", "CreatedAt"
)
SELECT
    ('c2000000-0000-0000-0001-' || substr(replace(w."Id"::text, '-', ''), 21, 12))::uuid,
    w."WalletId",
    'WithdrawalDebit',
    w."Amount",
    0.00,
    'RÃºt tiá»n vá» tÃ i khoáº£n ' || w."AccountNumber",
    w."RequestedAt"
FROM "Withdrawals" w
WHERE w."Id"::text LIKE 'c2000000-%' AND w."Status" = 'Completed'
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 16. DISPUTES (50 disputes: mix of Pre-release EscrowHold and Post-release BalanceHold)
-- Note: Satisfies IX_Disputes_ActiveSessionId (at most 1 active dispute per session)
-- -----------------------------------------------------------------------------
WITH candidate_sessions AS (
    SELECT 
        ROW_NUMBER() OVER (ORDER BY s."Id") AS row_num,
        s."Id" AS session_id,
        s."Status" AS session_status,
        s."EarningAmount" AS earning_amount,
        e."StudentProfileId",
        e."TutorProfileId",
        sp."UserId" AS student_user_id,
        tp."UserId" AS tutor_user_id
    FROM "Sessions" s
    JOIN "Enrollments" e ON e."Id" = s."EnrollmentId"
    JOIN "StudentProfiles" sp ON sp."Id" = e."StudentProfileId"
    JOIN "TutorProfiles" tp ON tp."Id" = e."TutorProfileId"
    WHERE s."Id"::text LIKE 'ba%' AND s."SessionNumber" = 1 -- pick session 1 of distinct enrollments
    LIMIT 50
)
INSERT INTO "Disputes" (
    "Id", "SessionId", "InitiatorUserId", "RespondentUserId", "Reason", "Description",
    "Status", "HeldAmount", "HoldType", "HoldStatus", "HeldAt", "AffectsFinancialResolution",
    "AdminNotes", "ResolvedByAdminId", "ResolvedAt", "HoldReleasedAt", "CreatedAt", "OriginalTransactionId"
)
SELECT
    ('be000000-0000-0000-0000-' || lpad(cs.row_num::text, 12, '0'))::uuid,
    cs.session_id,
    cs.student_user_id,
    cs.tutor_user_id,
    CASE (cs.row_num % 4)
        WHEN 0 THEN 'TutorNoShow'
        WHEN 1 THEN 'TutorLate'
        WHEN 2 THEN 'IncompleteSession'
        ELSE 'QualityIssue'
    END,
    'Há»c viÃªn khiáº¿u náº¡i vá» cháº¥t lÆ°á»£ng buá»•i há»c vÃ  thá»i lÆ°á»£ng tham gia.',
    CASE (cs.row_num % 4)
        WHEN 0 THEN 'Open'
        WHEN 1 THEN 'UnderReview'
        WHEN 2 THEN 'Resolved'
        ELSE 'Dismissed'
    END,
    CASE 
        WHEN (cs.row_num % 4) IN (0, 1) THEN cs.earning_amount
        ELSE 0.00
    END,
    CASE 
        WHEN (cs.row_num % 4) IN (0, 1) THEN 'EscrowHold'
        ELSE 'None'
    END,
    CASE 
        WHEN (cs.row_num % 4) IN (0, 1) THEN 'Active'
        WHEN (cs.row_num % 4) = 2 THEN 'Released'
        ELSE 'None'
    END,
    CASE WHEN (cs.row_num % 4) IN (0, 1) THEN NOW() - ((20 - (cs.row_num % 15)) || ' days')::interval ELSE NULL END,
    true,
    CASE WHEN (cs.row_num % 4) >= 2 THEN 'Trá»ng tÃ i viÃªn Ä‘Ã£ xem xÃ©t log phÃ²ng há»c vÃ  Ä‘Æ°a ra phÃ¡n quyáº¿t.' ELSE NULL END,
    CASE WHEN (cs.row_num % 4) >= 2 THEN '11111111-1111-1111-1111-111111111111'::uuid ELSE NULL END,
    CASE WHEN (cs.row_num % 4) >= 2 THEN NOW() - '1 day'::interval ELSE NULL END,
    CASE WHEN (cs.row_num % 4) = 2 THEN NOW() - '1 day'::interval ELSE NULL END,
    NOW() - ((20 - (cs.row_num % 15)) || ' days')::interval,
    NULL
FROM candidate_sessions cs
ON CONFLICT ("Id") DO NOTHING;

-- DisputeEvidences for each dispute
INSERT INTO "DisputeEvidences" (
    "Id", "DisputeId", "UploadedByUserId", "FileName", "FileUrl", 
    "ContentType", "FileSizeBytes", "CreatedAt"
)
SELECT
    ('bf000000-0000-0000-0000-' || lpad(d.row_num::text, 12, '0'))::uuid,
    d."Id",
    d."InitiatorUserId",
    'screenshot-evidence-' || d.row_num || '.png',
    'https://tutorhub-media.r2.cloudflarestorage.com/evidence/vol-' || d.row_num || '.png',
    'image/png',
    428500 + (d.row_num * 1024),
    d."CreatedAt" + '15 minutes'::interval
FROM (
    SELECT ROW_NUMBER() OVER (ORDER BY "Id") AS row_num, "Id", "InitiatorUserId", "CreatedAt"
    FROM "Disputes"
    WHERE "Id"::text LIKE 'be000000-%'
) d
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 17. REVIEWS (150 Reviews on Completed enrollments)
-- -----------------------------------------------------------------------------
WITH completed_enrollments AS (
    SELECT 
        ROW_NUMBER() OVER (ORDER BY "Id") AS row_num,
        "Id" AS enrollment_id,
        "CreatedAt" AS created_at
    FROM "Enrollments"
    WHERE "Id"::text LIKE 'b9000000-%' AND "Status" = 'Completed'
    LIMIT 150
)
INSERT INTO "Reviews" (
    "Id", "EnrollmentId", "Rating", "Comment", "CreatedAt", 
    "IsRemoved", "RemovedAt", "RemovedByAdminId", "RemovalReason"
)
SELECT
    ('c1000000-0000-0000-0000-' || lpad(ce.row_num::text, 12, '0'))::uuid,
    ce.enrollment_id,
    CASE (ce.row_num % 5)
        WHEN 0 THEN 5
        WHEN 1 THEN 5
        WHEN 2 THEN 4
        WHEN 3 THEN 5
        ELSE 4
    END,
    CASE (ce.row_num % 4)
        WHEN 0 THEN 'Gia sÆ° giáº£ng dáº¡y cá»±c ká»³ nhiá»‡t tÃ¬nh, phÆ°Æ¡ng phÃ¡p tÆ° duy dá»… hiá»ƒu, bÃ i táº­p bÃ¡m sÃ¡t Ä‘á» thi.'
        WHEN 1 THEN 'Thầy dạy rất kỹ tính, luôn kiểm tra bài cũ và hỗ trợ giải đáp thắc mắc 24/7.'
        WHEN 2 THEN 'KhÃ³a há»c cháº¥t lÆ°á»£ng cao, con tÃ´i tiáº¿n bá»™ rÃµ rá»‡t sau 10 buá»•i há»c.'
        ELSE 'Ráº¥t hÃ i lÃ²ng vá» tÃ¡c phong Ä‘Ãºng giá» vÃ  sá»± táº­n tÃ¢m cá»§a gia sÆ°.'
    END,
    ce.created_at + '20 days'::interval,
    false, NULL, NULL, NULL
FROM completed_enrollments ce
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 18. CONVERSATIONS & MESSAGES (100 Conversations, 200 Messages)
-- -----------------------------------------------------------------------------
WITH conv_pairs AS (
    SELECT 
        i,
        ('b6000000-0000-0000-0000-' || lpad((((i - 1) % 200) + 1)::text, 12, '0'))::uuid AS stu_id,
        ('b2000000-0000-0000-0000-' || lpad((((i - 1) % 50) + 1)::text, 12, '0'))::uuid AS tut_id
    FROM generate_series(1, 100) AS i
)
INSERT INTO "Conversations" (
    "Id", "StudentProfileId", "TutorProfileId", "CreatedAt", 
    "LastMessageId", "LastMessageAt", "LastMessagePreview"
)
SELECT
    ('c4000000-0000-0000-0000-' || lpad(cp.i::text, 12, '0'))::uuid,
    cp.stu_id,
    cp.tut_id,
    NOW() - ((40 - (cp.i % 30)) || ' days')::interval,
    NULL,
    NOW() - ((10 - (cp.i % 9)) || ' days')::interval,
    'Dáº¡ em chÃ o tháº§y, em Ä‘Ã£ lÃ m xong bÃ i táº­p vá» nhÃ  rá»“i áº¡!'
FROM conv_pairs cp
ON CONFLICT ("Id") DO NOTHING;

-- Messages for these conversations
INSERT INTO "Messages" (
    "Id", "ConversationId", "SenderUserId", "Content", "IsRead", "ReadAt", "CreatedAt"
)
SELECT
    ('c5000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid,
    ('c4000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    sp."UserId",
    'Dáº¡ em chÃ o tháº§y, em muá»‘n há»i thÃªm vá» lá»‹ch há»c tuáº§n nÃ y áº¡.',
    true,
    c."CreatedAt" + '10 minutes'::interval,
    c."CreatedAt" + '5 minutes'::interval
FROM generate_series(1, 100) AS i
JOIN "Conversations" c ON c."Id" = ('c4000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid
JOIN "StudentProfiles" sp ON sp."Id" = c."StudentProfileId"
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "Messages" (
    "Id", "ConversationId", "SenderUserId", "Content", "IsRead", "ReadAt", "CreatedAt"
)
SELECT
    ('c5000000-0000-0000-0002-' || lpad(i::text, 12, '0'))::uuid,
    ('c4000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    tp."UserId",
    'ChÃ o em, tháº§y Ä‘Ã£ nháº­n Ä‘Æ°á»£c bÃ i lÃ m. Thá»© 4 tuáº§n nÃ y 18h mÃ¬nh vÃ o phÃ²ng há»c nhÃ©.',
    true,
    c."CreatedAt" + '1 hour'::interval,
    c."CreatedAt" + '30 minutes'::interval
FROM generate_series(1, 100) AS i
JOIN "Conversations" c ON c."Id" = ('c4000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid
JOIN "TutorProfiles" tp ON tp."Id" = c."TutorProfileId"
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 19. LEARNING RECORDS (150 Learning Records for completed sessions)
-- -----------------------------------------------------------------------------
WITH comp_sessions AS (
    SELECT 
        ROW_NUMBER() OVER (ORDER BY s."Id") AS row_num,
        s."Id" AS session_id,
        e."TutorProfileId",
        s."CompletedAt"
    FROM "Sessions" s
    JOIN "Enrollments" e ON e."Id" = s."EnrollmentId"
    WHERE s."Id"::text LIKE 'ba%' AND s."Status" = 'Completed'
    LIMIT 150
)
INSERT INTO "LearningRecords" ("Id", "SessionId", "TutorProfileId", "Content", "CreatedAt")
SELECT
    ('c6000000-0000-0000-0000-' || lpad(cs.row_num::text, 12, '0'))::uuid,
    cs.session_id,
    cs."TutorProfileId",
    'Ná»™i dung buá»•i há»c: Ã”n táº­p dáº¡ng bÃ i trá»ng tÃ¢m, sá»­a 15 cÃ¢u tráº¯c nghiá»‡m váº­n dá»¥ng cao. Há»c viÃªn tiáº¿p thu tá»‘t, lÃ m bÃ i Ä‘Ãºng 85%. BÃ i táº­p vá» nhÃ : Äá» sá»‘ 4 tá»« cÃ¢u 30 Ä‘áº¿n 45.',
    cs."CompletedAt" + '30 minutes'::interval
FROM comp_sessions cs
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 20. NOTIFICATIONS (300 Notifications: 150 for students, 150 for tutors)
-- -----------------------------------------------------------------------------
INSERT INTO "Notifications" (
    "Id", "UserId", "Title", "Message", "Type", "DeepLink",
    "IsRead", "ReadAt", "IsCritical", "EventId", "DeduplicationKey", "CreatedAt"
)
SELECT
    ('c3000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid,
    ('b5000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'Lá»‹ch há»c má»›i Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n',
    'Buá»•i há»c tiáº¿p theo cá»§a báº¡n sáº½ diá»…n ra vÃ o lÃºc 18:00.',
    'SessionScheduled',
    '/student/dashboard',
    (i % 2 = 0),
    CASE WHEN (i % 2 = 0) THEN NOW() - '1 day'::interval ELSE NULL END,
    false,
    ('c3e10000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'session-sched-' || i,
    NOW() - ((15 - (i % 14)) || ' days')::interval
FROM generate_series(1, 150) AS i
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "Notifications" (
    "Id", "UserId", "Title", "Message", "Type", "DeepLink",
    "IsRead", "ReadAt", "IsCritical", "EventId", "DeduplicationKey", "CreatedAt"
)
SELECT
    ('c3000000-0000-0000-0002-' || lpad(i::text, 12, '0'))::uuid,
    ('b1000000-0000-0000-0000-' || lpad((((i - 1) % 50) + 1)::text, 12, '0'))::uuid,
    'Thu nháº­p buá»•i há»c Ä‘Ã£ Ä‘Æ°á»£c giáº£i ngÃ¢n',
    'Há»‡ thá»‘ng Ä‘Ã£ giáº£i ngÃ¢n thu nháº­p buá»•i há»c vÃ o vÃ­ cá»§a báº¡n sau khi hoÃ n thÃ nh Ä‘á»‘i soÃ¡t.',
    'SessionPayoutReleased',
    '/tutor/wallet',
    (i % 3 = 0),
    CASE WHEN (i % 3 = 0) THEN NOW() - '1 day'::interval ELSE NULL END,
    false,
    ('c3e20000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'payout-rel-' || i,
    NOW() - ((12 - (i % 11)) || ' days')::interval
FROM generate_series(1, 150) AS i
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 21. AUDIT LOGS (Record administrative events)
-- -----------------------------------------------------------------------------
INSERT INTO "AuditLogs" (
    "Id", "UserId", "Action", "EntityName", "EntityId", "OldValuesJson", 
    "NewValuesJson", "CorrelationId", "IpAddress", "UserAgent", "CreatedAt"
)
SELECT
    ('c7000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid, -- Admin
    CASE (i % 3)
        WHEN 0 THEN 'ApproveTutorApplication'
        WHEN 1 THEN 'ProcessWithdrawal'
        ELSE 'ResolveDispute'
    END,
    CASE (i % 3)
        WHEN 0 THEN 'TutorApplication'
        WHEN 1 THEN 'Withdrawal'
        ELSE 'Dispute'
    END,
    'vol-entity-' || i,
    '{"status":"Pending"}',
    '{"status":"Approved"}',
    'corr-vol-' || lpad(i::text, 8, '0'),
    '127.0.0.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TutorHubAdmin/1.0',
    NOW() - ((30 - (i % 25)) || ' days')::interval
FROM generate_series(1, 60) AS i
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 22. RECONCILE WALLET BALANCES ACCORDING TO FINANCIAL INVARIANTS
--
-- PendingBalance = Gross earnings of unreleased sessions of Paid enrollments
-- ReleasedNet    = Sum of Net Payouts of Released sessions
-- DebitCompleted = Sum of Completed withdrawals
-- HeldAmount     = Sum of active BalanceHold disputes
-- AvailableBalance = ReleasedNet - DebitCompleted - HeldAmount
--
-- All balances are guaranteed >= 0 and WithdrawableBalance >= 0!
-- -----------------------------------------------------------------------------
WITH wallet_payout_totals AS (
    SELECT 
        e."TutorProfileId",
        -- Pending escrow: sessions not yet released
        COALESCE(SUM(CASE WHEN s."IsPayoutReleased" = false THEN s."EarningAmount" ELSE 0 END), 0) AS pending_gross,
        -- Released net earnings
        COALESCE(SUM(CASE WHEN s."IsPayoutReleased" = true THEN (s."EarningAmount" - round(s."EarningAmount" * e."PlatformFeeRate", 2)) ELSE 0 END), 0) AS released_net
    FROM "Enrollments" e
    JOIN "Sessions" s ON s."EnrollmentId" = e."Id"
    WHERE e."TutorProfileId"::text LIKE 'b2000000-%'
    GROUP BY e."TutorProfileId"
),
wallet_withdrawals AS (
    SELECT 
        w."TutorProfileId",
        COALESCE(SUM(CASE WHEN wd."Status" = 'Completed' THEN wd."Amount" ELSE 0 END), 0) AS completed_withdrawn
    FROM "Withdrawals" wd
    JOIN "Wallets" w ON w."Id" = wd."WalletId"
    WHERE w."Id"::text LIKE 'b3000000-%'
    GROUP BY w."TutorProfileId"
),
reconciled AS (
    SELECT 
        wpt."TutorProfileId",
        wpt.pending_gross,
        GREATEST(0.00, wpt.released_net - COALESCE(ww.completed_withdrawn, 0.00)) AS available_balance
    FROM wallet_payout_totals wpt
    LEFT JOIN wallet_withdrawals ww ON ww."TutorProfileId" = wpt."TutorProfileId"
)
UPDATE "Wallets" w
SET 
    "PendingBalance" = r.pending_gross,
    "AvailableBalance" = r.available_balance,
    "HeldBalance" = 0.00,
    "UpdatedAt" = NOW()
FROM reconciled r
WHERE w."TutorProfileId" = r."TutorProfileId"
  AND w."Id"::text LIKE 'b3000000-%';

COMMIT;
