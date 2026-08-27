# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Directory.Build.props .
COPY TutorHub.sln .
COPY TutorHub.Api/TutorHub.Api.csproj TutorHub.Api/
COPY TutorHub.Domain/TutorHub.Domain.csproj TutorHub.Domain/
COPY TutorHub.Application/TutorHub.Application.csproj TutorHub.Application/
COPY TutorHub.Infrastructure/TutorHub.Infrastructure.csproj TutorHub.Infrastructure/

RUN dotnet restore TutorHub.sln

COPY . .
RUN dotnet publish TutorHub.Api/TutorHub.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "TutorHub.Api.dll"]
