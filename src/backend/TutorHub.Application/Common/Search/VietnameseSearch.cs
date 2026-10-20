using System.Globalization;
using System.Text;

namespace TutorHub.Application.Common.Search;

/// <summary>
/// Single place for Vietnamese accent-insensitive search.
///
/// DB side: <see cref="UnaccentImmutable"/> is mapped to
/// <c>public.unaccent_immutable(text)</c> (see AppDbContext.OnModelCreating and
/// the EnableVietnameseSearch migration), so LINQ predicates using it translate
/// to <c>lower(unaccent_immutable(col)) LIKE ...</c> — exactly the indexed
/// expression — instead of the old full-scan <c>ToLower().Contains()</c>.
/// Always pair it with <c>EF.Functions.Like</c> (NOT string.Contains: the
/// Npgsql provider translates Contains to strpos(), which pg_trgm cannot
/// accelerate, while LIKE can use the GIN trigram index).
///
/// Client side: the method body is a C# diacritics-stripping mirror used only
/// for client-side evaluation (unit tests / InMemory). PostgreSQL's unaccent
/// dictionary is authoritative; the mirror covers Vietnamese diacritics
/// (including đ/Đ, which the DB wrapper also forces via translate()).
/// </summary>
public static class VietnameseSearch
{
    public static string? UnaccentImmutable(string? value)
    {
        if (value is null)
        {
            return null;
        }

        var decomposed = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(c);
            }
        }

        // đ/Đ are base letters (no combining mark), so strip them explicitly.
        return builder.ToString().Replace('đ', 'd').Replace('Đ', 'D');
    }

    /// <summary>
    /// Prepares a user search term: trim, culture-invariant lowercase, strip
    /// diacritics. Empty/blank input yields "" (callers keep the old
    /// IsNullOrWhiteSpace guard so blank still means "no filter").
    /// </summary>
    public static string NormalizeTerm(string? term)
        => UnaccentImmutable(term?.Trim().ToLowerInvariant()) ?? string.Empty;

    /// <summary>
    /// Escapes LIKE wildcards in an already-normalized term so user input
    /// like "100%" or "a_b" matches literally. Client-side only: callers
    /// build the "%...%" pattern outside the LINQ expression and pass it
    /// as a parameter with escape '\\' — never call this inside a query.
    /// </summary>
    public static string EscapeLikePattern(string value)
        => value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}
