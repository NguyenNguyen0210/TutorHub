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
-- -----------------------------------------------------------------------------
INSERT INTO "RefreshTokens" ("Id", "UserId", "Token", "ExpiresAt", "CreatedAt", "RevokedAt")
VALUES
    ('ba09ba09-0001-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'token_refresh_admin_001_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000002', '22222222-1111-1111-1111-111111111111', 'token_refresh_tutor_an_002_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000003', '33333333-1111-1111-1111-111111111111', 'token_refresh_tutor_bich_003_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000004', '44444444-1111-1111-1111-111111111111', 'token_refresh_tutor_nam_004_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000005', '44444444-2222-1111-1111-111111111111', 'token_refresh_tutor_ha_005_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000006', '44444444-3333-1111-1111-111111111111', 'token_refresh_tutor_quang_006_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000007', '44444444-4444-1111-1111-111111111111', 'token_refresh_tutor_mai_007_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000008', '55555555-1111-1111-1111-111111111111', 'token_refresh_student_tuan_008_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000009', '66666666-1111-1111-1111-111111111111', 'token_refresh_student_lan_009_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000010', '77777777-1111-1111-1111-111111111111', 'token_refresh_student_bad_010_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000011', '55555555-2222-1111-1111-111111111111', 'token_refresh_student_hung_011_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000012', '55555555-3333-1111-1111-111111111111', 'token_refresh_student_linh_012_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000013', '55555555-4444-1111-1111-111111111111', 'token_refresh_student_khoa_013_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000014', '55555555-5555-1111-1111-111111111111', 'token_refresh_student_thao_014_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL),
    ('ba09ba09-0001-0000-0000-000000000015', '55555555-6666-1111-1111-111111111111', 'token_refresh_student_duc_015_sample_1234567890abcdef', NOW() + INTERVAL '7 days', NOW(), NULL);

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
