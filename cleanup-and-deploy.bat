@echo off
echo 🧹 Starting CollabAI Repository Cleanup...

REM Create backup first
echo 📦 Creating backup...
xcopy . ..\CollabAI-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2% /E /I /Q >nul 2>&1

REM Remove old duplicate files and folders
echo 🗑️ Removing old duplicate files...
if exist "app\layout.tsx" del "app\layout.tsx" >nul 2>&1
if exist "app" rmdir /s /q "app" >nul 2>&1
if exist "components" rmdir /s /q "components" >nul 2>&1
if exist "Procfile" del "Procfile" >nul 2>&1

REM Remove node_modules and build artifacts
echo 🗑️ Removing build artifacts...
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules" >nul 2>&1
if exist "backend\node_modules" rmdir /s /q "backend\node_modules" >nul 2>&1
if exist "frontend\.next" rmdir /s /q "frontend\.next" >nul 2>&1
if exist "backend\dist" rmdir /s /q "backend\dist" >nul 2>&1

REM Remove old deployment configs
echo 🗑️ Removing old deployment configs...
if exist "frontend\Procfile" del "frontend\Procfile" >nul 2>&1
if exist "frontend\netlify.toml" del "frontend\netlify.toml" >nul 2>&1
if exist "frontend\railway.json" del "frontend\railway.json" >nul 2>&1
if exist "frontend\nixpacks.toml" del "frontend\nixpacks.toml" >nul 2>&1
if exist "backend\railway.json" del "backend\railway.json" >nul 2>&1
if exist "backend\vercel.json" del "backend\vercel.json" >nul 2>&1
if exist "frontend\next.config.js" del "frontend\next.config.js" >nul 2>&1

echo 📝 Creating comprehensive .gitignore...
(
echo # Dependencies
echo node_modules/
echo .pnp
echo .pnp.js
echo.
echo # Production builds
echo .next/
echo out/
echo dist/
echo build/
echo.
echo # Environment files
echo .env
echo .env.local
echo .env.development.local
echo .env.test.local
echo .env.production.local
echo.
echo # IDE files
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo.
echo # OS files
echo .DS_Store
echo Thumbs.db
echo.
echo # Logs
echo npm-debug.log*
echo yarn-debug.log*
echo yarn-error.log*
echo lerna-debug.log*
echo.
echo # Cache
echo .cache/
echo .parcel-cache/
echo .eslintcache
echo.
echo # Temporary files
echo *.tmp
echo *.temp
echo.
echo # Testing
echo coverage/
echo.
echo # Misc
echo *.tgz
echo *.tar.gz
echo.
echo # Local development
echo .vercel
echo .railway
echo.
echo # Backup files
echo *-backup-*
) > .gitignore

echo ✅ Cleanup completed!
echo.
echo 🚀 Next steps:
echo 1. Review the changes
echo 2. Test locally: npm run dev
echo 3. Commit changes: git add . ^&^& git commit -m "cleanup: Prepare for production deployment"
echo 4. Push to GitHub: git push origin main
echo 5. Deploy frontend to Vercel
echo 6. Deploy backend to Render
echo.
echo 📁 File structure is now clean and deployment-ready!
pause
