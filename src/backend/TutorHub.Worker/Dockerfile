# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Directory.Build.props .
COPY TutorHub.Worker/TutorHub.Worker.csproj TutorHub.Worker/
COPY TutorHub.Domain/TutorHub.Domain.csproj TutorHub.Domain/
COPY TutorHub.Application/TutorHub.Application.csproj TutorHub.Application/
COPY TutorHub.Infrastructure/TutorHub.Infrastructure.csproj TutorHub.Infrastructure/

# Restore the Worker project, NOT the solution (same reason as the Api
# Dockerfile: TutorHub.sln references test projects outside this context).
RUN dotnet restore TutorHub.Worker/TutorHub.Worker.csproj

COPY . .
RUN dotnet publish TutorHub.Worker/TutorHub.Worker.csproj -c Release -o /app/publish --no-restore

# Runtime stage. aspnet (not plain runtime): the jobs push realtime
# notifications through SignalR IHubContext, which lives in the shared
# framework. No EXPOSE/curl: the worker serves no HTTP (health = logs).
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "TutorHub.Worker.dll"]
