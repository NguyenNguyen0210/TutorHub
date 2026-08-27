using Microsoft.EntityFrameworkCore;
using MockQueryable.Moq;
using Moq;

namespace TutorHub.Application.UnitTests.TestHelpers;

public static class MockDbSetHelper
{
    /// <summary>
    /// Creates a mock DbSet from a source list that supports async LINQ queries and basic mutation callbacks.
    /// </summary>
    public static Mock<DbSet<T>> CreateMockDbSet<T>(List<T>? sourceList = null) where T : class
    {
        var list = sourceList ?? new List<T>();
        var mock = list.BuildMockDbSet();

        mock.Setup(d => d.Add(It.IsAny<T>())).Callback<T>(list.Add);
        mock.Setup(d => d.AddRange(It.IsAny<IEnumerable<T>>())).Callback<IEnumerable<T>>(list.AddRange);
        mock.Setup(d => d.Remove(It.IsAny<T>())).Callback<T>(e => list.Remove(e));
        mock.Setup(d => d.RemoveRange(It.IsAny<IEnumerable<T>>())).Callback<IEnumerable<T>>(items =>
        {
            foreach (var item in items.ToList())
            {
                list.Remove(item);
            }
        });

        return mock;
    }
}
