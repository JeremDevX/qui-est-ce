# QUI-EST-CE ?

Jeu de déduction en solo ou en duo. Devinez un personnage parmi 24 en six actions maximum. Les questions appellent une réponse oui ou non, et un attribut tiré au sort ne peut pas être utilisé.

## Lancer le jeu

Installez Node.js 24.12 ou une version ultérieure. Depuis la racine du dépôt, installez les dépendances.

```sh
npm ci
```

Dans un premier terminal, démarrez le serveur WebSocket.

```sh
npm run dev:server
```

Dans un deuxième terminal, démarrez l’interface.

```sh
npm run dev:ui
```

Ouvrez [l’interface sur localhost](http://localhost:5173). Si Vite affiche un autre port, utilisez l’adresse du terminal. Le jeu se connecte par défaut au serveur local sur `ws://localhost:3001/ws`.

- **Solo.** Choisissez Solo et une pénalité, créez le salon, puis cliquez sur « Je suis prêt ».
- **Duo.** Créez un salon Duo et relevez son code. Ouvrez la même adresse dans un deuxième onglet ou navigateur, saisissez le code et cliquez sur « Rejoindre ». Cliquez sur « Je suis prêt » dans les deux onglets. Les joueurs jouent ensuite à tour de rôle.

## Vérifier le projet

```sh
npm run check
npm run build:ui
```

GitHub Actions lance l’installation, le contrôle TypeScript, les tests et la compilation de l’interface. Les tests couvrent notamment le catalogue, les règles et les échanges WebSocket. Les vérifications dans le navigateur sont consignées dans la [recette C4](docs/RECETTE.md). Le [ticket d’intégration finale](https://github.com/JeremDevX/qui-est-ce/issues/19) suit la validation sur `main` et l’essai par une personne extérieure au groupe.

## Limites du jeu

Les salons restent en mémoire et disparaissent au redémarrage du serveur. Chaque salon accueille au plus deux joueurs. Fermer un onglet pendant une partie vaut abandon. Pour rejouer, créez ou rejoignez un nouveau salon. Le jeu fonctionne sans compte ni sauvegarde. Les personnages sont fictifs.

Le mode Simulation présente des exemples d’écrans. Pour jouer une partie, utilisez le serveur WebSocket.

## Documentation

- [Règles du jeu](CADRAGE.md)
- [Contrats moteur et WebSocket](docs/CONTRATS.md)
- [Contributions et ordre d’intégration](docs/INTEGRATION.md)
- [Catalogue et provenance des portraits](data/README.md)
