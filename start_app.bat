@echo off

set IMAGE_NAME=node-python-app
set CONTAINER_NAME=node-python-container

echo ===============================
echo   Build de l'image Docker...
echo ===============================
docker build --no-cache -t %IMAGE_NAME% .

echo ===============================
echo   Suppression de l'ancien conteneur (si existe)...
echo ===============================
docker rm -f %CONTAINER_NAME% 2>nul

echo ===============================
echo   Lancement du conteneur...
echo ===============================
docker run -d -p 3000:3000 --env-file .env --name %CONTAINER_NAME% %IMAGE_NAME%

echo ===============================
echo   Terminé !
echo ===============================
pause
