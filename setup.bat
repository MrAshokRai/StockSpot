@echo off
REM Hackathon Setup Script for D:\hackathon\
REM Check if we're in the right directory
cd /d %~dp0

if not exist .git init
    git --initial-config user.email developer@example.com
    git --initial-config user.name HACKATHON USER
    echo "Setup complete!"
echo.
pause
