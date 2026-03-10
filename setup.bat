@echo off
SET PATH=C:\Program Files\nodejs;%PATH%
cd /d "C:\Users\DELL\Downloads\SHIFT_UP\Site SHIFT UP"
echo === Node version ===
node --version
echo === npm version ===
npm --version
echo === npm install --legacy-peer-deps ===
npm install --legacy-peer-deps
echo === EXIT CODE: %ERRORLEVEL% ===
