using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Query;
using MockQueryable.Moq;
using Moq;

namespace TutorHub.Application.UnitTests.TestHelpers;

public class MockEntityQueryRootExpression : EntityQueryRootExpression
{
    private readonly Expression _fallback;

    public MockEntityQueryRootExpression(IAsyncQueryProvider provider, IEntityType entityType, Expression fallback)
        : base(provider, entityType)
    {
        _fallback = fallback;
    }

    public override bool CanReduce => true;
    public override Expression Reduce() => _fallback;
}

public class MockAsyncQueryProvider<T> : IAsyncQueryProvider, IQueryProvider
{
    private readonly IAsyncQueryProvider _innerAsync;
    private readonly IQueryProvider _inner;
    private readonly Expression _fallbackExpression;

    public MockAsyncQueryProvider(IAsyncQueryProvider inner, Expression fallbackExpression)
    {
        _innerAsync = inner;
        _inner = (IQueryProvider)inner;
        _fallbackExpression = fallbackExpression;
    }

    public IQueryable CreateQuery(Expression expression)
    {
        var cleaned = ReplaceFromSql(expression);
        return _inner.CreateQuery(cleaned);
    }

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
    {
        var cleaned = ReplaceFromSql(expression);
        return _inner.CreateQuery<TElement>(cleaned);
    }

    public object? Execute(Expression expression)
    {
        var cleaned = ReplaceFromSql(expression);
        return _inner.Execute(cleaned);
    }

    public TResult Execute<TResult>(Expression expression)
    {
        var cleaned = ReplaceFromSql(expression);
        return _inner.Execute<TResult>(cleaned);
    }

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var cleaned = ReplaceFromSql(expression);
        return _innerAsync.ExecuteAsync<TResult>(cleaned, cancellationToken);
    }

    private Expression ReplaceFromSql(Expression expression)
    {
        return new FromSqlReplacer(_fallbackExpression).Visit(expression) ?? expression;
    }

    private class FromSqlReplacer : ExpressionVisitor
    {
        private readonly Expression _fallback;
        public FromSqlReplacer(Expression fallback) => _fallback = fallback;

        public override Expression? Visit(Expression? node)
        {
            if (node != null && (node.GetType().Name.Contains("FromSql") || node is EntityQueryRootExpression))
            {
                return _fallback;
            }
            return base.Visit(node);
        }
    }
}

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

        // Support FromSqlInterpolated and FromSqlRaw on mock DbSet
        var entityTypeMock = new Mock<IEntityType>();
        entityTypeMock.Setup(e => e.ClrType).Returns(typeof(T));

        var originalQueryable = (IQueryable<T>)mock.Object;
        var originalProvider = (IAsyncQueryProvider)originalQueryable.Provider;
        var fallbackExpression = originalQueryable.Expression;

        var customProvider = new MockAsyncQueryProvider<T>(originalProvider, fallbackExpression);
        var entityQueryRoot = new MockEntityQueryRootExpression(customProvider, entityTypeMock.Object, fallbackExpression);

        mock.As<IQueryable<T>>().Setup(m => m.Expression).Returns(entityQueryRoot);
        mock.As<IQueryable<T>>().Setup(m => m.Provider).Returns(customProvider);

        return mock;
    }
}
