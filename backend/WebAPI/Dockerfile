FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# ✅ ВИПРАВЛЕНО: Додати backend/ перед шляхами
COPY ["backend/WebAPI/WebAPI.csproj", "WebAPI/"]
COPY ["backend/Application/Application.csproj", "Application/"]
COPY ["backend/Core/Core.csproj", "Core/"]
COPY ["backend/Infrastructure/Infrastructure.csproj", "Infrastructure/"]
COPY ["backend/Contracts/Contracts.csproj", "Contracts/"]

RUN dotnet restore "WebAPI/WebAPI.csproj"

# ✅ ВИПРАВЛЕНО: Копіювати тільки backend/
COPY backend/ .

WORKDIR "/src/WebAPI"
RUN dotnet build "WebAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "WebAPI.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "WebAPI.dll"]