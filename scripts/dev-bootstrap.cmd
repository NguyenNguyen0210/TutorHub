@echo off
REM Wrapper cho dev-bootstrap.ps1: nhiều máy Windows chặn chạy file .ps1 trực tiếp
REM (ExecutionPolicy). Dùng: scripts\dev-bootstrap.cmd [-Force] [-SkipBuild]
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-bootstrap.ps1" %*
exit /b %ERRORLEVEL%
