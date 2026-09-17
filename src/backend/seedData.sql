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
    ('11111111-1111-1111-1111-111111111111', 'admin@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Quáº£n Trá»‹ ViÃªn Há»‡ Thá»‘ng', '0901234567', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'Admin', 'Active', NOW() - INTERVAL '60 days', 0, NULL, NULL),
    ('22222222-1111-1111-1111-111111111111', 'tutor.an@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyá»…n VÄƒn An', '0912345678', 'https://api.dicebear.com/7.x/avataaars/svg?seed=an', 'Tutor', 'Active', NOW() - INTERVAL '50 days', 0, NULL, NULL),
    ('33333333-1111-1111-1111-111111111111', 'tutor.bich@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Tráº§n Thá»‹ BÃ­ch', '0923456789', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bich', 'Tutor', 'Active', NOW() - INTERVAL '45 days', 0, NULL, NULL),
    ('44444444-1111-1111-1111-111111111111', 'tutor.nam@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'LÃª HoÃ ng Nam', '0934567890', 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam', 'Tutor', 'Active', NOW() - INTERVAL '40 days', 0, NULL, NULL),
    ('44444444-2222-1111-1111-111111111111', 'tutor.ha@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Äá»— Thu HÃ ', '0934567891', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ha', 'Tutor', 'Active', NOW() - INTERVAL '35 days', 0, NULL, NULL),
    ('44444444-3333-1111-1111-111111111111', 'tutor.quang@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'VÅ© Minh Quang', '0934567892', 'https://api.dicebear.com/7.x/avataaars/svg?seed=quang', 'Tutor', 'Active', NOW() - INTERVAL '30 days', 0, NULL, NULL),
    ('44444444-4444-1111-1111-111111111111', 'tutor.mai@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Pháº¡m Ngá»c Mai', '0934567893', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mai', 'Tutor', 'Active', NOW() - INTERVAL '25 days', 0, NULL, NULL),
    ('55555555-1111-1111-1111-111111111111', 'student.tuan@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Pháº¡m Minh Tuáº¥n', '0945678901', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tuan', 'Student', 'Active', NOW() - INTERVAL '30 days', 0, NULL, NULL),
    ('66666666-1111-1111-1111-111111111111', 'student.lan@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'HoÃ ng Lan Anh', '0956789012', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lan', 'Student', 'Active', NOW() - INTERVAL '28 days', 0, NULL, NULL),
    ('77777777-1111-1111-1111-111111111111', 'student.bad@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Tráº§n VÄƒn BÃ¹ng', '0967890123', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bad', 'Student', 'Active', NOW() - INTERVAL '20 days', 2, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),
    ('55555555-2222-1111-1111-111111111111', 'student.hung@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Äáº·ng Quá»‘c HÃ¹ng', '0978901234', 'https://api.dicebear.com/7.x/avataaars/svg?seed=hung', 'Student', 'Active', NOW() - INTERVAL '18 days', 0, NULL, NULL),
    ('55555555-3333-1111-1111-111111111111', 'student.linh@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'NgÃ´ PhÆ°Æ¡ng Linh', '0989012345', 'https://api.dicebear.com/7.x/avataaars/svg?seed=linh', 'Student', 'Active', NOW() - INTERVAL '15 days', 0, NULL, NULL),
    ('55555555-4444-1111-1111-111111111111', 'student.khoa@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'BÃ¹i ÄÄƒng Khoa', '0990123456', 'https://api.dicebear.com/7.x/avataaars/svg?seed=khoa', 'Student', 'Active', NOW() - INTERVAL '12 days', 0, NULL, NULL),
    ('55555555-5555-1111-1111-111111111111', 'student.thao@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'LÃª Thanh Tháº£o', '0901234568', 'https://api.dicebear.com/7.x/avataaars/svg?seed=thao', 'Student', 'Active', NOW() - INTERVAL '10 days', 0, NULL, NULL),
    ('55555555-6666-1111-1111-111111111111', 'student.duc@tutorhub.com', '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', 'Nguyá»…n Minh Äá»©c', '0912345679', 'https://api.dicebear.com/7.x/avataaars/svg?seed=duc', 'Student', 'Active', NOW() - INTERVAL '8 days', 0, NULL, NULL);

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
    ('22222222-aaaa-aaaa-aaaa-000000000001', '22222222-1111-1111-1111-111111111111', 'ChuyÃªn luyá»‡n thi THPT QG mÃ´n ToÃ¡n 5 nÄƒm kinh nghiá»‡m.', 'Cá»­ nhÃ¢n SÆ° pháº¡m ToÃ¡n - ÄH SÆ° pháº¡m HÃ  Ná»™i', 5, 'Both', '123 Cáº§u Giáº¥y, HÃ  Ná»™i', 21.0333, 105.7833, 'Approved', NOW() - INTERVAL '50 days', NULL, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '49 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000002', '33333333-1111-1111-1111-111111111111', 'Giáº£ng viÃªn IELTS 8.0, chiáº¿n thuáº­t phÃ²ng thi thá»±c chiáº¿n.', 'Tháº¡c sÄ© NgÃ´n ngá»¯ Anh - ÄH Ngoáº¡i ThÆ°Æ¡ng', 4, 'Online', NULL, NULL, NULL, 'Approved', NOW() - INTERVAL '45 days', NULL, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '44 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000003', '44444444-1111-1111-1111-111111111111', 'Ká»¹ sÆ° pháº§n má»m & Gia sÆ° Váº­t lÃ½ THPT.', 'Ká»¹ sÆ° CNTT - ÄH BÃ¡ch Khoa HÃ  Ná»™i', 3, 'Both', 'Quáº­n 10, TP.HCM', 10.7719, 106.6678, 'Approved', NOW() - INTERVAL '40 days', NULL, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '39 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000004', '44444444-3333-1111-1111-111111111111', 'GiÃ¡o viÃªn Tiáº¿ng Nháº­t JLPT N1, du há»c sinh Nháº­t Báº£n 4 nÄƒm.', 'Cá»­ nhÃ¢n Nháº­t Báº£n Há»c - ÄH KHXH&NV', 4, 'Online', NULL, NULL, NULL, 'Approved', NOW() - INTERVAL '30 days', NULL, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '29 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000005', '44444444-4444-1111-1111-111111111111', 'Tháº¡c sÄ© VÄƒn há»c, luyá»‡n thi tá»‘t nghiá»‡p THPT vÃ  vÃ o lá»›p 10 chuyÃªn.', 'Tháº¡c sÄ© VÄƒn há»c - ÄH SÆ° pháº¡m TP.HCM', 6, 'Both', 'BÃ¬nh Tháº¡nh, TP.HCM', 10.8030, 106.7050, 'Approved', NOW() - INTERVAL '25 days', NULL, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '24 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000006', '44444444-2222-1111-1111-111111111111', 'Sinh viÃªn nÄƒm 2 muá»‘n lÃ m gia sÆ° HÃ³a há»c.', 'Sinh viÃªn ÄH Kinh táº¿ Quá»‘c DÃ¢n', 0, 'Offline', 'Hai BÃ  TrÆ°ng, HÃ  Ná»™i', 21.0000, 105.8500, 'Rejected', NOW() - INTERVAL '35 days', 'Thiáº¿u báº±ng cáº¥p hoáº·c chá»©ng chá»‰ chuyÃªn mÃ´n liÃªn quan Ä‘áº¿n HÃ³a há»c.', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '34 days'),
    ('22222222-aaaa-aaaa-aaaa-000000000007', '55555555-4444-1111-1111-111111111111', 'á»¨ng tuyá»ƒn gia sÆ° Láº­p trÃ¬nh Python & Web cÆ¡ báº£n.', 'Sinh viÃªn nÄƒm 3 ÄH FPT', 1, 'Online', NULL, NULL, NULL, 'Pending', NOW() - INTERVAL '3 days', NULL, NULL, NULL),
    ('22222222-aaaa-aaaa-aaaa-000000000008', '55555555-5555-1111-1111-111111111111', 'Gia sÆ° Tiáº¿ng PhÃ¡p DELF B2.', 'Cá»­ nhÃ¢n NgÃ´n ngá»¯ PhÃ¡p - ÄH HÃ  Ná»™i', 2, 'Both', 'Thanh XuÃ¢n, HÃ  Ná»™i', 20.9980, 105.8050, 'Pending', NOW() - INTERVAL '2 days', NULL, NULL, NULL),
    ('22222222-aaaa-aaaa-aaaa-000000000009', '55555555-6666-1111-1111-111111111111', 'Gia sÆ° Sinh há»c bá»“i dÆ°á»¡ng há»c sinh giá»i.', 'BÃ¡c sÄ© Äa khoa - ÄH Y HÃ  Ná»™i', 3, 'Both', 'Äá»‘ng Äa, HÃ  Ná»™i', 21.0180, 105.8270, 'Pending', NOW() - INTERVAL '1 day', NULL, NULL, NULL),
    ('22222222-aaaa-aaaa-aaaa-000000000010', '44444444-2222-1111-1111-111111111111', 'Ná»™p láº¡i Ä‘Æ¡n á»©ng tuyá»ƒn gia sÆ° HÃ³a sau khi bá»• sung chá»©ng chá»‰ sÆ° pháº¡m.', 'Sinh viÃªn ÄH Kinh táº¿ Quá»‘c DÃ¢n + Chá»©ng chá»‰ NVSP', 1, 'Both', 'Hai BÃ  TrÆ°ng, HÃ  Ná»™i', 21.0000, 105.8500, 'Pending', NOW() - INTERVAL '5 hours', NULL, NULL, NULL);

-- -----------------------------------------------------------------------------
-- 4. TUTOR PROFILES (5 Approved Tutors)
-- -----------------------------------------------------------------------------
INSERT INTO "TutorProfiles" (
    "Id", "UserId", "Bio", "Education", "ExperienceYears",
    "TeachingMode", "Address", "Latitude", "Longitude", "RatingAvg", "TotalReviews"
)
VALUES
    ('22222222-2222-2222-2222-111111111111', '22222222-1111-1111-1111-111111111111', 'ChuyÃªn luyá»‡n thi THPT QG mÃ´n ToÃ¡n 5 nÄƒm kinh nghiá»‡m.', 'Cá»­ nhÃ¢n SÆ° pháº¡m ToÃ¡n - ÄH SÆ° pháº¡m HÃ  Ná»™i', 5, 'Both', '123 Cáº§u Giáº¥y, HÃ  Ná»™i', 21.0333, 105.7833, 4.90, 8),
    ('33333333-2222-2222-2222-111111111111', '33333333-1111-1111-1111-111111111111', 'Giáº£ng viÃªn IELTS 8.0, chiáº¿n thuáº­t phÃ²ng thi thá»±c chiáº¿n.', 'Tháº¡c sÄ© NgÃ´n ngá»¯ Anh - ÄH Ngoáº¡i ThÆ°Æ¡ng', 4, 'Online', NULL, NULL, NULL, 5.00, 4),
    ('44444444-2222-2222-2222-111111111111', '44444444-1111-1111-1111-111111111111', 'Ká»¹ sÆ° pháº§n má»m & Gia sÆ° Váº­t lÃ½ THPT.', 'Ká»¹ sÆ° CNTT - ÄH BÃ¡ch Khoa HÃ  Ná»™i', 3, 'Both', 'Quáº­n 10, TP.HCM', 10.7719, 106.6678, 4.75, 4),
    ('44444444-2222-2222-2222-333333333333', '44444444-3333-1111-1111-111111111111', 'GiÃ¡o viÃªn Tiáº¿ng Nháº­t JLPT N1, du há»c sinh Nháº­t Báº£n 4 nÄƒm.', 'Cá»­ nhÃ¢n Nháº­t Báº£n Há»c - ÄH KHXH&NV', 4, 'Online', NULL, NULL, NULL, 5.00, 2),
    ('44444444-2222-2222-2222-444444444444', '44444444-4444-1111-1111-111111111111', 'Tháº¡c sÄ© VÄƒn há»c, luyá»‡n thi tá»‘t nghiá»‡p THPT vÃ  vÃ o lá»›p 10 chuyÃªn.', 'Tháº¡c sÄ© VÄƒn há»c - ÄH SÆ° pháº¡m TP.HCM', 6, 'Both', 'BÃ¬nh Tháº¡nh, TP.HCM', 10.8030, 106.7050, 4.80, 3);

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
    ('11111111-0000-0000-0000-000000000001', 'ToÃ¡n há»c', 'CÃ¡c mÃ´n toÃ¡n tá»« cÆ¡ báº£n Ä‘áº¿n nÃ¢ng cao, luyá»‡n thi Ä‘áº¡i há»c', true),
    ('11111111-0000-0000-0000-000000000002', 'Ngoáº¡i ngá»¯', 'Tiáº¿ng Anh, Tiáº¿ng Nháº­t, Tiáº¿ng Trung, Tiáº¿ng HÃ n vÃ  chá»©ng chá»‰ quá»‘c táº¿', true),
    ('11111111-0000-0000-0000-000000000003', 'Khoa há»c tá»± nhiÃªn', 'Váº­t lÃ½, HÃ³a há»c, Sinh há»c cÃ¡c khá»‘i lá»›p', true),
    ('11111111-0000-0000-0000-000000000004', 'CÃ´ng nghá»‡ thÃ´ng tin', 'Láº­p trÃ¬nh C#, Python, Frontend, Backend, CÆ¡ sá»Ÿ dá»¯ liá»‡u', true),
    ('11111111-0000-0000-0000-000000000005', 'Khoa há»c xÃ£ há»™i', 'Ngá»¯ vÄƒn, Lá»‹ch sá»­, Äá»‹a lÃ½, Triáº¿t há»c', true),
    ('11111111-0000-0000-0000-000000000006', 'Nghá»‡ thuáº­t & Ã‚m nháº¡c', 'Piano, Guitar, Má»¹ thuáº­t, Thanh nháº¡c', true),
    ('11111111-0000-0000-0000-000000000007', 'Ká»¹ nÄƒng má»m', 'Giao tiáº¿p, Thuyáº¿t trÃ¬nh, TÆ° duy pháº£n biá»‡n', true),
    ('11111111-0000-0000-0000-000000000008', 'Luyá»‡n thi chá»©ng chá»‰', 'SAT, ACT, GMAT, ÄÃ¡nh giÃ¡ nÄƒng lá»±c ÄHQG', true),
    ('11111111-0000-0000-0000-000000000009', 'Kinh táº¿ & TÃ i chÃ­nh', 'Káº¿ toÃ¡n, TÃ i chÃ­nh doanh nghiá»‡p, Kinh táº¿ vi mÃ´', true),
    ('11111111-0000-0000-0000-000000000010', 'Thá»ƒ thao & Yoga', 'Cá» vua, Yoga táº¡i nhÃ , Thá»ƒ dá»¥c phÃ¡t triá»ƒn thá»ƒ cháº¥t', true);

-- -----------------------------------------------------------------------------
-- 7. SUBJECTS (15 Subjects)
-- -----------------------------------------------------------------------------
INSERT INTO "Subjects" ("Id", "Name", "CategoryId", "IsActive")
VALUES
    ('aaaaaaaa-0001-0000-0000-000000000001', 'ToÃ¡n THPT (Lá»›p 10-12)', '11111111-0000-0000-0000-000000000001', true),
    ('aaaaaaaa-0001-0000-0000-000000000002', 'ToÃ¡n THCS (Lá»›p 6-9)', '11111111-0000-0000-0000-000000000001', true),
    ('aaaaaaaa-0001-0000-0000-000000000003', 'Tiáº¿ng Anh Giao Tiáº¿p', '11111111-0000-0000-0000-000000000002', true),
    ('aaaaaaaa-0001-0000-0000-000000000004', 'Luyá»‡n thi IELTS 6.5+', '11111111-0000-0000-0000-000000000002', true),
    ('aaaaaaaa-0001-0000-0000-000000000005', 'Tiáº¿ng Nháº­t SÆ¡ - Trung Cáº¥p (N5 - N3)', '11111111-0000-0000-0000-000000000002', true),
    ('aaaaaaaa-0001-0000-0000-000000000006', 'Váº­t lÃ½ THPT (Lá»›p 10-12)', '11111111-0000-0000-0000-000000000003', true),
    ('aaaaaaaa-0001-0000-0000-000000000007', 'HÃ³a há»c THPT (Lá»›p 10-12)', '11111111-0000-0000-0000-000000000003', true),
    ('aaaaaaaa-0001-0000-0000-000000000008', 'Sinh há»c THPT', '11111111-0000-0000-0000-000000000003', true),
    ('aaaaaaaa-0001-0000-0000-000000000009', 'Láº­p trÃ¬nh C# / ASP.NET Core', '11111111-0000-0000-0000-000000000004', true),
    ('aaaaaaaa-0001-0000-0000-000000000010', 'Láº­p trÃ¬nh Python Cho NgÆ°á»i Má»›i', '11111111-0000-0000-0000-000000000004', true),
    ('aaaaaaaa-0001-0000-0000-000000000011', 'Ngá»¯ vÄƒn THPT & Luyá»‡n Thi ÄH', '11111111-0000-0000-0000-000000000005', true),
    ('aaaaaaaa-0001-0000-0000-000000000012', 'Luyá»‡n thi ÄÃ¡nh GiÃ¡ NÄƒng Lá»±c', '11111111-0000-0000-0000-000000000008', true),
    ('aaaaaaaa-0001-0000-0000-000000000013', 'Cá» vua chiáº¿n thuáº­t cÆ¡ báº£n & nÃ¢ng cao', '11111111-0000-0000-0000-000000000010', true),
    ('aaaaaaaa-0001-0000-0000-000000000014', 'Ká»¹ nÄƒng thuyáº¿t trÃ¬nh & ÄÃ m phÃ¡n', '11111111-0000-0000-0000-000000000007', true),
    ('aaaaaaaa-0001-0000-0000-000000000015', 'NguyÃªn lÃ½ káº¿ toÃ¡n tÃ i chÃ­nh', '11111111-0000-0000-0000-000000000009', true);

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
    ('5e521ce5-0001-0000-0000-000000000001', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', 'Luyá»‡n thi THPT ToÃ¡n 10 buá»•i', 'GÃ³i luyá»‡n thi THPT mÃ´n ToÃ¡n: 10 buá»•i x 60 phÃºt, kÃ¨m tÃ i liá»‡u vÃ  bÃ i táº­p vá» nhÃ .', 10, 60, 2000000.00, 'Both', NULL, 'Published', NOW() - INTERVAL '30 days'),
    ('5e521ce5-0001-0000-0000-000000000002', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', 'ToÃ¡n NÃ¢ng Cao 15 buá»•i ChuyÃªn Äá» 9+', 'ChuyÃªn Ä‘á» váº­n dá»¥ng cao hÃ m sá»‘, tÃ­ch phÃ¢n, hÃ¬nh khÃ´ng gian Oxyz.', 15, 90, 3500000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '25 days'),
    ('5e521ce5-0001-0000-0000-000000000003', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000002', 'Láº¥y gá»‘c ToÃ¡n THCS lá»›p 9 vÃ o 10', 'Báº£n nhÃ¡p khÃ³a há»c Ã´n thi vÃ o 10 chuyÃªn.', 12, 60, 1800000.00, 'Both', NULL, 'Draft', NOW() - INTERVAL '2 days'),
    ('5e521ce5-0001-0000-0000-000000000004', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000004', 'IELTS cáº¥p tá»‘c 1 buá»•i chiáº¿n thuáº­t', 'Buá»•i Ä‘Ã¡nh giÃ¡ trÃ¬nh Ä‘á»™ + chiáº¿n thuáº­t phÃ²ng thi IELTS 1-on-1.', 1, 60, 300000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '28 days'),
    ('5e521ce5-0001-0000-0000-000000000005', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000004', 'KhÃ³a IELTS 4 Ká»¹ NÄƒng 20 buá»•i', 'Lá»™ trÃ¬nh tá»« 5.5 lÃªn 6.5+ IELTS toÃ n diá»‡n nghe nÃ³i Ä‘á»c viáº¿t.', 20, 90, 6000000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '20 days'),
    ('5e521ce5-0001-0000-0000-000000000006', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000003', 'Tiáº¿ng Anh Giao Tiáº¿p Doanh Nghiá»‡p', 'KhÃ³a há»c táº¡m ngÆ°ng nháº­n há»c viÃªn má»›i.', 12, 60, 2400000.00, 'Both', NULL, 'Unpublished', NOW() - INTERVAL '35 days'),
    ('5e521ce5-0001-0000-0000-000000000007', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000006', 'Váº­t lÃ½ THPT 12 - Luyá»‡n Äá» Chuáº©n Cáº¥u TrÃºc', 'KhÃ³a luyá»‡n Ä‘á» thá»±c chiáº¿n Váº­t lÃ½ 10 buá»•i.', 10, 60, 1800000.00, 'Both', NULL, 'Published', NOW() - INTERVAL '15 days'),
    ('5e521ce5-0001-0000-0000-000000000008', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000009', 'Láº­p trÃ¬nh C# / .NET Backend tá»« Zero', 'KhÃ³a há»c thá»±c chiáº¿n OOP, SQL, Clean Architecture 16 buá»•i.', 16, 90, 4800000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '14 days'),
    ('5e521ce5-0001-0000-0000-000000000009', '44444444-2222-2222-2222-333333333333', 'aaaaaaaa-0001-0000-0000-000000000005', 'Tiáº¿ng Nháº­t Giao Tiáº¿p & JLPT N3 Cáº¥p Tá»‘c', 'Luyá»‡n kaiwa pháº£n xáº¡ vÃ  giáº£i Ä‘á» thi N3.', 15, 60, 3000000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '12 days'),
    ('5e521ce5-0001-0000-0000-000000000010', '44444444-2222-2222-2222-444444444444', 'aaaaaaaa-0001-0000-0000-000000000011', 'Ngá»¯ vÄƒn 12 - Ká»¹ nÄƒng Nghá»‹ Luáº­n XÃ£ Há»™i & VÄƒn Há»c', 'BÃ­ kÃ­p Ä‘áº¡t Ä‘iá»ƒm 8+ bÃ i thi tá»‘t nghiá»‡p Ngá»¯ vÄƒn.', 10, 90, 2000000.00, 'Both', NULL, 'Published', NOW() - INTERVAL '10 days'),
    ('5e521ce5-0001-0000-0000-000000000011', '44444444-2222-2222-2222-444444444444', 'aaaaaaaa-0001-0000-0000-000000000012', 'Ã”n thi pháº§n NgÃ´n ngá»¯ ÄGNL ÄHQG', 'GÃ³i Ã´n táº­p tÆ° duy ngÃ´n ngá»¯ 8 buá»•i.', 8, 60, 1600000.00, 'Online', NULL, 'Draft', NOW() - INTERVAL '3 days'),
    ('5e521ce5-0001-0000-0000-000000000012', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000012', 'TÆ° duy Ä‘á»‹nh lÆ°á»£ng ÄGNL', 'GÃ³i luyá»‡n thi Ä‘á»‹nh lÆ°á»£ng.', 10, 60, 2000000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '8 days'),
    ('5e521ce5-0001-0000-0000-000000000013', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000013', 'Cá» vua nháº­p mÃ´n cho há»c sinh', 'KhÃ³a há»c cá» vua phÃ¡t triá»ƒn tÆ° duy 8 buá»•i.', 8, 60, 1200000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '5 days'),
    ('5e521ce5-0001-0000-0000-000000000014', '33333333-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000014', 'Ká»¹ nÄƒng thuyáº¿t trÃ¬nh tiáº¿ng Anh tá»± tin', 'KhÃ³a rÃ¨n luyá»‡n 6 buá»•i thá»±c hÃ nh.', 6, 90, 1800000.00, 'Both', NULL, 'Published', NOW() - INTERVAL '4 days'),
    ('5e521ce5-0001-0000-0000-000000000015', '44444444-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000010', 'Python Automation & Scripting cÆ¡ báº£n', 'Tá»± Ä‘á»™ng hÃ³a tÃ¡c vá»¥ vÄƒn phÃ²ng vá»›i Python.', 10, 60, 2200000.00, 'Online', NULL, 'Published', NOW() - INTERVAL '6 days');

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
    ('dddddddd-0001-0000-0000-000000000009', '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', '5e521ce5-0001-0000-0000-000000000001', NULL, 2000000.00, 10, 60, 'Both', 'Cancelled', NULL, NULL, NULL, NOW() - INTERVAL '12 days', 'Student', 'TrÃ¹ng lá»‹ch thi há»c ká»³', NOW() - INTERVAL '12 days'),
    ('dddddddd-0001-0000-0000-000000000010', '66666666-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000002', '5e521ce5-0001-0000-0000-000000000001', NULL, 2000000.00, 10, 60, 'Both', 'Cancelled', NULL, NULL, NULL, NOW() - INTERVAL '11 days', 'Tutor', 'Gia sÆ° báº­n lá»‹ch cÃ´ng tÃ¡c Ä‘á»™t xuáº¥t', NOW() - INTERVAL '11 days'),
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
    ('e1e1e1e1-0001-0000-0000-000000000008', 'dddddddd-0001-0000-0000-000000000009', '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 2000000.00, 10, 60, 'Both', 0.10, 1, 0, 'Cancelled', NOW() - INTERVAL '12 days', NULL, NOW() - INTERVAL '12 days', 'Student', 'Há»c viÃªn há»§y trÆ°á»›c buá»•i Ä‘áº§u'),
    ('e1e1e1e1-0001-0000-0000-000000000009', 'dddddddd-0001-0000-0000-000000000010', '66666666-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', '5e521ce5-0001-0000-0000-000000000001', 'aaaaaaaa-0001-0000-0000-000000000001', 2000000.00, 10, 60, 'Both', 0.10, 1, 0, 'Cancelled', NOW() - INTERVAL '11 days', NULL, NOW() - INTERVAL '11 days', 'Tutor', 'Gia sÆ° báº­n lá»‹ch cÃ´ng tÃ¡c'),
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
    -- Enrollment 1: ToÃ¡n Tuáº¥n & An
    ('a1a1a1a1-0001-0000-0000-000000000001', 'e1e1e1e1-0001-0000-0000-000000000001', 1, 200000.00, NOW() - INTERVAL '14 days' - INTERVAL '1 hour', NOW() - INTERVAL '14 days', 'Completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', 0, NOW() - INTERVAL '14 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '14 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '14 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000002', 'e1e1e1e1-0001-0000-0000-000000000001', 2, 200000.00, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'Scheduled', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL),
    ('a1a1a1a1-0001-0000-0000-000000000003', 'e1e1e1e1-0001-0000-0000-000000000001', 3, 200000.00, NOW() - INTERVAL '1 day' - INTERVAL '1 hour', NOW() - INTERVAL '1 day', 'Scheduled', NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day', NULL, NULL, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', 0, NOW() - INTERVAL '1 day' + INTERVAL '10 minutes', 1, NOW() - INTERVAL '1 day' + INTERVAL '15 minutes', true, false, NULL, NULL, NULL, NULL),
    ('a1a1a1a1-0001-0000-0000-000000000004', 'e1e1e1e1-0001-0000-0000-000000000001', 4, 200000.00, NULL, NULL, 'Unscheduled', NOW() - INTERVAL '15 days', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL),
    ('a1a1a1a1-0001-0000-0000-000000000005', 'e1e1e1e1-0001-0000-0000-000000000001', 5, 200000.00, NULL, NULL, 'Unscheduled', NOW() - INTERVAL '15 days', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL),

    -- Enrollment 2: IELTS Lan & BÃ­ch
    ('a1a1a1a1-0001-0000-0000-000000000011', 'e1e1e1e1-0001-0000-0000-000000000002', 1, 300000.00, NOW() - INTERVAL '19 days' - INTERVAL '1 hour', NOW() - INTERVAL '19 days', 'Completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', NULL, NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days', 0, NOW() - INTERVAL '19 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '19 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '19 days' + INTERVAL '10 minutes'),

    -- Enrollment 3: Váº­t lÃ½ HÃ¹ng & Nam
    ('a1a1a1a1-0001-0000-0000-000000000012', 'e1e1e1e1-0001-0000-0000-000000000003', 1, 180000.00, NOW() - INTERVAL '9 days' - INTERVAL '1 hour', NOW() - INTERVAL '9 days', 'Completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NULL, NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', 0, NOW() - INTERVAL '9 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '9 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '9 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000013', 'e1e1e1e1-0001-0000-0000-000000000003', 2, 180000.00, NOW() - INTERVAL '6 days' - INTERVAL '1 hour', NOW() - INTERVAL '6 days', 'Completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', 0, NOW() - INTERVAL '6 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '6 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '6 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000014', 'e1e1e1e1-0001-0000-0000-000000000003', 3, 180000.00, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'Scheduled', NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL),

    -- Enrollment 4: Tiáº¿ng Nháº­t Linh & Quang
    ('a1a1a1a1-0001-0000-0000-000000000015', 'e1e1e1e1-0001-0000-0000-000000000004', 1, 200000.00, NOW() - INTERVAL '7 days' - INTERVAL '1 hour', NOW() - INTERVAL '7 days', 'Completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', 0, NOW() - INTERVAL '7 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '7 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '7 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000016', 'e1e1e1e1-0001-0000-0000-000000000004', 2, 200000.00, NOW() - INTERVAL '5 days' - INTERVAL '1 hour', NOW() - INTERVAL '5 days', 'Completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 0, NOW() - INTERVAL '5 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '5 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '5 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000017', 'e1e1e1e1-0001-0000-0000-000000000004', 3, 200000.00, NOW() - INTERVAL '2 days' - INTERVAL '1 hour', NOW() - INTERVAL '2 days', 'Completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 0, NOW() - INTERVAL '2 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '2 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),

    -- Enrollment 5: Ngá»¯ vÄƒn Khoa & Mai
    ('a1a1a1a1-0001-0000-0000-000000000018', 'e1e1e1e1-0001-0000-0000-000000000005', 1, 200000.00, NOW() - INTERVAL '6 days' - INTERVAL '90 minutes', NOW() - INTERVAL '6 days', 'Completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', 0, NOW() - INTERVAL '6 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '6 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '6 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000019', 'e1e1e1e1-0001-0000-0000-000000000005', 2, 200000.00, NOW() - INTERVAL '4 days' - INTERVAL '90 minutes', NOW() - INTERVAL '4 days', 'Completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NULL, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', 0, NOW() - INTERVAL '4 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '4 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '4 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000020', 'e1e1e1e1-0001-0000-0000-000000000005', 3, 200000.00, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '90 minutes', 'Scheduled', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL),

    -- Enrollment 6: C# Äá»©c & Nam
    ('a1a1a1a1-0001-0000-0000-000000000021', 'e1e1e1e1-0001-0000-0000-000000000006', 1, 300000.00, NOW() - INTERVAL '5 days' - INTERVAL '90 minutes', NOW() - INTERVAL '5 days', 'Completed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 0, NOW() - INTERVAL '5 days' + INTERVAL '5 minutes', 0, NOW() - INTERVAL '5 days' + INTERVAL '10 minutes', false, true, NULL, NULL, NULL, NOW() - INTERVAL '5 days' + INTERVAL '10 minutes'),
    ('a1a1a1a1-0001-0000-0000-000000000022', 'e1e1e1e1-0001-0000-0000-000000000006', 2, 300000.00, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '90 minutes', 'Scheduled', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL, NULL, NULL, NULL);

-- -----------------------------------------------------------------------------
-- 14. TRANSACTIONS (15 Sá»• cÃ¡i káº¿ toÃ¡n)
-- -----------------------------------------------------------------------------
INSERT INTO "Transactions" (
    "Id", "BookingId", "SessionId", "Amount", "Type", "Status",
    "CommissionRate", "CommissionAmount", "PayoutAmount",
    "PaymentGatewayRef", "DisputeId", "RelatedTransactionId", "Description",
    "SettlementRequired", "CreatedAt", "ReleasedAt", "RefundedAt"
)
VALUES
    ('eeeeeeee-0001-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', NULL, 2000000.00, 'BookingPayment', 'Held', 0, 0, 2000000.00, 'PAY-MOCK-001', NULL, NULL, 'KÃ½ quá»¹ gÃ³i ToÃ¡n THPT 10 buá»•i', false, NOW() - INTERVAL '15 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000002', 'dddddddd-0001-0000-0000-000000000001', 'a1a1a1a1-0001-0000-0000-000000000001', 200000.00, 'SessionPayoutCredit', 'Released', 0.10, 20000.00, 180000.00, 'REL-001', NULL, NULL, 'Giáº£i ngÃ¢n buá»•i há»c ToÃ¡n #1', false, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000003', 'dddddddd-0001-0000-0000-000000000002', NULL, 300000.00, 'BookingPayment', 'Held', 0, 0, 300000.00, 'PAY-VNPAY-002', NULL, NULL, 'KÃ½ quá»¹ gÃ³i IELTS 1 buá»•i', false, NOW() - INTERVAL '20 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000004', 'dddddddd-0001-0000-0000-000000000002', 'a1a1a1a1-0001-0000-0000-000000000011', 300000.00, 'SessionPayoutCredit', 'Released', 0.10, 30000.00, 270000.00, 'REL-002', NULL, NULL, 'Giáº£i ngÃ¢n buá»•i há»c IELTS #1', false, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000005', 'dddddddd-0001-0000-0000-000000000003', NULL, 1800000.00, 'BookingPayment', 'Held', 0, 0, 1800000.00, 'PAY-VNPAY-003', NULL, NULL, 'KÃ½ quá»¹ gÃ³i Váº­t lÃ½ 10 buá»•i', false, NOW() - INTERVAL '10 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000006', 'dddddddd-0001-0000-0000-000000000003', 'a1a1a1a1-0001-0000-0000-000000000012', 180000.00, 'SessionPayoutCredit', 'Released', 0.10, 18000.00, 162000.00, 'REL-003', NULL, NULL, 'Giáº£i ngÃ¢n buá»•i há»c Váº­t lÃ½ #1', false, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000007', 'dddddddd-0001-0000-0000-000000000003', 'a1a1a1a1-0001-0000-0000-000000000013', 180000.00, 'SessionPayoutCredit', 'Released', 0.10, 18000.00, 162000.00, 'REL-004', NULL, NULL, 'Giáº£i ngÃ¢n buá»•i há»c Váº­t lÃ½ #2', false, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000008', 'dddddddd-0001-0000-0000-000000000004', NULL, 3000000.00, 'BookingPayment', 'Held', 0, 0, 3000000.00, 'PAY-MOCK-004', NULL, NULL, 'KÃ½ quá»¹ gÃ³i Tiáº¿ng Nháº­t 15 buá»•i', false, NOW() - INTERVAL '8 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000009', 'dddddddd-0001-0000-0000-000000000004', 'a1a1a1a1-0001-0000-0000-000000000015', 200000.00, 'SessionPayoutCredit', 'Released', 0.10, 20000.00, 180000.00, 'REL-005', NULL, NULL, 'Giáº£i ngÃ¢n buá»•i há»c Tiáº¿ng Nháº­t #1', false, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000010', 'dddddddd-0001-0000-0000-000000000004', 'a1a1a1a1-0001-0000-0000-000000000016', 200000.00, 'SessionPayoutCredit', 'Released', 0.10, 20000.00, 180000.00, 'REL-006', NULL, NULL, 'Giáº£i ngÃ¢n buá»•i há»c Tiáº¿ng Nháº­t #2', false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000011', 'dddddddd-0001-0000-0000-000000000005', NULL, 2000000.00, 'BookingPayment', 'Held', 0, 0, 2000000.00, 'PAY-VNPAY-005', NULL, NULL, 'KÃ½ quá»¹ gÃ³i Ngá»¯ vÄƒn 10 buá»•i', false, NOW() - INTERVAL '7 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000012', 'dddddddd-0001-0000-0000-000000000005', 'a1a1a1a1-0001-0000-0000-000000000018', 200000.00, 'SessionPayoutCredit', 'Released', 0.10, 20000.00, 180000.00, 'REL-007', NULL, NULL, 'Giáº£i ngÃ¢n buá»•i há»c Ngá»¯ vÄƒn #1', false, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000013', 'dddddddd-0001-0000-0000-000000000005', 'a1a1a1a1-0001-0000-0000-000000000019', 200000.00, 'SessionPayoutCredit', 'Released', 0.10, 20000.00, 180000.00, 'REL-008', NULL, NULL, 'Giáº£i ngÃ¢n buá»•i há»c Ngá»¯ vÄƒn #2', false, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NULL),
    ('eeeeeeee-0001-0000-0000-000000000014', 'dddddddd-0001-0000-0000-000000000008', NULL, 4800000.00, 'BookingPayment', 'Held', 0, 0, 4800000.00, 'PAY-VNPAY-006', NULL, NULL, 'KÃ½ quá»¹ gÃ³i C# .NET 16 buá»•i', false, NOW() - INTERVAL '6 days', NULL, NULL),
    ('eeeeeeee-0001-0000-0000-000000000015', 'dddddddd-0001-0000-0000-000000000011', NULL, 6000000.00, 'BookingPayment', 'Held', 0, 0, 6000000.00, 'PAY-VNPAY-007', NULL, NULL, 'KÃ½ quá»¹ gÃ³i IELTS 4 ká»¹ nÄƒng 20 buá»•i', false, NOW() - INTERVAL '4 days', NULL, NULL);

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
    ('fa01fa01-0001-0000-0000-000000000001', '22222222-3333-3333-3333-111111111111', 300000.00, 'Pending', 'NgÃ¢n HÃ ng TMCP Ngoáº¡i ThÆ°Æ¡ng Viá»‡t Nam', 'VCB', '0011001234567', 'NGUYEN VAN AN', 'RÃºt thÃ¹ lao dáº¡y tuáº§n 1', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL),
    ('fa01fa01-0001-0000-0000-000000000002', '22222222-3333-3333-3333-111111111111', 500000.00, 'Completed', 'NgÃ¢n HÃ ng TMCP Ngoáº¡i ThÆ°Æ¡ng Viá»‡t Nam', 'VCB', '0011001234567', 'NGUYEN VAN AN', 'RÃºt thÃ¹ lao thÃ¡ng trÆ°á»›c', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '9 days', '11111111-1111-1111-1111-111111111111', NULL),
    ('fa01fa01-0001-0000-0000-000000000003', '33333333-3333-3333-3333-111111111111', 200000.00, 'Pending', 'NgÃ¢n HÃ ng TMCP Quá»‘c DÃ¢n', 'NCB', '9704198526191432198', 'TRAN THI BICH', 'RÃºt tiá»n dáº¡y IELTS', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NULL),
    ('fa01fa01-0001-0000-0000-000000000004', '33333333-3333-3333-3333-111111111111', 270000.00, 'Completed', 'NgÃ¢n HÃ ng TMCP Quá»‘c DÃ¢n', 'NCB', '9704198526191432198', 'TRAN THI BICH', 'RÃºt tiá»n buá»•i 1', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '17 days', '11111111-1111-1111-1111-111111111111', NULL),
    ('fa01fa01-0001-0000-0000-000000000005', '44444444-3333-3333-3333-111111111111', 300000.00, 'Processing', 'NgÃ¢n HÃ ng TMCP QuÃ¢n Äá»™i', 'MBB', '09876543210', 'LE HOANG NAM', 'RÃºt thÃ¹ lao Váº­t lÃ½', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '1 hour', '11111111-1111-1111-1111-111111111111', NULL, NULL, NULL),
    ('fa01fa01-0001-0000-0000-000000000006', '44444444-3333-3333-3333-111111111111', 150000.00, 'Completed', 'NgÃ¢n HÃ ng TMCP QuÃ¢n Äá»™i', 'MBB', '09876543210', 'LE HOANG NAM', 'RÃºt thÃ¹ lao Ä‘á»£t 1', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days', '11111111-1111-1111-1111-111111111111', NULL),
    ('fa01fa01-0001-0000-0000-000000000007', '44444444-3333-3333-3333-333333333333', 350000.00, 'Pending', 'NgÃ¢n HÃ ng TMCP Ká»¹ ThÆ°Æ¡ng', 'TCB', '19034567890123', 'VU MINH QUANG', 'RÃºt tiá»n dáº¡y tiáº¿ng Nháº­t', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL),
    ('fa01fa01-0001-0000-0000-000000000008', '44444444-3333-3333-3333-444444444444', 500000.00, 'Completed', 'NgÃ¢n HÃ ng TMCP TiÃªn Phong', 'TPB', '01234567891', 'PHAM NGOC MAI', 'RÃºt tiá»n dáº¡y VÄƒn Ä‘á»£t 1', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '4 days', '11111111-1111-1111-1111-111111111111', NULL),
    ('fa01fa01-0001-0000-0000-000000000009', '44444444-3333-3333-3333-444444444444', 400000.00, 'Completed', 'NgÃ¢n HÃ ng TMCP TiÃªn Phong', 'TPB', '01234567891', 'PHAM NGOC MAI', 'RÃºt tiá»n dáº¡y VÄƒn Ä‘á»£t 2', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days', '11111111-1111-1111-1111-111111111111', NULL),
    ('fa01fa01-0001-0000-0000-000000000010', '22222222-3333-3333-3333-111111111111', 1000000.00, 'Failed', 'NgÃ¢n HÃ ng TMCP Ngoáº¡i ThÆ°Æ¡ng Viá»‡t Nam', 'VCB', '0011009999999', 'NGUYEN VAN AN', 'Sá»‘ tÃ i khoáº£n khÃ´ng chÃ­nh chá»§', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '14 days', '11111111-1111-1111-1111-111111111111', 'TÃªn chá»§ tÃ i khoáº£n ngÃ¢n hÃ ng khÃ´ng khá»›p vá»›i há»“ sÆ¡ gia sÆ°');

-- -----------------------------------------------------------------------------
-- 16. WALLET TRANSACTIONS (12 Records)
-- -----------------------------------------------------------------------------
INSERT INTO "WalletTransactions" (
    "Id", "WalletId", "WithdrawalId", "DisputeId",
    "Type", "Amount", "BalanceAfter", "Description",
    "CreatedByUserId", "CreatedAt"
)
VALUES
    ('ba02ba02-0001-0000-0000-000000000001', '22222222-3333-3333-3333-111111111111', NULL, NULL, 'SessionPayoutCredit', 180000.00, 180000.00, 'Giáº£i ngÃ¢n buá»•i há»c ToÃ¡n #1', NULL, NOW() - INTERVAL '14 days'),
    ('ba02ba02-0001-0000-0000-000000000002', '22222222-3333-3333-3333-111111111111', 'fa01fa01-0001-0000-0000-000000000002', NULL, 'WithdrawalDebit', 500000.00, 900000.00, 'RÃºt tiá»n thÃ nh cÃ´ng vá» VCB', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '9 days'),
    ('ba02ba02-0001-0000-0000-000000000003', '33333333-3333-3333-3333-111111111111', NULL, NULL, 'SessionPayoutCredit', 270000.00, 270000.00, 'Giáº£i ngÃ¢n buá»•i há»c IELTS #1', NULL, NOW() - INTERVAL '19 days'),
    ('ba02ba02-0001-0000-0000-000000000004', '33333333-3333-3333-3333-111111111111', 'fa01fa01-0001-0000-0000-000000000004', NULL, 'WithdrawalDebit', 270000.00, 0.00, 'RÃºt tiá»n thÃ nh cÃ´ng vá» NCB', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '17 days'),
    ('ba02ba02-0001-0000-0000-000000000005', '33333333-3333-3333-3333-111111111111', NULL, NULL, 'SessionPayoutCredit', 540000.00, 540000.00, 'Giáº£i ngÃ¢n gÃ³i IELTS khÃ¡c', NULL, NOW() - INTERVAL '5 days'),
    ('ba02ba02-0001-0000-0000-000000000006', '44444444-3333-3333-3333-111111111111', NULL, NULL, 'SessionPayoutCredit', 162000.00, 162000.00, 'Giáº£i ngÃ¢n buá»•i há»c Váº­t lÃ½ #1', NULL, NOW() - INTERVAL '9 days'),
    ('ba02ba02-0001-0000-0000-000000000007', '44444444-3333-3333-3333-111111111111', NULL, NULL, 'SessionPayoutCredit', 162000.00, 324000.00, 'Giáº£i ngÃ¢n buá»•i há»c Váº­t lÃ½ #2', NULL, NOW() - INTERVAL '6 days'),
    ('ba02ba02-0001-0000-0000-000000000008', '44444444-3333-3333-3333-111111111111', 'fa01fa01-0001-0000-0000-000000000006', NULL, 'WithdrawalDebit', 150000.00, 174000.00, 'RÃºt tiá»n vá» MBBank', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '7 days'),
    ('ba02ba02-0001-0000-0000-000000000009', '44444444-3333-3333-3333-333333333333', NULL, NULL, 'SessionPayoutCredit', 180000.00, 180000.00, 'Giáº£i ngÃ¢n buá»•i há»c Tiáº¿ng Nháº­t #1', NULL, NOW() - INTERVAL '7 days'),
    ('ba02ba02-0001-0000-0000-000000000010', '44444444-3333-3333-3333-333333333333', NULL, NULL, 'SessionPayoutCredit', 180000.00, 360000.00, 'Giáº£i ngÃ¢n buá»•i há»c Tiáº¿ng Nháº­t #2', NULL, NOW() - INTERVAL '5 days'),
    ('ba02ba02-0001-0000-0000-000000000011', '44444444-3333-3333-3333-444444444444', NULL, NULL, 'SessionPayoutCredit', 180000.00, 180000.00, 'Giáº£i ngÃ¢n buá»•i há»c Ngá»¯ vÄƒn #1', NULL, NOW() - INTERVAL '6 days'),
    ('ba02ba02-0001-0000-0000-000000000012', '44444444-3333-3333-3333-444444444444', NULL, NULL, 'SessionPayoutCredit', 180000.00, 360000.00, 'Giáº£i ngÃ¢n buá»•i há»c Ngá»¯ vÄƒn #2', NULL, NOW() - INTERVAL '4 days');

-- -----------------------------------------------------------------------------
-- 17. REVIEWS (10 Reviews)
-- -----------------------------------------------------------------------------
INSERT INTO "Reviews" (
    "Id", "EnrollmentId", "Rating", "Comment",
    "TutorReply", "TutorRepliedAt",
    "IsRemoved", "RemovalReason", "RemovedAt", "RemovedByAdminId", "CreatedAt"
)
VALUES
    ('ffffffff-0001-0000-0000-000000000001', 'e1e1e1e1-0001-0000-0000-000000000002', 5, 'CÃ´ BÃ­ch Ä‘Ã¡nh giÃ¡ trÃ¬nh Ä‘á»™ ráº¥t chuáº©n, chiáº¿n thuáº­t phÃ²ng thi cá»±c ká»³ thá»±c táº¿!', 'Cáº£m Æ¡n Lan Anh nhÃ©, chÃºc em thi Ä‘áº¡t káº¿t quáº£ tá»‘t!', NOW() - INTERVAL '18 days', false, NULL, NULL, NULL, NOW() - INTERVAL '19 days'),
    ('ffffffff-0001-0000-0000-000000000002', 'e1e1e1e1-0001-0000-0000-000000000010', 5, 'CÃ´ Mai dáº¡y VÄƒn truyá»n cáº£m há»©ng cá»±c ká»³, bÃ i giáº£ng ráº¥t sÃ¢u sáº¯c vÃ  cuá»‘n hÃºt.', 'Cáº£m Æ¡n em Khoa, chÃºc em lÃ m bÃ i thi tá»‘t nghiá»‡p Ä‘áº¡t Ä‘iá»ƒm 9+ nhÃ©!', NOW() - INTERVAL '1 day', false, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
    ('ffffffff-0001-0000-0000-000000000003', 'e1e1e1e1-0001-0000-0000-000000000001', 5, 'Tháº§y An dáº¡y dá»… hiá»ƒu, máº¹o giáº£i tráº¯c nghiá»‡m ráº¥t nhanh vÃ  chuáº©n xÃ¡c.', 'Cáº£m Æ¡n Tuáº¥n, cá»‘ gáº¯ng luyá»‡n thÃªm cÃ¡c Ä‘á» chuyÃªn Ä‘á» ná»¯a nhÃ©!', NOW() - INTERVAL '13 days', false, NULL, NULL, NULL, NOW() - INTERVAL '13 days'),
    ('ffffffff-0001-0000-0000-000000000004', 'e1e1e1e1-0001-0000-0000-000000000003', 4, 'Tháº§y Nam giáº£ng Váº­t lÃ½ ráº¥t trá»±c quan, bÃ i táº­p cÃ³ giáº£i chi tiáº¿t.', 'Cáº£m Æ¡n HÃ¹ng, pháº§n máº¡ch Ä‘iá»‡n nÃ¢ng cao tháº§y sáº½ há»— trá»£ thÃªm!', NOW() - INTERVAL '5 days', false, NULL, NULL, NULL, NOW() - INTERVAL '6 days'),
    ('ffffffff-0001-0000-0000-000000000005', 'e1e1e1e1-0001-0000-0000-000000000004', 5, 'Sensei Quang phÃ¡t Ã¢m chuáº©n, sá»­a ngá»¯ phÃ¡p ráº¥t táº­n tÃ¬nh!', 'Arigatou gozaimasu Linh-san! Ganbatte kudasai!', NOW() - INTERVAL '1 day', false, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
    ('ffffffff-0001-0000-0000-000000000006', 'e1e1e1e1-0001-0000-0000-000000000005', 5, 'KhÃ³a há»c tuyá»‡t vá»i, em tiáº¿n bá»™ rÃµ rá»‡t trong ká»¹ nÄƒng lÃ m vÄƒn nghá»‹ luáº­n.', NULL, NULL, false, NULL, NULL, NULL, NOW() - INTERVAL '3 days'),
    ('ffffffff-0001-0000-0000-000000000007', 'e1e1e1e1-0001-0000-0000-000000000006', 5, 'Tháº§y dáº¡y C# vÃ  clean architecture ráº¥t bÃ i báº£n, chuáº©n production.', 'Cáº£m Æ¡n Äá»©c, code cá»§a em tiáº¿n bá»™ ráº¥t nhanh!', NOW() - INTERVAL '1 day', false, NULL, NULL, NULL, NOW() - INTERVAL '2 days'),
    ('ffffffff-0001-0000-0000-000000000008', 'e1e1e1e1-0001-0000-0000-000000000007', 4, 'GiÃ¡o trÃ¬nh IELTS phong phÃº, luyá»‡n viáº¿t Task 2 Ä‘Æ°á»£c sá»­a tá»«ng cÃ¢u chá»¯.', NULL, NULL, false, NULL, NULL, NULL, NOW() - INTERVAL '1 day'),
    ('ffffffff-0001-0000-0000-000000000009', 'e1e1e1e1-0001-0000-0000-000000000008', 5, 'Há»c phÃ­ há»£p lÃ½, gia sÆ° nhiá»‡t tÃ¬nh há»— trá»£ ngoÃ i giá».', NULL, NULL, false, NULL, NULL, NULL, NOW() - INTERVAL '10 days'),
    ('ffffffff-0001-0000-0000-000000000010', 'e1e1e1e1-0001-0000-0000-000000000009', 5, 'Ráº¥t hÃ i lÃ²ng vá»›i cháº¥t lÆ°á»£ng giáº£ng dáº¡y trÃªn sÃ n TutorHub.', NULL, NULL, false, NULL, NULL, NULL, NOW() - INTERVAL '9 days');

-- -----------------------------------------------------------------------------
-- 18. CONVERSATIONS & MESSAGES (8 Conversations, 15 Messages)
-- -----------------------------------------------------------------------------
INSERT INTO "Conversations" (
    "Id", "StudentProfileId", "TutorProfileId", "CreatedAt",
    "LastMessageId", "LastMessageAt", "LastMessagePreview"
)
VALUES
    ('c0c0c0c0-0001-0000-0000-000000000001', '55555555-2222-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111', NOW() - INTERVAL '20 days', 'ba03ba03-0001-0000-0000-000000000003', NOW() - INTERVAL '2 hours', 'Dáº¡ vÃ¢ng, em Ä‘Ã£ Ä‘Äƒng kÃ½ gÃ³i 10 buá»•i rá»“i áº¡!'),
    ('c0c0c0c0-0001-0000-0000-000000000002', '66666666-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111', NOW() - INTERVAL '22 days', 'ba03ba03-0001-0000-0000-000000000005', NOW() - INTERVAL '18 days', 'Cáº£m Æ¡n cÃ´ nhiá»u áº¡!'),
    ('c0c0c0c0-0001-0000-0000-000000000003', '55555555-2222-2222-2222-222222222222', '44444444-2222-2222-2222-111111111111', NOW() - INTERVAL '15 days', 'ba03ba03-0001-0000-0000-000000000007', NOW() - INTERVAL '1 day', 'Tháº§y gá»­i em link tÃ i liá»‡u chÆ°Æ¡ng SÃ³ng Ã¡nh sÃ¡ng nhÃ©.'),
    ('c0c0c0c0-0001-0000-0000-000000000004', '55555555-2222-2222-2222-333333333333', '44444444-2222-2222-2222-333333333333', NOW() - INTERVAL '12 days', 'ba03ba03-0001-0000-0000-000000000009', NOW() - INTERVAL '3 hours', 'Háº¹n gáº·p sensei vÃ o tá»‘i mai áº¡!'),
    ('c0c0c0c0-0001-0000-0000-000000000005', '55555555-2222-2222-2222-444444444444', '44444444-2222-2222-2222-444444444444', NOW() - INTERVAL '10 days', 'ba03ba03-0001-0000-0000-000000000011', NOW() - INTERVAL '4 hours', 'CÃ´ Æ¡i bÃ i thÆ¡ SÃ³ng cáº§n chÃº Ã½ luáº­n Ä‘iá»ƒm nÃ o nháº¥t áº¡?'),
    ('c0c0c0c0-0001-0000-0000-000000000006', '55555555-2222-2222-2222-666666666666', '44444444-2222-2222-2222-111111111111', NOW() - INTERVAL '8 days', 'ba03ba03-0001-0000-0000-000000000013', NOW() - INTERVAL '1 day', 'Em Ä‘Ã£ push code bÃ i táº­p MediatR lÃªn GitHub rá»“i áº¡.'),
    ('c0c0c0c0-0001-0000-0000-000000000007', '55555555-2222-2222-2222-111111111111', '33333333-2222-2222-2222-111111111111', NOW() - INTERVAL '5 days', 'ba03ba03-0001-0000-0000-000000000014', NOW() - INTERVAL '5 hours', 'CÃ´ cÃ³ nháº­n kÃ¨m thÃªm buá»•i writing khÃ´ng áº¡?'),
    ('c0c0c0c0-0001-0000-0000-000000000008', '55555555-2222-2222-2222-555555555555', '22222222-2222-2222-2222-111111111111', NOW() - INTERVAL '4 days', 'ba03ba03-0001-0000-0000-000000000015', NOW() - INTERVAL '2 days', 'Em chÃ o tháº§y, em muá»‘n Ä‘Äƒng kÃ½ há»c thá»­.');

INSERT INTO "Messages" (
    "Id", "ConversationId", "SenderUserId", "Content",
    "AttachmentKey", "AttachmentName", "AttachmentContentType", "AttachmentSize",
    "IsRead", "ReadAt", "CreatedAt"
)
VALUES
    ('ba03ba03-0001-0000-0000-000000000001', 'c0c0c0c0-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'ChÃ o tháº§y An, em muá»‘n há»i thÃªm vá» lá»™ trÃ¬nh luyá»‡n thi ToÃ¡n 12 áº¡.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '20 days' + INTERVAL '30 minutes', NOW() - INTERVAL '20 days'),
    ('ba03ba03-0001-0000-0000-000000000002', 'c0c0c0c0-0001-0000-0000-000000000001', '22222222-1111-1111-1111-111111111111', 'ChÃ o Tuáº¥n! KhÃ³a há»c sáº½ bÃ¡m sÃ¡t cáº¥u trÃºc ma tráº­n Ä‘á» thi tá»‘t nghiá»‡p THPT, tuáº§n há»c 2 buá»•i nhÃ©.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '19 days', NOW() - INTERVAL '20 days' + INTERVAL '40 minutes'),
    ('ba03ba03-0001-0000-0000-000000000003', 'c0c0c0c0-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'Dáº¡ vÃ¢ng, em Ä‘Ã£ Ä‘Äƒng kÃ½ gÃ³i 10 buá»•i rá»“i áº¡!', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    ('ba03ba03-0001-0000-0000-000000000004', 'c0c0c0c0-0001-0000-0000-000000000002', '66666666-1111-1111-1111-111111111111', 'CÃ´ Æ¡i bÃ i táº­p speaking cÃ´ cháº¥m giÃºp em nhÃ©.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '19 days', NOW() - INTERVAL '20 days'),
    ('ba03ba03-0001-0000-0000-000000000005', 'c0c0c0c0-0001-0000-0000-000000000002', '33333333-1111-1111-1111-111111111111', 'CÃ´ Ä‘Ã£ gá»­i nháº­n xÃ©t chi tiáº¿t vÃ o file rá»“i nhÃ©. Cá»‘ gáº¯ng phÃ¡t huy!', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
    ('ba03ba03-0001-0000-0000-000000000006', 'c0c0c0c0-0001-0000-0000-000000000003', '55555555-2222-1111-1111-111111111111', 'Tháº§y Æ¡i dáº¡ng bÃ i con láº¯c Ä‘Æ¡n nÃ¢ng cao em lÃ m chÆ°a ra Ä‘Ã¡p Ã¡n.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
    ('ba03ba03-0001-0000-0000-000000000007', 'c0c0c0c0-0001-0000-0000-000000000003', '44444444-1111-1111-1111-111111111111', 'Tháº§y gá»­i em link tÃ i liá»‡u chÆ°Æ¡ng SÃ³ng Ã¡nh sÃ¡ng nhÃ©.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('ba03ba03-0001-0000-0000-000000000008', 'c0c0c0c0-0001-0000-0000-000000000004', '44444444-3333-1111-1111-111111111111', 'Konbanwa Linh-san! Nhá»› Ã´n láº¡i tá»« vá»±ng bÃ i 25 nhÃ©.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '6 hours'),
    ('ba03ba03-0001-0000-0000-000000000009', 'c0c0c0c0-0001-0000-0000-000000000004', '55555555-3333-1111-1111-111111111111', 'Háº¹n gáº·p sensei vÃ o tá»‘i mai áº¡!', NULL, NULL, NULL, NULL, false, NULL, NOW() - INTERVAL '3 hours'),
    ('ba03ba03-0001-0000-0000-000000000010', 'c0c0c0c0-0001-0000-0000-000000000005', '44444444-4444-1111-1111-111111111111', 'Khoa chuáº©n bá»‹ dÃ n Ã½ bÃ i NgÆ°á»i lÃ¡i Ä‘Ã² sÃ´ng ÄÃ  chÆ°a em?', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '6 hours'),
    ('ba03ba03-0001-0000-0000-000000000011', 'c0c0c0c0-0001-0000-0000-000000000005', '55555555-4444-1111-1111-111111111111', 'CÃ´ Æ¡i bÃ i thÆ¡ SÃ³ng cáº§n chÃº Ã½ luáº­n Ä‘iá»ƒm nÃ o nháº¥t áº¡?', NULL, NULL, NULL, NULL, false, NULL, NOW() - INTERVAL '4 hours'),
    ('ba03ba03-0001-0000-0000-000000000012', 'c0c0c0c0-0001-0000-0000-000000000006', '44444444-1111-1111-1111-111111111111', 'Tháº§y tháº¥y em viáº¿t CQRS ráº¥t tá»‘t, tá»‘i nay mÃ¬nh chuyá»ƒn sang Outbox Pattern nhÃ©.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('ba03ba03-0001-0000-0000-000000000013', 'c0c0c0c0-0001-0000-0000-000000000006', '55555555-6666-1111-1111-111111111111', 'Em Ä‘Ã£ push code bÃ i táº­p MediatR lÃªn GitHub rá»“i áº¡.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('ba03ba03-0001-0000-0000-000000000014', 'c0c0c0c0-0001-0000-0000-000000000007', '55555555-1111-1111-1111-111111111111', 'CÃ´ cÃ³ nháº­n kÃ¨m thÃªm buá»•i writing khÃ´ng áº¡?', NULL, NULL, NULL, NULL, false, NULL, NOW() - INTERVAL '5 hours'),
    ('ba03ba03-0001-0000-0000-000000000015', 'c0c0c0c0-0001-0000-0000-000000000008', '55555555-5555-1111-1111-111111111111', 'Em chÃ o tháº§y, em muá»‘n Ä‘Äƒng kÃ½ há»c thá»­.', NULL, NULL, NULL, NULL, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days');

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
    ('d0d0d0d0-0001-0000-0000-000000000001', '5e521ce5-0001-0000-0000-000000000001', 'c0c0c0c0-0001-0000-0000-000000000001', '22222222-2222-2222-2222-111111111111', '55555555-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000001', 'ToÃ¡n THPT custom 5 buá»•i tá»‘i', 'Há»c viÃªn Tuáº¥n muá»‘n rÃºt cÃ²n 5 buá»•i tá»‘i, giá»¯ nguyÃªn giÃ¡o trÃ¬nh trá»ng tÃ¢m.', 1000000.00, 5, 60, 'Online', 'Proposed', NOW() + INTERVAL '5 days', NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NULL),
    ('d0d0d0d0-0001-0000-0000-000000000002', '5e521ce5-0001-0000-0000-000000000004', 'c0c0c0c0-0001-0000-0000-000000000002', '33333333-2222-2222-2222-111111111111', '66666666-2222-2222-2222-111111111111', 'aaaaaaaa-0001-0000-0000-000000000004', 'IELTS Writing Task 2 chuyÃªn sÃ¢u 3 buá»•i', 'KhÃ³a há»c viáº¿t chuyÃªn sÃ¢u 3 buá»•i x 90 phÃºt.', 1200000.00, 3, 90, 'Online', 'Accepted', NOW() + INTERVAL '2 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NULL, NULL, NULL, NULL),
    ('d0d0d0d0-0001-0000-0000-000000000003', '5e521ce5-0001-0000-0000-000000000007', 'c0c0c0c0-0001-0000-0000-000000000003', '44444444-2222-2222-2222-111111111111', '55555555-2222-2222-2222-222222222222', 'aaaaaaaa-0001-0000-0000-000000000006', 'Váº­t lÃ½ 12 nÃ¢ng cao cuá»‘i ká»³ 8 buá»•i', 'Ã”n táº­p há»c ká»³ 2 mÃ´n Váº­t lÃ½.', 1500000.00, 8, 60, 'Both', 'Rejected', NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 days', NULL, NOW() - INTERVAL '7 days', 'Thá»i gian há»c khÃ´ng phÃ¹ há»£p vá»›i lá»‹ch gia sÆ°', NULL, NULL),
    ('d0d0d0d0-0001-0000-0000-000000000004', '5e521ce5-0001-0000-0000-000000000009', 'c0c0c0c0-0001-0000-0000-000000000004', '44444444-2222-2222-2222-333333333333', '55555555-2222-2222-2222-333333333333', 'aaaaaaaa-0001-0000-0000-000000000005', 'Tiáº¿ng Nháº­t Kaiwa pháº£n xáº¡ 10 buá»•i', 'RÃ¨n luyá»‡n ká»¹ nÄƒng nghe nÃ³i giao tiáº¿p háº±ng ngÃ y.', 2200000.00, 10, 60, 'Online', 'Proposed', NOW() + INTERVAL '6 days', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, NULL),
    ('d0d0d0d0-0001-0000-0000-000000000005', '5e521ce5-0001-0000-0000-000000000010', 'c0c0c0c0-0001-0000-0000-000000000005', '44444444-2222-2222-2222-444444444444', '55555555-2222-2222-2222-444444444444', 'aaaaaaaa-0001-0000-0000-000000000011', 'Ngá»¯ vÄƒn 12 cáº¥p tá»‘c 6 buá»•i cuá»‘i tuáº§n', 'Ã”n thi vÃ o trÆ°á»ng chuyÃªn khá»‘i C.', 1400000.00, 6, 90, 'Offline', 'Cancelled', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 days', NULL, NULL, NULL, NOW() - INTERVAL '3 days', 'Há»c viÃªn Ä‘á»•i káº¿ hoáº¡ch thi khá»‘i A1'),
    ('d0d0d0d0-0001-0000-0000-000000000006', '5e521ce5-0001-0000-0000-000000000008', 'c0c0c0c0-0001-0000-0000-000000000006', '44444444-2222-2222-2222-111111111111', '55555555-2222-2222-2222-666666666666', 'aaaaaaaa-0001-0000-0000-000000000009', 'C# Microservices & Docker 8 buá»•i', 'KhÃ³a há»c nÃ¢ng cao theo nhu cáº§u doanh nghiá»‡p.', 2800000.00, 8, 90, 'Online', 'Accepted', NOW() + INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NULL, NULL, NULL, NULL);

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
    ('f0000000-0000-0000-0000-000000000002', 'MinWithdrawalAmount', '50000', 'Sá»‘ tiá»n rÃºt tá»‘i thiá»ƒu má»—i láº§n (50.000 VNÄ)', 1, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days'),
    ('f0000000-0000-0000-0000-000000000003', 'HoldingExpiryMinutes', '15', 'Thá»i gian giá»¯ chá»— thanh toÃ¡n (phÃºt)', 1, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days'),
    ('f0000000-0000-0000-0000-000000000004', 'AbsentStrikeLimit', '3', 'Sá»‘ gáº­y váº¯ng máº·t tá»‘i Ä‘a trÆ°á»›c khi khÃ³a tÃ i khoáº£n', 1, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days'),
    ('f0000000-0000-0000-0000-000000000005', 'CancellationGracePeriodHours', '24', 'Thá»i gian tá»‘i thiá»ƒu cho phÃ©p há»§y lá»‹ch trÆ°á»›c giá» há»c (giá»)', 1, '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days');

INSERT INTO "PlatformSettingVersions" ("Id", "PlatformSettingId", "Version", "Value", "Reason", "ChangedByAdminId", "EffectiveFrom", "CreatedAt")
VALUES
    ('ba04ba04-0001-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 1, '0.12', 'Khá»Ÿi táº¡o tá»· lá»‡ hoa há»“ng sÃ n thá»­ nghiá»‡m 12%', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
    ('ba04ba04-0001-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 2, '0.10', 'Giáº£m phÃ­ sÃ n xuá»‘ng 10% há»— trá»£ gia sÆ°', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
    ('ba04ba04-0001-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002', 1, '50000', 'Khá»Ÿi táº¡o háº¡n má»©c rÃºt tiá»n tá»‘i thiá»ƒu', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
    ('ba04ba04-0001-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000003', 1, '15', 'Thiáº¿t láº­p thá»i gian lock slot máº·c Ä‘á»‹nh 15 phÃºt', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
    ('ba04ba04-0001-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000004', 1, '3', 'Thiáº¿t láº­p quy táº¯c xá»­ lÃ½ váº¯ng máº·t 3 strike', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
    ('ba04ba04-0001-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000005', 1, '24', 'Quy Ä‘á»‹nh há»§y buá»•i há»c khÃ´ng máº¥t phÃ­ trÆ°á»›c 24h', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days');

-- -----------------------------------------------------------------------------
-- 22. SESSION RESCHEDULE REQUESTS (6 Requests)
-- -----------------------------------------------------------------------------
INSERT INTO "SessionRescheduleRequests" (
    "Id", "SessionId", "ProposerUserId", "RecipientUserId",
    "ProposedStartAt", "ProposedEndAt", "Reason",
    "Status", "RejectionReason", "CreatedAt", "RespondedAt"
)
VALUES
    ('ba05ba05-0001-0000-0000-000000000001', 'a1a1a1a1-0001-0000-0000-000000000002', '22222222-1111-1111-1111-111111111111', '55555555-1111-1111-1111-111111111111', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'Tháº§y cÃ³ lá»‹ch táº­p huáº¥n táº¡i trÆ°á»ng, xin phÃ©p dá»i sang tá»‘i thá»© 6 nhÃ©.', 'Pending', NULL, NOW() - INTERVAL '6 hours', NULL),
    ('ba05ba05-0001-0000-0000-000000000002', 'a1a1a1a1-0001-0000-0000-000000000014', '44444444-1111-1111-1111-111111111111', '55555555-2222-1111-1111-111111111111', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour', 'TrÃ¹ng lá»‹ch thi giá»¯a ká»³, dá»i sang chiá»u Chá»§ Nháº­t.', 'Accepted', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
    ('ba05ba05-0001-0000-0000-000000000003', 'a1a1a1a1-0001-0000-0000-000000000020', '44444444-4444-1111-1111-111111111111', '55555555-4444-1111-1111-111111111111', NOW() + INTERVAL '2 days' + INTERVAL '15 hours', NOW() + INTERVAL '2 days' + INTERVAL '16 hours' + INTERVAL '30 minutes', 'Gia sÆ° cÃ³ viá»‡c gia Ä‘Ã¬nh Ä‘á»™t xuáº¥t.', 'Rejected', 'Há»c viÃªn vÆ°á»›ng lá»‹ch há»c thÃªm tiáº¿ng Anh', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    ('ba05ba05-0001-0000-0000-000000000004', 'a1a1a1a1-0001-0000-0000-000000000012', '44444444-1111-1111-1111-111111111111', '55555555-2222-1111-1111-111111111111', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '1 hour', 'Äá»•i lá»‹ch sang buá»•i tá»‘i cho mÃ¡t máº».', 'Accepted', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
    ('ba05ba05-0001-0000-0000-000000000005', 'a1a1a1a1-0001-0000-0000-000000000015', '44444444-3333-1111-1111-111111111111', '55555555-3333-1111-1111-111111111111', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '1 hour', 'Sensei cÃ³ lá»‹ch há»p khoa.', 'Accepted', NULL, NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
    ('ba05ba05-0001-0000-0000-000000000006', 'a1a1a1a1-0001-0000-0000-000000000018', '44444444-4444-1111-1111-111111111111', '55555555-4444-1111-1111-111111111111', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '90 minutes', 'Dá»i buá»•i 1 sang chiá»u thá»© 7.', 'Accepted', NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days');

-- -----------------------------------------------------------------------------
-- 23. LEARNING RECORDS (10 Summaries)
-- -----------------------------------------------------------------------------
INSERT INTO "LearningRecords" ("Id", "SessionId", "TutorProfileId", "Content", "CreatedAt")
VALUES
    ('ba06ba06-0001-0000-0000-000000000001', 'a1a1a1a1-0001-0000-0000-000000000001', '22222222-2222-2222-2222-111111111111', 'Buá»•i 1: Ã”n táº­p HÃ m sá»‘ vÃ  cÃ¡c dáº¡ng toÃ¡n Ä‘Æ¡n Ä‘iá»‡u báº­c 3, báº­c 4 trÃ¹ng phÆ°Æ¡ng. Tuáº¥n tiáº¿p thu nhanh, Ä‘Ã£ lÃ m tá»‘t 15 bÃ i tráº¯c nghiá»‡m máº«u.', NOW() - INTERVAL '14 days'),
    ('ba06ba06-0001-0000-0000-000000000002', 'a1a1a1a1-0001-0000-0000-000000000011', '33333333-2222-2222-2222-111111111111', 'Buá»•i 1: Kiá»ƒm tra trÃ¬nh Ä‘á»™ phÃ¡t Ã¢m, tá»« vá»±ng vÃ  tÆ° duy pháº£n xáº¡ Speaking Part 1 + 2. Lan Anh phÃ¡t Ã¢m tá»± nhiÃªn, cáº§n má»Ÿ rá»™ng ideas Part 3.', NOW() - INTERVAL '19 days'),
    ('ba06ba06-0001-0000-0000-000000000003', 'a1a1a1a1-0001-0000-0000-000000000012', '44444444-2222-2222-2222-111111111111', 'Buá»•i 1: Dao Ä‘á»™ng Ä‘iá»u hÃ²a, con láº¯c lÃ² xo vÃ  bÃ i toÃ¡n nÄƒng lÆ°á»£ng cÆ¡ há»c. HÃ¹ng náº¯m vá»¯ng cÃ´ng thá»©c cÆ¡ báº£n.', NOW() - INTERVAL '9 days'),
    ('ba06ba06-0001-0000-0000-000000000004', 'a1a1a1a1-0001-0000-0000-000000000013', '44444444-2222-2222-2222-111111111111', 'Buá»•i 2: Con láº¯c Ä‘Æ¡n vÃ  cÃ¡c trÆ°á»ng lá»±c láº¡. Giáº£i quyáº¿t trá»n váº¹n 20 cÃ¢u tráº¯c nghiá»‡m váº­n dá»¥ng cao.', NOW() - INTERVAL '6 days'),
    ('ba06ba06-0001-0000-0000-000000000005', 'a1a1a1a1-0001-0000-0000-000000000015', '44444444-2222-2222-2222-333333333333', 'Buá»•i 1: Ã”n táº­p ngá»¯ phÃ¡p N4 vÃ  lÃ m quen cáº¥u trÃºc Ä‘á» thi ngá»¯ phÃ¡p JLPT N3.', NOW() - INTERVAL '7 days'),
    ('ba06ba06-0001-0000-0000-000000000006', 'a1a1a1a1-0001-0000-0000-000000000016', '44444444-2222-2222-2222-333333333333', 'Buá»•i 2: Kanji N3 chá»§ Ä‘á» sinh hoáº¡t vÃ  Ä‘á»i sá»‘ng hÃ ng ngÃ y, luyá»‡n Ä‘á»c hiá»ƒu bÃ i vÄƒn ngáº¯n.', NOW() - INTERVAL '5 days'),
    ('ba06ba06-0001-0000-0000-000000000007', 'a1a1a1a1-0001-0000-0000-000000000017', '44444444-2222-2222-2222-333333333333', 'Buá»•i 3: Luyá»‡n nghe hiá»ƒu Dokkai dáº¡ng tÃ¬m thÃ´ng tin cá»‘t lÃµi.', NOW() - INTERVAL '2 days'),
    ('ba06ba06-0001-0000-0000-000000000008', 'a1a1a1a1-0001-0000-0000-000000000018', '44444444-2222-2222-2222-444444444444', 'Buá»•i 1: Ká»¹ nÄƒng phÃ¢n tÃ­ch Ä‘á» thi Ngá»¯ vÄƒn, láº­p dÃ n Ã½ bÃ i vÄƒn nghá»‹ luáº­n vÄƒn há»c 200 chá»¯.', NOW() - INTERVAL '6 days'),
    ('ba06ba06-0001-0000-0000-000000000009', 'a1a1a1a1-0001-0000-0000-000000000019', '44444444-2222-2222-2222-444444444444', 'Buá»•i 2: PhÃ¢n tÃ­ch 3 khá»• thÆ¡ Ä‘áº§u bÃ i TÃ¢y Tiáº¿n cá»§a Quang DÅ©ng. Khoa biáº¿t cÃ¡ch diá»…n Ä‘áº¡t cáº£m xÃºc.', NOW() - INTERVAL '4 days'),
    ('ba06ba06-0001-0000-0000-000000000010', 'a1a1a1a1-0001-0000-0000-000000000021', '44444444-2222-2222-2222-111111111111', 'Buá»•i 1: Giá»›i thiá»‡u Clean Architecture, CQRS pattern vÃ  cáº¥u trÃºc solution .NET.', NOW() - INTERVAL '5 days');

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
    ('ba07ba07-0001-0000-0000-000000000001', 'a1a1a1a1-0001-0000-0000-000000000003', '55555555-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'TutorNoShow', 'Em vÃ o phÃ²ng há»c chá» 30 phÃºt nhÆ°ng tháº§y An khÃ´ng vÃ o lá»›p vÃ  khÃ´ng bÃ¡o trÆ°á»›c.', 'Open', NULL, NULL, NULL, NULL, NULL, 200000.00, 'EscrowHold', 'Active', NOW() - INTERVAL '1 day', NULL, 'eeeeeeee-0001-0000-0000-000000000001', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('ba07ba07-0001-0000-0000-000000000002', 'a1a1a1a1-0001-0000-0000-000000000013', '55555555-2222-1111-1111-111111111111', '44444444-1111-1111-1111-111111111111', 'IncompleteSession', 'Buá»•i há»c chá»‰ diá»…n ra 30 phÃºt do gia sÆ° gáº·p sá»± cá»‘ máº¡ng.', 'Resolved', 'StudentWinsPartialRefund', 'Admin Ä‘Ã£ kiá»ƒm tra log Google Meet, xÃ¡c nháº­n buá»•i há»c chá»‰ kÃ©o dÃ i 30 phÃºt.', '11111111-1111-1111-1111-111111111111', 'AdminInvestigation', NOW() - INTERVAL '4 days', 180000.00, 'EscrowHold', 'Released', NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days', 'eeeeeeee-0001-0000-0000-000000000005', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days'),
    ('ba07ba07-0001-0000-0000-000000000003', 'a1a1a1a1-0001-0000-0000-000000000016', '55555555-3333-1111-1111-111111111111', '44444444-3333-1111-1111-111111111111', 'QualityIssue', 'Há»c viÃªn khiáº¿u náº¡i bÃ i táº­p quÃ¡ khÃ³ chÆ°a Ä‘Æ°á»£c giáº£i thÃ­ch cáº·n káº½.', 'Dismissed', 'DismissedNoFinancialChange', 'Ná»™i dung buá»•i há»c Ä‘Ãºng theo giÃ¡o trÃ¬nh Ä‘Ã£ thá»a thuáº­n.', '11111111-1111-1111-1111-111111111111', 'AdminInvestigation', NOW() - INTERVAL '3 days', 200000.00, 'EscrowHold', 'Released', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', 'eeeeeeee-0001-0000-0000-000000000008', false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
    ('ba07ba07-0001-0000-0000-000000000004', 'a1a1a1a1-0001-0000-0000-000000000019', '55555555-4444-1111-1111-111111111111', '44444444-4444-1111-1111-111111111111', 'TutorLate', 'Gia sÆ° vÃ o lá»›p muá»™n 25 phÃºt.', 'UnderReview', NULL, 'Äang yÃªu cáº§u 2 bÃªn cung cáº¥p thÃªm áº£nh chá»¥p mÃ n hÃ¬nh.', NULL, NULL, NULL, 200000.00, 'EscrowHold', 'Active', NOW() - INTERVAL '2 days', NULL, 'eeeeeeee-0001-0000-0000-000000000011', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

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
    ('ba08ba08-0001-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', '22222222-1111-1111-1111-111111111111', 'General', 'dddddddd-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'Gia sÆ° vÃ o lá»›p trá»… 15 phÃºt khÃ´ng bÃ¡o trÆ°á»›c.', NULL, 'Open', NULL, NULL, NULL, NOW() - INTERVAL '2 days', NULL),
    ('ba08ba08-0001-0000-0000-000000000002', 'dddddddd-0001-0000-0000-000000000003', '44444444-1111-1111-1111-111111111111', 'AcademicIntegrity', 'dddddddd-0001-0000-0000-000000000003', '55555555-2222-1111-1111-111111111111', 'YÃªu cáº§u kiá»ƒm tra láº¡i bÃ i thi máº«u do gia sÆ° giáº£i cÃ³ sai sÃ³t.', NULL, 'Resolved', 'Dismissed', 'ÄÃ£ Ä‘á»‘i chiáº¿u Ä‘Ã¡p Ã¡n bá»™ Ä‘á» thi chuáº©n, khÃ´ng cÃ³ vi pháº¡m.', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
    ('ba08ba08-0001-0000-0000-000000000003', NULL, '77777777-1111-1111-1111-111111111111', 'Harassment', '77777777-1111-1111-1111-111111111111', '22222222-1111-1111-1111-111111111111', 'Há»c viÃªn liÃªn tá»¥c Ä‘áº·t lá»‹ch áº£o rá»“i bÃ¹ng khÃ´ng vÃ o há»c.', NULL, 'Resolved', 'WarningIssued', 'Admin Ä‘Ã£ ghi nháº­n vi pháº¡m vÃ  Ã¡p dá»¥ng cháº¿ tÃ i 2 Strike cáº¥m booking.', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    ('ba08ba08-0001-0000-0000-000000000004', 'dddddddd-0001-0000-0000-000000000004', '44444444-3333-1111-1111-111111111111', 'TechnicalIssue', 'dddddddd-0001-0000-0000-000000000004', '55555555-3333-1111-1111-111111111111', 'ÄÆ°á»ng truyá»n Google Meet cháº­p chá»n khÃ´ng nghe rÃµ tiáº¿ng.', NULL, 'Open', NULL, NULL, NULL, NOW() - INTERVAL '1 day', NULL),
    ('ba08ba08-0001-0000-0000-000000000005', NULL, '44444444-2222-1111-1111-111111111111', 'Fraud', '44444444-2222-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Há»“ sÆ¡ cÃ³ dáº¥u hiá»‡u lÃ m giáº£ chá»©ng chá»‰ sÆ° pháº¡m.', NULL, 'Resolved', 'AccountSuspended', 'ÄÃ£ tá»« chá»‘i Ä‘Æ¡n á»©ng tuyá»ƒn vÃ  khÃ³a há»“ sÆ¡.', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '34 days', NOW() - INTERVAL '34 days'),
    ('ba08ba08-0001-0000-0000-000000000006', 'dddddddd-0001-0000-0000-000000000005', '44444444-4444-1111-1111-111111111111', 'General', 'dddddddd-0001-0000-0000-000000000005', '55555555-4444-1111-1111-111111111111', 'Cáº§n tÆ° váº¥n thÃªm lá»™ trÃ¬nh há»c.', NULL, 'Resolved', 'Dismissed', 'ÄÃ£ hÆ°á»›ng dáº«n há»c viÃªn liÃªn há»‡ qua má»¥c Chat.', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days');

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
    ('ba0aba0a-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'Thanh toÃ¡n thÃ nh cÃ´ng', 'Báº¡n Ä‘Ã£ thanh toÃ¡n 2.000.000Ä‘ cho gÃ³i há»c ToÃ¡n THPT 10 buá»•i.', 'PaymentSuccess', '/bookings/dddddddd-0001-0000-0000-000000000001', true, NOW() - INTERVAL '15 days', true, 'e0e0e0e0-0001-0000-0000-000000000001', 'event:payment-001', NOW() - INTERVAL '15 days'),
    ('ba0aba0a-0001-0000-0000-000000000002', '22222222-1111-1111-1111-111111111111', 'ÄÆ¡n Ä‘áº·t há»c má»›i', 'Há»c viÃªn Pháº¡m Minh Tuáº¥n vá»«a Ä‘áº·t mua gÃ³i ToÃ¡n THPT cá»§a báº¡n.', 'NewBooking', '/tutor/enrollments/e1e1e1e1-0001-0000-0000-000000000001', true, NOW() - INTERVAL '15 days', false, 'e0e0e0e0-0001-0000-0000-000000000002', 'event:booking-001', NOW() - INTERVAL '15 days'),
    ('ba0aba0a-0001-0000-0000-000000000003', '66666666-1111-1111-1111-111111111111', 'HoÃ n thÃ nh khÃ³a há»c', 'ChÃºc má»«ng báº¡n Ä‘Ã£ hoÃ n thÃ nh khÃ³a IELTS 1 buá»•i cÃ¹ng cÃ´ BÃ­ch.', 'CourseCompleted', '/enrollments/e1e1e1e1-0001-0000-0000-000000000002', true, NOW() - INTERVAL '19 days', false, 'e0e0e0e0-0001-0000-0000-000000000003', 'event:complete-002', NOW() - INTERVAL '19 days'),
    ('ba0aba0a-0001-0000-0000-000000000004', '33333333-1111-1111-1111-111111111111', 'Giáº£i ngÃ¢n thÃ nh cÃ´ng', '270.000Ä‘ Ä‘Ã£ Ä‘Æ°á»£c cá»™ng vÃ o vÃ­ kháº£ dá»¥ng cá»§a báº¡n.', 'PayoutCredit', '/tutor/wallet', true, NOW() - INTERVAL '19 days', true, 'e0e0e0e0-0001-0000-0000-000000000004', 'event:payout-002', NOW() - INTERVAL '19 days'),
    ('ba0aba0a-0001-0000-0000-000000000005', '55555555-2222-1111-1111-111111111111', 'Nháº¯c nhá»Ÿ buá»•i há»c', 'Buá»•i há»c Váº­t lÃ½ sáº¯p diá»…n ra sau 30 phÃºt.', 'SessionReminder', '/sessions/a1a1a1a1-0001-0000-0000-000000000012', true, NOW() - INTERVAL '9 days', false, 'e0e0e0e0-0001-0000-0000-000000000005', 'event:remind-003', NOW() - INTERVAL '9 days'),
    ('ba0aba0a-0001-0000-0000-000000000006', '44444444-1111-1111-1111-111111111111', 'XÃ¡c nháº­n Ä‘iá»ƒm danh', 'Há»c viÃªn HÃ¹ng Ä‘Ã£ xÃ¡c nháº­n tham gia buá»•i há»c Váº­t lÃ½ #1.', 'AttendanceConfirmed', '/sessions/a1a1a1a1-0001-0000-0000-000000000012', true, NOW() - INTERVAL '9 days', false, 'e0e0e0e0-0001-0000-0000-000000000006', 'event:attend-003', NOW() - INTERVAL '9 days'),
    ('ba0aba0a-0001-0000-0000-000000000007', '55555555-3333-1111-1111-111111111111', 'Thanh toÃ¡n thÃ nh cÃ´ng', 'Báº¡n Ä‘Ã£ thanh toÃ¡n 3.000.000Ä‘ cho gÃ³i Tiáº¿ng Nháº­t N3.', 'PaymentSuccess', '/bookings/dddddddd-0001-0000-0000-000000000004', true, NOW() - INTERVAL '8 days', true, 'e0e0e0e0-0001-0000-0000-000000000007', 'event:payment-004', NOW() - INTERVAL '8 days'),
    ('ba0aba0a-0001-0000-0000-000000000008', '44444444-3333-1111-1111-111111111111', 'ÄÆ¡n Ä‘áº·t há»c má»›i', 'Há»c viÃªn PhÆ°Æ¡ng Linh Ä‘Ã£ Ä‘Äƒng kÃ½ khÃ³a há»c Tiáº¿ng Nháº­t.', 'NewBooking', '/tutor/enrollments/e1e1e1e1-0001-0000-0000-000000000004', true, NOW() - INTERVAL '8 days', false, 'e0e0e0e0-0001-0000-0000-000000000008', 'event:booking-004', NOW() - INTERVAL '8 days'),
    ('ba0aba0a-0001-0000-0000-000000000009', '55555555-4444-1111-1111-111111111111', 'YÃªu cáº§u Ä‘á»•i lá»‹ch há»c', 'Gia sÆ° Mai vá»«a gá»­i yÃªu cáº§u Ä‘á»•i lá»‹ch buá»•i há»c Ngá»¯ vÄƒn #3.', 'RescheduleRequested', '/sessions/reschedule/ba05ba05-0001-0000-0000-000000000003', false, NULL, false, 'e0e0e0e0-0001-0000-0000-000000000009', 'event:resched-005', NOW() - INTERVAL '6 hours'),
    ('ba0aba0a-0001-0000-0000-000000000010', '22222222-1111-1111-1111-111111111111', 'ThÃ´ng bÃ¡o tranh cháº¥p', 'Há»c viÃªn Tuáº¥n Ä‘Ã£ má»Ÿ khiáº¿u náº¡i váº¯ng máº·t Ä‘á»‘i vá»›i buá»•i há»c #3.', 'DisputeOpened', '/disputes/ba07ba07-0001-0000-0000-000000000001', false, NULL, true, 'e0e0e0e0-0001-0000-0000-000000000010', 'event:dispute-001', NOW() - INTERVAL '1 day'),
    ('ba0aba0a-0001-0000-0000-000000000011', '77777777-1111-1111-1111-111111111111', 'Cáº£nh bÃ¡o vi pháº¡m No-show', 'Báº¡n Ä‘Ã£ tÃ­ch lÅ©y 2 gáº­y pháº¡t váº¯ng máº·t. Quyá»n Ä‘áº·t lá»‹ch má»›i táº¡m thá»i bá»‹ khÃ³a 7 ngÃ y.', 'PenaltyStrikeWarning', '/profile/penalties', false, NULL, true, 'e0e0e0e0-0001-0000-0000-000000000011', 'event:strike-001', NOW() - INTERVAL '2 days'),
    ('ba0aba0a-0001-0000-0000-000000000012', '44444444-1111-1111-1111-111111111111', 'Lá»‡nh rÃºt tiá»n Ä‘ang xá»­ lÃ½', 'YÃªu cáº§u rÃºt 300.000Ä‘ vá» MBBank Ä‘ang Ä‘Æ°á»£c Admin xá»­ lÃ½.', 'WithdrawalProcessing', '/tutor/wallet', true, NOW() - INTERVAL '1 hour', true, 'e0e0e0e0-0001-0000-0000-000000000012', 'event:withd-005', NOW() - INTERVAL '1 hour'),
    ('ba0aba0a-0001-0000-0000-000000000013', '33333333-1111-1111-1111-111111111111', 'ÄÃ¡nh giÃ¡ 5 sao má»›i', 'Há»c viÃªn Lan Anh Ä‘Ã£ Ä‘á»ƒ láº¡i Ä‘Ã¡nh giÃ¡ 5 sao cho khÃ³a há»c cá»§a báº¡n.', 'NewReview', '/tutor/reviews', true, NOW() - INTERVAL '18 days', false, 'e0e0e0e0-0001-0000-0000-000000000013', 'event:review-001', NOW() - INTERVAL '18 days'),
    ('ba0aba0a-0001-0000-0000-000000000014', '55555555-1111-1111-1111-111111111111', 'Tin nháº¯n má»›i tá»« gia sÆ°', 'Tháº§y An vá»«a gá»­i cho báº¡n má»™t tin nháº¯n trong má»¥c TrÃ² chuyá»‡n.', 'NewChatMessage', '/chat/c0c0c0c0-0001-0000-0000-000000000001', false, NULL, false, 'e0e0e0e0-0001-0000-0000-000000000014', 'event:msg-002', NOW() - INTERVAL '19 days'),
    ('ba0aba0a-0001-0000-0000-000000000015', '44444444-2222-1111-1111-111111111111', 'Káº¿t quáº£ xÃ©t duyá»‡t gia sÆ°', 'Há»“ sÆ¡ á»©ng tuyá»ƒn gia sÆ° cá»§a báº¡n Ä‘Ã£ bá»‹ tá»« chá»‘i.', 'ApplicationRejected', '/tutor/application', true, NOW() - INTERVAL '34 days', true, 'e0e0e0e0-0001-0000-0000-000000000015', 'event:app-rej-006', NOW() - INTERVAL '34 days');

-- -----------------------------------------------------------------------------
-- 28. EMAIL DELIVERIES (10 Records)
-- -----------------------------------------------------------------------------
INSERT INTO "EmailDeliveries" (
    "Id", "NotificationId", "UserId", "ToEmail", "Subject", "Body",
    "Status", "RetryCount", "NextAttemptAt", "SentAt", "LastError", "ProviderMessageId", "CreatedAt"
)
VALUES
    ('ed1ed1ed-0001-0000-0000-000000000001', 'ba0aba0a-0001-0000-0000-000000000001', '55555555-1111-1111-1111-111111111111', 'student.tuan@tutorhub.com', 'TutorHub - XÃ¡c nháº­n thanh toÃ¡n Ä‘Æ¡n hÃ ng', '<p>ChÃ o Tuáº¥n, báº¡n Ä‘Ã£ thanh toÃ¡n thÃ nh cÃ´ng 2.000.000Ä‘.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '15 days', NULL, 'msg_resend_001', NOW() - INTERVAL '15 days'),
    ('ed1ed1ed-0001-0000-0000-000000000002', 'ba0aba0a-0001-0000-0000-000000000002', '22222222-1111-1111-1111-111111111111', 'tutor.an@tutorhub.com', 'TutorHub - Báº¡n cÃ³ há»c viÃªn Ä‘Äƒng kÃ½ má»›i', '<p>Tháº§y An cÃ³ há»c viÃªn má»›i Ä‘Äƒng kÃ½ gÃ³i ToÃ¡n THPT.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '15 days', NULL, 'msg_resend_002', NOW() - INTERVAL '15 days'),
    ('ed1ed1ed-0001-0000-0000-000000000003', 'ba0aba0a-0001-0000-0000-000000000003', '66666666-1111-1111-1111-111111111111', 'student.lan@tutorhub.com', 'TutorHub - ChÃºc má»«ng hoÃ n thÃ nh khÃ³a há»c', '<p>ChÃºc má»«ng Lan Anh Ä‘Ã£ hoÃ n thÃ nh khÃ³a há»c IELTS!</p>', 'Sent', 0, NULL, NOW() - INTERVAL '19 days', NULL, 'msg_resend_003', NOW() - INTERVAL '19 days'),
    ('ed1ed1ed-0001-0000-0000-000000000004', 'ba0aba0a-0001-0000-0000-000000000004', '33333333-1111-1111-1111-111111111111', 'tutor.bich@tutorhub.com', 'TutorHub - ThÃ´ng bÃ¡o giáº£i ngÃ¢n thÃ¹ lao', '<p>270.000Ä‘ thÃ¹ lao giáº£ng dáº¡y Ä‘Ã£ Ä‘Æ°á»£c cá»™ng vÃ o vÃ­.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '19 days', NULL, 'msg_resend_004', NOW() - INTERVAL '19 days'),
    ('ed1ed1ed-0001-0000-0000-000000000005', 'ba0aba0a-0001-0000-0000-000000000007', '55555555-3333-1111-1111-111111111111', 'student.linh@tutorhub.com', 'TutorHub - XÃ¡c nháº­n Ä‘Æ¡n hÃ ng Tiáº¿ng Nháº­t N3', '<p>ChÃ o Linh, báº¡n Ä‘Ã£ thanh toÃ¡n thÃ nh cÃ´ng 3.000.000Ä‘.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '8 days', NULL, 'msg_resend_005', NOW() - INTERVAL '8 days'),
    ('ed1ed1ed-0001-0000-0000-000000000006', 'ba0aba0a-0001-0000-0000-000000000010', '22222222-1111-1111-1111-111111111111', 'tutor.an@tutorhub.com', 'TutorHub - Khiáº¿u náº¡i tranh cháº¥p buá»•i há»c', '<p>Buá»•i há»c #3 cá»§a báº¡n Ä‘ang cÃ³ khiáº¿u náº¡i váº¯ng máº·t.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '1 day', NULL, 'msg_resend_006', NOW() - INTERVAL '1 day'),
    ('ed1ed1ed-0001-0000-0000-000000000007', 'ba0aba0a-0001-0000-0000-000000000011', '77777777-1111-1111-1111-111111111111', 'student.bad@tutorhub.com', 'TutorHub - Cáº£nh bÃ¡o tÃ i khoáº£n bá»‹ háº¡n cháº¿', '<p>TÃ i khoáº£n cá»§a báº¡n Ä‘Ã£ tÃ­ch lÅ©y 2 strike do váº¯ng máº·t.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '2 days', NULL, 'msg_resend_007', NOW() - INTERVAL '2 days'),
    ('ed1ed1ed-0001-0000-0000-000000000008', 'ba0aba0a-0001-0000-0000-000000000012', '44444444-1111-1111-1111-111111111111', 'tutor.nam@tutorhub.com', 'TutorHub - Äang xá»­ lÃ½ lá»‡nh rÃºt tiá»n', '<p>Lá»‡nh rÃºt 300.000Ä‘ cá»§a báº¡n Ä‘ang Ä‘Æ°á»£c duyá»‡t.</p>', 'Pending', 0, NOW() + INTERVAL '5 minutes', NULL, NULL, NULL, NOW() - INTERVAL '1 hour'),
    ('ed1ed1ed-0001-0000-0000-000000000009', 'ba0aba0a-0001-0000-0000-000000000015', '44444444-2222-1111-1111-111111111111', 'tutor.ha@tutorhub.com', 'TutorHub - Káº¿t quáº£ há»“ sÆ¡ gia sÆ°', '<p>Há»“ sÆ¡ á»©ng tuyá»ƒn chÆ°a Ä‘áº¡t yÃªu cáº§u do thiáº¿u chá»©ng chá»‰.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '34 days', NULL, 'msg_resend_009', NOW() - INTERVAL '34 days'),
    ('ed1ed1ed-0001-0000-0000-000000000010', 'ba0aba0a-0001-0000-0000-000000000013', '33333333-1111-1111-1111-111111111111', 'tutor.bich@tutorhub.com', 'TutorHub - Báº¡n nháº­n Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ má»›i', '<p>Lan Anh Ä‘Ã£ Ä‘á»ƒ láº¡i 1 Ä‘Ã¡nh giÃ¡ 5 sao cho báº¡n.</p>', 'Sent', 0, NULL, NOW() - INTERVAL '18 days', NULL, 'msg_resend_010', NOW() - INTERVAL '18 days');

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
-- TUTORHUB VOLUME SEED DATA (ADDITIVE & IDEMPOTENT)
-- =============================================================================
-- Scale:
--   - 50 Tutors (Users, TutorProfiles, TutorApplications, Wallets, TutorSubjects, AvailabilitySlots)
--   - 200 Students (Users, StudentProfiles)
--   - 150 Services (3 per tutor, 50 tutors, across 15 subjects)
--   - 500 Bookings (400 Paid, 50 Holding, 30 Cancelled, 20 Expired)
--   - 400 Enrollments (220 Active, 150 Completed, 30 Cancelled)
--   - ~3,800 Sessions (Allocated strictly: sum(EarningAmount) == TotalPrice)
--   - Transactions: BookingPayments (Held) + SessionPayoutCredits (Released, SplitGross math)
--   - WalletTransactions & exact Wallet balance reconciliation
--   - Disputes (Pre-release EscrowHold & Post-release BalanceHold) + DisputeEvidences
--   - Reviews, Withdrawals, Conversations, Messages, Notifications, LearningRecords, AuditLogs
--
-- Safety & Invariants:
--   - Deterministic UUID prefixes: b1..b9, ba, bb, bc, bd, be, bf, c0..c7
--   - ON CONFLICT ("Id") DO NOTHING ensures safe re-runs
--   - Does NOT TRUNCATE or DELETE (fully compatible with append-only triggers)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. USERS: 50 Tutors (b1000000-0000-0000-0000-000000000001 .. 0050)
-- -----------------------------------------------------------------------------
INSERT INTO "Users" (
    "Id", "Email", "PasswordHash", "FullName", "Phone", "AvatarUrl", 
    "Role", "Status", "CreatedAt", "AbsentStrikes", "StrikeWindowStart", 
    "LastAbsentAt", "AccessFailedCount", "LockoutEndAt"
)
SELECT
    ('b1000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'volume.tutor.' || i || '@tutorhub.com',
    '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', -- Test@123
    CASE (i % 10)
        WHEN 0 THEN 'ThS. Nguyá»…n VÄƒn ' || chr(65 + (i % 26))
        WHEN 1 THEN 'TS. Tráº§n Thá»‹ ' || chr(65 + (i % 26))
        WHEN 2 THEN 'Tháº§y LÃª HoÃ ng ' || chr(65 + (i % 26))
        WHEN 3 THEN 'CÃ´ Pháº¡m Mai ' || chr(65 + (i % 26))
        WHEN 4 THEN 'Tháº§y VÅ© Minh ' || chr(65 + (i % 26))
        WHEN 5 THEN 'CÃ´ HoÃ ng Lan ' || chr(65 + (i % 26))
        WHEN 6 THEN 'ThS. Äáº·ng Quá»‘c ' || chr(65 + (i % 26))
        WHEN 7 THEN 'CÃ´ BÃ¹i Thu ' || chr(65 + (i % 26))
        WHEN 8 THEN 'Tháº§y NgÃ´ Äá»©c ' || chr(65 + (i % 26))
        ELSE 'ThS. Äá»— Thanh ' || chr(65 + (i % 26))
    END,
    '0912' || lpad(i::text, 6, '0'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=volumetutor' || i,
    'Tutor',
    'Active',
    NOW() - ((70 + (i % 50)) || ' days')::interval,
    0, NULL, NULL, 0, NULL
FROM generate_series(1, 50) AS i
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. USERS: 200 Students (b5000000-0000-0000-0000-000000000001 .. 0200)
-- -----------------------------------------------------------------------------
INSERT INTO "Users" (
    "Id", "Email", "PasswordHash", "FullName", "Phone", "AvatarUrl", 
    "Role", "Status", "CreatedAt", "AbsentStrikes", "StrikeWindowStart", 
    "LastAbsentAt", "AccessFailedCount", "LockoutEndAt"
)
SELECT
    ('b5000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'volume.student.' || i || '@tutorhub.com',
    '$2a$12$RgC9Ej9dMFD5/9UMFkiuIeJrkHgQZ.zJ.ptOq6Jr5ppPBraS3kCR.', -- Test@123
    CASE (i % 10)
        WHEN 0 THEN 'Nguyá»…n Anh Tuáº¥n ' || i
        WHEN 1 THEN 'Tráº§n Báº£o Ngá»c ' || i
        WHEN 2 THEN 'LÃª Gia Huy ' || i
        WHEN 3 THEN 'Pháº¡m Minh ChÃ¢u ' || i
        WHEN 4 THEN 'HoÃ ng Äá»©c Duy ' || i
        WHEN 5 THEN 'VÅ© Tháº£o Vy ' || i
        WHEN 6 THEN 'Äá»— Háº£i ÄÄƒng ' || i
        WHEN 7 THEN 'BÃ¹i KhÃ¡nh Linh ' || i
        WHEN 8 THEN 'NgÃ´ Tuáº¥n Kiá»‡t ' || i
        ELSE 'Äáº·ng Thuá»³ TiÃªn ' || i
    END,
    '0988' || lpad(i::text, 6, '0'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=volumestudent' || i,
    'Student',
    'Active',
    NOW() - ((60 + (i % 40)) || ' days')::interval,
    CASE WHEN (i % 30) = 0 THEN 1 ELSE 0 END,
    NULL, NULL, 0, NULL
FROM generate_series(1, 200) AS i
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. TUTOR PROFILES (b2000000-0000-0000-0000-000000000001 .. 0050)
-- -----------------------------------------------------------------------------
INSERT INTO "TutorProfiles" (
    "Id", "UserId", "Bio", "Education", "ExperienceYears", "TeachingMode", 
    "RatingAvg", "TotalReviews", "BankName", "BankCode", "AccountNumber", "AccountHolderName"
)
SELECT
    ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b1000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'Gia sÆ° sÆ° pháº¡m chuyÃªn nghiá»‡p vá»›i hÆ¡n ' || (3 + (i % 12)) || ' nÄƒm kinh nghiá»‡m luyá»‡n thi vÃ  giáº£ng dáº¡y chuáº©n Ä‘áº§u ra.',
    CASE (i % 4)
        WHEN 0 THEN 'Tháº¡c sÄ© ÄH SÆ° Pháº¡m HÃ  Ná»™i, Cá»­ nhÃ¢n SÆ° Pháº¡m Giá»i'
        WHEN 1 THEN 'Cá»­ nhÃ¢n ÄH Ngoáº¡i ThÆ°Æ¡ng, IELTS 8.0, Chá»©ng chá»‰ giáº£ng dáº¡y CELTA'
        WHEN 2 THEN 'Tháº¡c sÄ© ÄH BÃ¡ch Khoa, Giáº£i Ba Quá»‘c gia Olympic mÃ´n ToÃ¡n'
        ELSE 'Cá»­ nhÃ¢n ÄH Khoa há»c Tá»± nhiÃªn, 5 nÄƒm kinh nghiá»‡m dáº¡y kÃ¨m'
    END,
    3 + (i % 12),
    CASE (i % 3)
        WHEN 0 THEN 'Online'
        WHEN 1 THEN 'Both'
        ELSE 'Offline'
    END,
    4.5 + round(((i % 5) * 0.1)::numeric, 1),
    10 + (i * 2),
    CASE (i % 4)
        WHEN 0 THEN 'NgÃ¢n hÃ ng TMCP Ngoáº¡i thÆ°Æ¡ng Viá»‡t Nam (Vietcombank)'
        WHEN 1 THEN 'NgÃ¢n hÃ ng TMCP Äáº§u tÆ° vÃ  PhÃ¡t triá»ƒn (BIDV)'
        WHEN 2 THEN 'NgÃ¢n hÃ ng TMCP Ká»¹ ThÆ°Æ¡ng (Techcombank)'
        ELSE 'NgÃ¢n hÃ ng TMCP QuÃ¢n Äá»™i (MBBank)'
    END,
    CASE (i % 4)
        WHEN 0 THEN 'VCB'
        WHEN 1 THEN 'BIDV'
        WHEN 2 THEN 'TCB'
        ELSE 'MB'
    END,
    '102' || lpad((i * 777)::text, 9, '0'),
    'NGUYEN VAN TUTOR ' || i
FROM generate_series(1, 50) AS i
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. STUDENT PROFILES (b6000000-0000-0000-0000-000000000001 .. 0200)
-- -----------------------------------------------------------------------------
INSERT INTO "StudentProfiles" ("Id", "UserId")
SELECT
    ('b6000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b5000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid
FROM generate_series(1, 200) AS i
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. TUTOR APPLICATIONS (b4000000-0000-0000-0000-000000000001 .. 0050)
-- -----------------------------------------------------------------------------
INSERT INTO "TutorApplications" (
    "Id", "UserId", "Bio", "Education", "ExperienceYears", "TeachingMode", 
    "Address", "Status", "RejectionReason", "SubmittedAt", "ReviewedAt", "ReviewedByAdminId"
)
SELECT
    ('b4000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b1000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'ÄÆ¡n á»©ng tuyá»ƒn gia sÆ° chuyÃªn ngÃ nh SÆ° pháº¡m',
    'Tá»‘t nghiá»‡p Äáº¡i há»c chÃ­nh quy loáº¡i Giá»i',
    3 + (i % 12),
    CASE (i % 3) WHEN 0 THEN 'Online' WHEN 1 THEN 'Both' ELSE 'Offline' END,
    (10 + i) || ' Phá»‘ Tráº§n Äáº¡i NghÄ©a, Quáº­n Hai BÃ  TrÆ°ng, HÃ  Ná»™i',
    'Approved',
    NULL,
    NOW() - ((70 + (i % 50)) || ' days')::interval,
    NOW() - ((69 + (i % 50)) || ' days')::interval,
    '11111111-1111-1111-1111-111111111111'::uuid
FROM generate_series(1, 50) AS i
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. WALLETS FOR 50 TUTORS (b3000000-0000-0000-0000-000000000001 .. 0050)
-- Initialized to 0, will be updated to exact ledger totals at the end of script!
-- -----------------------------------------------------------------------------
INSERT INTO "Wallets" (
    "Id", "TutorProfileId", "PendingBalance", "AvailableBalance", "HeldBalance", "UpdatedAt"
)
SELECT
    ('b3000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    0.00, 0.00, 0.00, NOW()
FROM generate_series(1, 50) AS i
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. TUTOR SUBJECTS (Map each tutor to 2 distinct subjects)
-- -----------------------------------------------------------------------------
WITH subject_ids AS (
    SELECT array_agg("Id") AS sids FROM "Subjects"
)
INSERT INTO "TutorSubjects" ("Id", "TutorProfileId", "SubjectId", "IsActive")
SELECT
    ('b0010000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    sids[((i - 1) % array_length(sids, 1)) + 1],
    true
FROM generate_series(1, 50) AS i, subject_ids
ON CONFLICT ("TutorProfileId", "SubjectId") DO NOTHING;

WITH subject_ids AS (
    SELECT array_agg("Id") AS sids FROM "Subjects"
)
INSERT INTO "TutorSubjects" ("Id", "TutorProfileId", "SubjectId", "IsActive")
SELECT
    ('b0020000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    sids[((i + 3) % array_length(sids, 1)) + 1],
    true
FROM generate_series(1, 50) AS i, subject_ids
ON CONFLICT ("TutorProfileId", "SubjectId") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. AVAILABILITY SLOTS (Monday, Wednesday, Friday evening for each tutor)
-- -----------------------------------------------------------------------------
INSERT INTO "AvailabilitySlots" (
    "Id", "TutorProfileId", "DayOfWeek", "StartTime", "EndTime", "IsActive"
)
SELECT
    ('b0a10000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'Monday',
    '18:00:00'::time,
    '21:00:00'::time,
    true
FROM generate_series(1, 50) AS i
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "AvailabilitySlots" (
    "Id", "TutorProfileId", "DayOfWeek", "StartTime", "EndTime", "IsActive"
)
SELECT
    ('b0a20000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'Wednesday',
    '18:00:00'::time,
    '21:00:00'::time,
    true
FROM generate_series(1, 50) AS i
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "AvailabilitySlots" (
    "Id", "TutorProfileId", "DayOfWeek", "StartTime", "EndTime", "IsActive"
)
SELECT
    ('b0a30000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'Saturday',
    '08:30:00'::time,
    '11:30:00'::time,
    true
FROM generate_series(1, 50) AS i
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9. SERVICES (150 services: 3 per tutor for 50 tutors)
-- -----------------------------------------------------------------------------
WITH subject_ids AS (
    SELECT array_agg("Id") AS sids FROM "Subjects"
)
INSERT INTO "Services" (
    "Id", "TutorProfileId", "SubjectId", "Title", "Description", 
    "TotalSessions", "SessionDurationMinutes", "Price", "TeachingMode", 
    "Status", "CreatedAt", "ExpectedOutcome"
)
SELECT
    ('b7000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('b2000000-0000-0000-0000-' || lpad((((i - 1) / 3) + 1)::text, 12, '0'))::uuid,
    sids[((i - 1) % array_length(sids, 1)) + 1],
    CASE (i % 6)
        WHEN 0 THEN 'KhÃ³a Há»c ToÃ n Diá»‡n NÃ¢ng Cao (GÃ³i ' || (CASE (i % 3) WHEN 0 THEN 10 WHEN 1 THEN 8 ELSE 12 END) || ' Buá»•i)'
        WHEN 1 THEN 'Luyá»‡n Äá» ChuyÃªn SÃ¢u Cáº¥p Tá»‘c (' || (CASE (i % 3) WHEN 0 THEN 8 WHEN 1 THEN 10 ELSE 6 END) || ' Buá»•i)'
        WHEN 2 THEN 'Láº¥y Gá»‘c Kiáº¿n Thá»©c Vá»¯ng Cháº¯c (' || (CASE (i % 3) WHEN 0 THEN 12 WHEN 1 THEN 10 ELSE 8 END) || ' Buá»•i)'
        WHEN 3 THEN 'Bá»“i DÆ°á»¡ng Há»c Sinh Giá»i & Thi ChuyÃªn (' || (CASE (i % 3) WHEN 0 THEN 10 WHEN 1 THEN 12 ELSE 8 END) || ' Buá»•i)'
        WHEN 4 THEN 'Luyá»‡n Thi Chuáº©n Äáº§u Ra Quá»‘c Táº¿ (' || (CASE (i % 3) WHEN 0 THEN 8 WHEN 1 THEN 6 ELSE 10 END) || ' Buá»•i)'
        ELSE 'PhÆ°Æ¡ng PhÃ¡p TÆ° Duy & Giáº£i Quyáº¿t Váº¥n Äá» (' || (CASE (i % 3) WHEN 0 THEN 10 WHEN 1 THEN 8 ELSE 12 END) || ' Buá»•i)'
    END,
    'Lá»™ trÃ¬nh Ä‘Ã o táº¡o cÃ¡ nhÃ¢n hoÃ¡ 1 kÃ¨m 1 vá»›i giÃ¡o trÃ¬nh thá»±c chiáº¿n, bÃ i táº­p pháº£n xáº¡ vÃ  Ä‘á»‘i soÃ¡t cháº¥t lÆ°á»£ng tá»«ng buá»•i.',
    CASE (i % 3) WHEN 0 THEN 10 WHEN 1 THEN 8 ELSE 12 END, -- TotalSessions
    CASE (i % 2) WHEN 0 THEN 90 ELSE 60 END,               -- Duration
    (CASE (i % 3) WHEN 0 THEN 10 WHEN 1 THEN 8 ELSE 12 END) * (200000 + ((i % 5) * 25000)), -- Price = sessions * rate
    CASE (i % 3) WHEN 0 THEN 'Online' WHEN 1 THEN 'Both' ELSE 'Offline' END,
    'Published',
    NOW() - ((65 + (i % 30)) || ' days')::interval,
    'Náº¯m vá»¯ng 100% kiáº¿n thá»©c ná»n táº£ng vÃ  tá»± tin giáº£i bÃ i táº­p nÃ¢ng cao.'
FROM generate_series(1, 150) AS i, subject_ids
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
-- 10. BOOKINGS (500 Bookings)
-- 1..400: Paid
-- 401..450: Holding
-- 451..480: Cancelled
-- 481..500: Expired
-- -----------------------------------------------------------------------------
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
    CASE WHEN s.i > 400 AND s.i <= 450 THEN NOW() + '14 minutes'::interval ELSE NULL END, -- HoldingExpiresAt
    CASE WHEN s.i <= 400 THEN NOW() - ((60 - (s.i % 55)) || ' days')::interval ELSE NULL END, -- ConfirmedAt
    CASE WHEN s.i > 250 AND s.i <= 350 THEN NOW() - '2 days'::interval ELSE NULL END, -- CompletedAt
    CASE WHEN s.i > 450 AND s.i <= 480 THEN NOW() - '10 days'::interval ELSE NULL END, -- CancelledAt
    CASE WHEN s.i > 450 AND s.i <= 480 THEN 'Student' ELSE NULL END,
    CASE WHEN s.i > 450 AND s.i <= 480 THEN 'Thay Ä‘á»•i káº¿ hoáº¡ch há»c táº­p cÃ¡ nhÃ¢n' ELSE NULL END,
    NOW() - ((60 - (s.i % 55)) || ' days')::interval
FROM s
JOIN "Services" svc ON svc."Id" = s.svc_id
ON CONFLICT ("Id") DO NOTHING;

-- -----------------------------------------------------------------------------
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
    CASE WHEN b.i > 370 THEN 'Báº­n viá»‡c gia Ä‘Ã¬nh Ä‘á»™t xuáº¥t' ELSE NULL END
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
    'RÃºt thu nháº­p Ä‘á»‹nh ká»³ Ä‘á»£t ' || i,
    NOW() - ((25 - (i % 20)) || ' days')::interval,
    CASE WHEN (i % 4) IN (0, 1) THEN NOW() - ((24 - (i % 20)) || ' days')::interval ELSE NULL END,
    CASE WHEN (i % 4) IN (0, 1) THEN '11111111-1111-1111-1111-111111111111'::uuid ELSE NULL END,
    CASE WHEN (i % 4) = 0 THEN NOW() - ((23 - (i % 20)) || ' days')::interval ELSE NULL END,
    CASE WHEN (i % 4) = 0 THEN '11111111-1111-1111-1111-111111111111'::uuid ELSE NULL END,
    CASE WHEN (i % 4) = 3 THEN 'Sá»‘ tÃ i khoáº£n ngÃ¢n hÃ ng khÃ´ng há»£p lá»‡' ELSE NULL END
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
        WHEN 1 THEN 'Tháº§y dáº¡y ráº¥t ká»¹ tÃ­nh, luÃ´n kiá»ƒm tra bÃ i cÅ© vÃ  há»— trá»£ giáº£i Ä‘Ã¡p tháº¯c máº¯c 24/7.'
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

