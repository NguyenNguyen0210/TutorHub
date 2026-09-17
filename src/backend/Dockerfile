# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Directory.Build.props .
COPY TutorHub.Api/TutorHub.Api.csproj TutorHub.Api/
COPY TutorHub.Domain/TutorHub.Domain.csproj TutorHub.Domain/
COPY TutorHub.Application/TutorHub.Application.csproj TutorHub.Application/
COPY TutorHub.Infrastructure/TutorHub.Infrastructure.csproj TutorHub.Infrastructure/

# Restore the API project, NOT the solution. TutorHub.sln also references the four
# test projects, which live in src/test — outside this build context (src/backend) —
# so `dotnet restore TutorHub.sln` failed with MSB3202 x4 and the image never built.
RUN dotnet restore TutorHub.Api/TutorHub.Api.csproj

COPY . .
RUN dotnet publish TutorHub.Api/TutorHub.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# docker-compose probes /health with `curl -f`; the aspnet runtime image ships no
# curl/wget, so the probe always exited 127 and the container was permanently
# "unhealthy".
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "TutorHub.Api.dll"]
