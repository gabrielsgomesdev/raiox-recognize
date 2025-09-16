@echo off
cd /d %~dp0

:: Inicia o servidor
start cmd /k "npm run start:server"

:: Inicia o ngrok
start cmd /k "ngrok http 3000"

:: Inicia o watcher
start cmd /k "npx tsx src/watcher.ts"

exit