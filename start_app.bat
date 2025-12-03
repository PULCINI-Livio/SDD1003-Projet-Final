@echo off
REM ==========================================
REM This script builds and starts the Docker containers for the project
REM ==========================================

REM Optional: make sure environment variables from .env are loaded
IF NOT EXIST .env (
    echo WARNING: .env file not found!
) ELSE (
    echo Loading environment variables from .env
    for /f "usebackq tokens=*" %%a in (.env) do set %%a
)

REM Build the containers
echo Building Docker containers...
docker-compose build

REM Start the containers in detached mode
echo Starting Docker containers...
docker-compose up -d

REM Show status of running containers
echo Containers started:
docker ps

echo.
echo Your Node.js app should be running on port 3000
pause