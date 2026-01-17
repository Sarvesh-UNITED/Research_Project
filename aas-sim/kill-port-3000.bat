@echo off
echo Finding and killing process on port 3000...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing process %%a
    taskkill /f /pid %%a
)

echo Done.