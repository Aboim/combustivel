@echo off
title FuelSmart Portugal
echo ===================================================
echo     A iniciar o FuelSmart Portugal (Servidor Local)
echo ===================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado!
    echo Instala Python 3.x em https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo Python encontrado: 
python --version
echo.
echo A abrir o browser em http://localhost:8080 ...
start http://localhost:8080

echo.
echo Servidor a correr! Para desligares o servidor, basta fechares esta janela.
echo (Em alternativa, podes pressionar Ctrl + C)
echo.
python server.py
pause
