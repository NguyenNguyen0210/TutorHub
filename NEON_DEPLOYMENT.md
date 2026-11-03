# TutorHub: Neon PostgreSQL setup

TutorHub uses **Npgsql / EF Core 8** in its .NET API. Neon provisions PostgreSQL;
deploying Neon does not host the React frontend or the .NET API.

## Database selection

The target database for this TutorHub deployment is **`tutorhub_db`** on the
**`production`** Neon branch. `neon deploy` may write a `DATABASE_URL` for the
default **`neondb`** database to the root `.env`; do not use that URL by mistake.

From the project root, get a URL for the correct database:

```powershell
# Direct connection (EF Core migrations):
neon.cmd connection-string production --project-id rapid-field-55542833 --database-name tutorhub_db

# Pooled connection (running web API):
neon.cmd connection-string production --project-id rapid-field-55542833 --database-name tutorhub_db --pooled
```

Both commands output credentials. Keep their output private and never commit
secrets to Git. Configure the API host with the *pooled* `DATABASE_URL`.

The API now accepts a PostgreSQL `DATABASE_URL` automatically. If
`ConnectionStrings__DefaultConnection` is set to a nonempty .NET/Npgsql
connection string, it takes precedence; this preserves the existing local
Docker configuration. Neon URLs are converted to Npgsql format with TLS enabled.

## Apply migrations to the new database

Run the following in **PowerShell** from the repository root after confirming
that the database is fresh and you want to create the TutorHub schema:

```powershell
$env:DATABASE_URL = (& neon.cmd connection-string production --project-id rapid-field-55542833 --database-name tutorhub_db 2>$null | Select-Object -Last 1)
$env:ConnectionStrings__DefaultConnection = ''
dotnet ef database update --project src/backend/TutorHub.Infrastructure --startup-project src/backend/TutorHub.Api --context AppDbContext
Remove-Item Env:DATABASE_URL, Env:ConnectionStrings__DefaultConnection -ErrorAction SilentlyContinue
```

The empty override ensures a local connection string in `.env` cannot redirect
the migration to local PostgreSQL. Neon needs the `pg_trgm` and `unaccent`
extensions, created automatically by the initial migration.

## Verify

```powershell
dotnet build src/backend/TutorHub.sln
npm run build             # from repository root; builds src/frontend
neon.cmd connection-string production --project-id rapid-field-55542833 --database-name tutorhub_db --psql
```

Inside `psql`, check migration history:

```sql
SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
```

For the API host, configure the remaining app secrets (`Jwt`, refresh-token
pepper, R2, and payment settings) and decide whether to enable Redis. The
frontend host needs `VITE_API_BASE_URL` set to the deployed API base URL,
e.g. `https://api.tutorhub.id.vn/api/v1`, **at build time**.
