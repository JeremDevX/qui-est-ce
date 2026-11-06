# QUI-EST-CE ?

Jeu de déduction en solo ou en duo. Devinez un personnage parmi 24 en six actions maximum. Les questions appellent une réponse oui ou non, et un attribut tiré au sort ne peut pas être utilisé.

## Lancer le jeu

Installez Node.js 24.12 ou une version ultérieure. Depuis la racine du dépôt, installez les dépendances.

```sh
npm ci
```

Lancez l’interface et le serveur WebSocket avec la même commande.

```sh
npm run dev
```

Ouvrez l’adresse « Local » affichée dans le terminal. Gardez ce terminal ouvert pendant la partie.

- **Solo.** Choisissez Solo et une pénalité, créez le salon, puis cliquez sur « Je suis prêt ».
- **Duo.** Créez un salon Duo et partagez le lien affiché sous son code avec la personne sur le même réseau local. Le lien préremplit le code dans son navigateur. Elle clique sur « Rejoindre », puis chaque joueur choisit et confirme le portrait que l’autre devra deviner.

Le mode « politiquement incorrect » remplace le catalogue par des personnalités politiques réelles. Il est proposé en solo comme en duo et affiche un avertissement avant la partie. Les caractéristiques correspondent aux photos retenues. Les sources et licences sont indiquées dans [les crédits des portraits](data/politics-credits.md).

Si plusieurs adresses « Network » sont affichées, ouvrez le jeu sur celle du réseau utilisé par les deux appareils. Le salon reprend cette adresse dans son lien.

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
