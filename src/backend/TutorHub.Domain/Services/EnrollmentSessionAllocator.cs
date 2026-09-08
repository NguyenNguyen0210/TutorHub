namespace TutorHub.Domain.Services;

/// <summary>
/// Allocates total enrollment price across N sessions.
/// Sessions 1..N-1 receive floor(totalPrice / N).
/// Session N receives the remainder to ensure Σ == totalPrice.
/// This allocation is immutable once assigned.
/// </summary>
public static class EnrollmentSessionAllocator
{
    public static IReadOnlyList<decimal> Allocate(decimal totalPrice, int totalSessions)
    {
        if (totalSessions <= 0)
        {
            throw new ArgumentException("TotalSessions must be greater than 0.", nameof(totalSessions));
        }

        if (totalPrice < 0)
        {
            throw new ArgumentException("TotalPrice cannot be negative.", nameof(totalPrice));
        }

        var baseAmount = Math.Floor(totalPrice / totalSessions);
        var remainder = totalPrice - (baseAmount * totalSessions);

        var allocations = new List<decimal>();
        for (var i = 0; i < totalSessions - 1; i++)
        {
            allocations.Add(baseAmount);
        }

        // Last session receives baseAmount + remainder
        allocations.Add(baseAmount + remainder);

        return allocations.AsReadOnly();
    }
}
