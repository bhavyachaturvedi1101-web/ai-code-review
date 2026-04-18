@echo off
echo ================================
echo   AI Code Review - Starting...
echo ================================

start "AI Review - Backend" cmd /k "title Backend ^& mvn spring-boot:run -f "%~dp0backend\pom.xml""

echo Waiting for backend...
timeout /t 20 /nobreak > nul

start "AI Review - Frontend" cmd /k "title Frontend ^& cd /d "%~dp0frontend" ^& npm run dev"

timeout /t 8 /nobreak > nul
start http://localhost:5173

echo Done! Keep both windows open.
pause
