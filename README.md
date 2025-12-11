# SDD1003-Projet-Final

# Lancement de l'application

## Prérequis
Assurez-vous d'avoir installé et lancé Docker
Dans le dossier racine, créez un fichier ```.env``` et ajouter la variable ```MONGODB_URI=<Votre string de connection mongodb>```

## Exécution
Ouvrez un terminal, placez-vous à la racine du projet et exécutez la commande ```docker compose up``` pour lancer l'application.
Vous pourrez accéder à l'application via cette l'adresse ```http://localhost:3000/```.
Pour arrêter le programme, toujours dans le terminal, appuyez 2 fois sur Ctrl+C.
Pour supprimer le conteneur, exécuter la commande ```docker compose down```.

