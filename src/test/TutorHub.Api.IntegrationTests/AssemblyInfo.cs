using Xunit;

// The suite intentionally shares one PostgreSQL database and one mutable
// TestCurrentUserService. Serial execution mirrors request ordering and prevents
// one test from changing another test's acting user or financial state.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
