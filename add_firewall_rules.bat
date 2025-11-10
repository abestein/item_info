@echo off
echo Adding Windows Firewall rules for Vite (5173) and Express (3000)...

netsh advfirewall firewall add rule name="Vite Dev Server - Port 5173" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="Express API Server - Port 3000" dir=in action=allow protocol=TCP localport=3000

echo.
echo Firewall rules added successfully!
echo You can now access your app from:
echo   Frontend: http://192.168.254.142:5173
echo   Backend:  http://192.168.254.142:3000
echo.
pause
