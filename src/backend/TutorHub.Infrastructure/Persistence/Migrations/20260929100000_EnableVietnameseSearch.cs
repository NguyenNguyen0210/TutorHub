using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TutorHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnableVietnameseSearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS unaccent;");

            // Stock unaccent() is STABLE, so PostgreSQL refuses to index it.
            // This IMMUTABLE wrapper is the indexed expression used by every
            // GIN index below and by VietnameseSearch.UnaccentImmutable in LINQ
            // (lower(unaccent_immutable(col)) LIKE ...).
            // translate() forces đ/Đ → d/D regardless of unaccent.rules version.
            migrationBuilder.Sql(
                "CREATE OR REPLACE FUNCTION unaccent_immutable(text) RETURNS text " +
                "LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT " +
                "AS $$SELECT unaccent(translate($1, 'đĐ', 'dD'))$$;");

            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_Services_Title_Search\" " +
                "ON \"Services\" USING gin (lower(unaccent_immutable(\"Title\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_Services_Description_Search\" " +
                "ON \"Services\" USING gin (lower(unaccent_immutable(\"Description\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_Subjects_Name_Search\" " +
                "ON \"Subjects\" USING gin (lower(unaccent_immutable(\"Name\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_Categories_Name_Search\" " +
                "ON \"Categories\" USING gin (lower(unaccent_immutable(\"Name\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_Users_FullName_Search\" " +
                "ON \"Users\" USING gin (lower(unaccent_immutable(\"FullName\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_Users_Email_Search\" " +
                "ON \"Users\" USING gin (lower(unaccent_immutable(\"Email\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_Users_Phone_Search\" " +
                "ON \"Users\" USING gin (lower(unaccent_immutable(\"Phone\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_TutorProfiles_Bio_Search\" " +
                "ON \"TutorProfiles\" USING gin (lower(unaccent_immutable(\"Bio\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_TutorProfiles_Education_Search\" " +
                "ON \"TutorProfiles\" USING gin (lower(unaccent_immutable(\"Education\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_TutorProfiles_Address_Search\" " +
                "ON \"TutorProfiles\" USING gin (lower(unaccent_immutable(\"Address\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_TutorApplications_DegreeLevel_Search\" " +
                "ON \"TutorApplications\" USING gin (lower(unaccent_immutable(\"DegreeLevel\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_TutorApplications_University_Search\" " +
                "ON \"TutorApplications\" USING gin (lower(unaccent_immutable(\"University\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_TutorApplications_Certifications_Search\" " +
                "ON \"TutorApplications\" USING gin (lower(unaccent_immutable(\"Certifications\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_TutorApplications_Address_Search\" " +
                "ON \"TutorApplications\" USING gin (lower(unaccent_immutable(\"Address\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_TutorApplications_Subject_Search\" " +
                "ON \"TutorApplications\" USING gin (lower(unaccent_immutable(\"Subject\")) gin_trgm_ops);");
            migrationBuilder.Sql(
                "CREATE INDEX IF NOT EXISTS \"IX_Transactions_PaymentGatewayRef_Search\" " +
                "ON \"Transactions\" USING gin (lower(unaccent_immutable(\"PaymentGatewayRef\")) gin_trgm_ops);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Extensions and unaccent_immutable() are intentionally kept:
            // shared with any future search column, and Up is idempotent
            // (IF NOT EXISTS / OR REPLACE).
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Transactions_PaymentGatewayRef_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TutorApplications_Subject_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TutorApplications_Address_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TutorApplications_Certifications_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TutorApplications_University_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TutorApplications_DegreeLevel_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TutorProfiles_Address_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TutorProfiles_Education_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_TutorProfiles_Bio_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Users_Phone_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Users_Email_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Users_FullName_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Categories_Name_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Subjects_Name_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Services_Description_Search\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Services_Title_Search\";");
        }
    }
}
