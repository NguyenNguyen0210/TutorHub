# Testing

[Back to TutorHub](../README.md) | [Local setup](configuration.md)

Run commands from the repository root unless noted otherwise.

## Backend

```powershell
dotnet build src/backend/TutorHub.sln --configuration Release /p:TreatWarningsAsErrors=true
dotnet test src/backend/TutorHub.sln --configuration Release --no-build
```

Integration tests use local PostgreSQL and Redis. The database connection is read from the environment or `.env`; the PostgreSQL user needs permission to create and drop the dedicated test database. The harness refuses remote hosts and restricts database names to `tutorhub_integration` or an allowed underscore suffix.

To use a separate test database name:

```powershell
$env:POSTGRES_TEST_DATABASE='tutorhub_integration_local'
dotnet test src/test/TutorHub.Api.IntegrationTests --configuration Release
```

## Frontend

From `src/frontend`:

```powershell
npm run lint
npm test
npm run build
```

Versioned regression tests are in `src/test` and `src/frontend/test`. They cover domain rules, application handlers, infrastructure behavior, and API/database integration, including financial concurrency and authentication scenarios. Browser E2E checks use Playwright separately; local runners and generated reports are not distributed with this repository.

The [CI workflow](../.github/workflows/ci.yml) defines backend build/tests and frontend lint/tests/build for pushes and pull requests targeting `main`. Integration tests run against PostgreSQL 16 and Redis 7 services in CI.
