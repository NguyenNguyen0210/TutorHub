using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemovePresentationContentStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Keep submitted qualifications in their existing application snapshot.
            // Only replace the generic values introduced by the old seed.
            migrationBuilder.Sql("""
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM "SiteContents" WHERE "Id" <> 'become-tutor') THEN
                        RAISE EXCEPTION 'Move custom site content to the frontend before removing SiteContents.';
                    END IF;
                END $$;
                UPDATE "TutorApplications" a SET
                    "University" = CASE WHEN a."University" IS NULL OR a."University" = 'Đại học Quốc gia'
                        THEN COALESCE(legacy.degree->>'institution', a."University") ELSE a."University" END,
                    "Major" = CASE WHEN a."Major" IS NULL OR a."Major" = 'Sư phạm & Chuyên ngành liên quan'
                        THEN legacy.degree->>'major' ELSE a."Major" END,
                    "DegreeLevel" = CASE WHEN a."DegreeLevel" IS NULL OR a."DegreeLevel" = 'Thạc sĩ / Cử nhân'
                        THEN COALESCE(legacy.degree->>'type', a."DegreeLevel") ELSE a."DegreeLevel" END,
                    "Certifications" = CASE WHEN a."Certifications" IS NULL
                        OR a."Certifications" = 'Chứng chỉ nghiệp vụ sư phạm & Chứng chỉ chuyên môn'
                        THEN COALESCE(legacy.certifications, a."Certifications") ELSE a."Certifications" END
                FROM (
                    SELECT p."UserId",
                        (SELECT c FROM jsonb_array_elements(COALESCE(p."PublicContentJson"->'credentials', '[]'::jsonb)) c
                            WHERE c->>'id' LIKE 'deg-%' OR c->>'id' LIKE 'demo-degree-%' LIMIT 1) AS degree,
                        (SELECT string_agg(c->>'title', '; ' ORDER BY ord)
                         FROM jsonb_array_elements(COALESCE(p."PublicContentJson"->'credentials', '[]'::jsonb))
                            WITH ORDINALITY AS entry(c, ord) WHERE c->>'id' LIKE 'cert-%') AS certifications
                    FROM "TutorProfiles" p WHERE p."PublicContentJson" IS NOT NULL
                ) legacy WHERE legacy."UserId" = a."UserId" AND a."Status" = 'Approved';
                """);
            // Remove exact copies of shared policy FAQs, retaining course-specific questions.
            migrationBuilder.Sql("""
                UPDATE "Services" s SET "FaqsJson" = COALESCE((
                    SELECT jsonb_agg(faq ORDER BY ord)
                    FROM jsonb_array_elements(s."FaqsJson"::jsonb) WITH ORDINALITY AS entry(faq, ord)
                    WHERE NOT EXISTS (
                        SELECT 1 FROM jsonb_array_elements('[{"question":"Tôi có thể đổi lịch học nếu có việc bận đột xuất không?","answer":"Hoàn toàn được. Học viên có thể chủ động nhắn tin hoặc yêu cầu đổi lịch với gia sư trước tối thiểu 2 giờ mà không bị trừ buổi học. Gia sư sẽ cùng bạn thống nhất khung giờ học bù phù hợp nhất."},{"question":"Học phí của tôi được bảo lưu và giải ngân như thế nào qua Escrow?","answer":"Toàn bộ học phí trọn gói của bạn được lưu giữ an toàn tại tài khoản tín thác TutorHub Escrow. Sau mỗi buổi học, hệ thống chờ 12 giờ để bạn đánh giá và xác nhận chất lượng trước khi giải ngân từng phần cho gia sư. Nếu có sự cố, bạn luôn có quyền khiếu nại để được hoàn tiền."},{"question":"Nếu phương pháp học không phù hợp, tôi có được đổi gia sư không?","answer":"Có. Bạn có thể đăng ký buổi học thử trước khi bắt đầu khóa học chính thức. Trong quá trình học, nếu cảm thấy không hợp phong cách, đội ngũ TutorHub luôn sẵn sàng hỗ trợ kết nối đổi gia sư mới hoặc hoàn trả học phí của các buổi học chưa diễn ra theo đúng chính sách bảo vệ học viên."}]'::jsonb) common
                        WHERE common->>'question' = faq->>'question' AND common->>'answer' = faq->>'answer'
                    )
                ), '[]'::jsonb)
                WHERE jsonb_typeof(s."FaqsJson"::jsonb) = 'array';
                """);
            migrationBuilder.DropTable(
                name: "SiteContents");

            migrationBuilder.DropColumn(
                name: "PublicContentJson",
                table: "TutorProfiles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublicContentJson",
                table: "TutorProfiles",
                type: "jsonb",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SiteContents",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PayloadJson = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteContents", x => x.Id);
                });
        }
    }
}
