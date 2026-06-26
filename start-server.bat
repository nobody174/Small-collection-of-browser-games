@echo off
REM Simple batch script to start the Donut Empire test server
REM Double-click this file to run the server

cd /d "%~dp0"
node server.js
pause
