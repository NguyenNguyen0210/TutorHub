# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Directory.Build.props .
COPY src/TutorHub.sln .
COPY src/TutorHub.Api/TutorHub.Api.csproj TutorHub.Api/
COPY src/TutorHub.Domain/TutorHub.Domain.csproj TutorHub.Domain/
COPY src/TutorHub.Application/TutorHub.Application.csproj TutorHub.Application/
COPY src/TutorHub.Infrastructure/TutorHub.Infrastructure.csproj TutorHub.Infrastructure/

RUN dotnet restore TutorHub.sln

COPY src/ .
RUN dotnet publish TutorHub.Api/TutorHub.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "TutorHub.Api.dll"]
