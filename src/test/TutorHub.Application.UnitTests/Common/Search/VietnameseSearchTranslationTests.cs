using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TutorHub.Application.Common.Search;
using TutorHub.Infrastructure.Persistence;

namespace TutorHub.Application.UnitTests.Common.Search;

/// <summary>
/// Proves the rewritten search predicates translate to index-compatible SQL
/// (lower(unaccent_immutable(col)) LIKE ...) WITHOUT needing a live database:
/// ToQueryString() only builds SQL, it never opens a connection.
/// What this does NOT prove: PG planner index choice (needs EXPLAIN on staging)
/// and PG unaccent-dictionary equivalence (needs DB-backed test, Task 3).
/// </summary>
public class VietnameseSearchTranslationTests
{
    private static AppDbContext NewNpgsqlContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=unused;Username=unused;Password=unused")
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public void Model_RegistersUnaccentImmutableDbFunction()
    {
        using var context = NewNpgsqlContext();
        var method = typeof(VietnameseSearch).GetMethod(nameof(VietnameseSearch.UnaccentImmutable))!;
        var function = context.Model.FindDbFunction(method);

        function.Should().NotBeNull("the search predicate relies on unaccent_immutable()");
        function!.Name.Should().Be("unaccent_immutable");
    }

    [Fact]
    public void SubjectSearchPredicate_TranslatesToUnaccentLike_WithoutStrpos()
    {
        using var context = NewNpgsqlContext();
        // Term normalization is client-side by design; DB unaccent is authoritative column-side.
        var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm("toan")) + "%";

        var sql = context.Subjects
            .Where(s => EF.Functions.Like(
                VietnameseSearch.UnaccentImmutable(s.Name)!.ToLower(),
                pattern, @"\"))
            .ToQueryString();

        sql.Should().Contain("unaccent_immutable(");
        sql.Should().Contain("LIKE");
        sql.Should().Contain("ESCAPE");
        sql.Should().NotContain("strpos");
    }

    [Fact]
    public void UserSearchPredicate_TranslatesToUnaccentLike_WithoutStrpos()
    {
        using var context = NewNpgsqlContext();
        // Term normalization is client-side by design; DB unaccent is authoritative column-side.
        var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm("nguyen")) + "%";

        var sql = context.Users
            .Where(u => EF.Functions.Like(
                    VietnameseSearch.UnaccentImmutable(u.FullName)!.ToLower(),
                    pattern, @"\")
                || EF.Functions.Like(
                    VietnameseSearch.UnaccentImmutable(u.Email)!.ToLower(),
                    pattern, @"\"))
            .ToQueryString();

        sql.Should().Contain("unaccent_immutable(");
        sql.Should().Contain("LIKE");
        sql.Should().Contain("ESCAPE");
        sql.Should().NotContain("strpos");
    }

    [Fact]
    public void ServiceSearchPredicate_TranslatesToUnaccentLike_WithoutStrpos()
    {
        using var context = NewNpgsqlContext();
        // Term normalization is client-side by design; DB unaccent is authoritative column-side.
        var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm("toan")) + "%";

        var sql = context.Services
            .Where(s => EF.Functions.Like(
                    VietnameseSearch.UnaccentImmutable(s.Title)!.ToLower(),
                    pattern, @"\")
                || EF.Functions.Like(
                    VietnameseSearch.UnaccentImmutable(s.Description)!.ToLower(),
                    pattern, @"\")
                || EF.Functions.Like(
                    VietnameseSearch.UnaccentImmutable(s.Subject.Name)!.ToLower(),
                    pattern, @"\"))
            .ToQueryString();

        sql.Should().Contain("unaccent_immutable(");
        sql.Should().Contain("LIKE");
        sql.Should().Contain("ESCAPE");
        sql.Should().NotContain("strpos");
    }

    [Fact]
    public void BackslashTerm_BuildsEscapedPattern_WithEscapeClauseInSql()
    {
        using var context = NewNpgsqlContext();
        // Term normalization is client-side by design; DB unaccent is authoritative column-side.
        // NOTE: proven at translation level (not InMemory) — the InMemory
        // provider does not evaluate the escaped escape-char "\\", while
        // PostgreSQL LIKE ... ESCAPE '\' matches it literally.
        var pattern = "%" + VietnameseSearch.EscapeLikePattern(VietnameseSearch.NormalizeTerm(@"a\b")) + "%";

        pattern.Should().Be(@"%a\\b%");

        var sql = context.Subjects
            .Where(s => EF.Functions.Like(
                VietnameseSearch.UnaccentImmutable(s.Name)!.ToLower(),
                pattern, @"\"))
            .ToQueryString();

        sql.Should().Contain("unaccent_immutable(");
        sql.Should().Contain("LIKE");
        sql.Should().Contain("ESCAPE");
    }
}
