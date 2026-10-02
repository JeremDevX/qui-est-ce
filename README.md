# QUI-EST-CE ?

Projet scolaire à trois : deviner un personnage parmi 24 en six actions maximum, avec des questions oui/non et un attribut interdit tiré au hasard.

Le dépôt contient le cadrage et le socle TypeScript. Le moteur, l'interface et le serveur WebSocket restent à développer dans les trois issues.

## Commencer

1. Lire [AGENTS.md](AGENTS.md), [CADRAGE.md](CADRAGE.md) et [les contrats v2](docs/CONTRATS.md).
2. Prendre une issue : [moteur/serveur #2](https://github.com/JeremDevX/qui-est-ce/issues/2), [interface/client #3](https://github.com/JeremDevX/qui-est-ce/issues/3), [contenu/qualité #4](https://github.com/JeremDevX/qui-est-ce/issues/4).
3. Utiliser la [fiche de rôle](docs/roles/) et son prompt, puis une branche et une petite PR par lot.
4. Respecter [la matrice de fichiers et l'ordre d'intégration](docs/INTEGRATION.md).

Node >=24.12 ; TypeScript strict pour le code, les scripts et les tests. Interface DOM/Vite, serveur Node/ws, tests natifs Node ; aucune base de données ni compte.

```sh
npm ci
npm run check
```

Les contrôles vérifient aujourd'hui les types, le catalogue initial et les exemples statiques. Ils ne prouvent pas encore le fonctionnement d'un moteur ou du réseau.

npm run dev:ui et npm run build:ui sont préparés pour le lot interface ; ils fonctionneront après livraison de index.html et src/ui/main.ts. Le serveur et sa commande de lancement seront livrés avec le rôle 1 et la PR d'intégration.

## Trois rôles

| Rôle | Responsabilité | Départ autonome |
| --- | --- | --- |
| [1 — Moteur et serveur](docs/roles/01-moteur.md) | Règles, pioche, tours, salons WebSocket | Catalogue initial injecté et tests moteur |
| [2 — Interface et client](docs/roles/02-interface.md) | Écrans, grille, clavier et client WebSocket | GameClient simulé et vues fournies |
| [3 — Contenu et qualité](docs/roles/03-contenu-qualite.md) | Personnages, portraits, équilibrage, recette | Catalogue, contrôles et scénarios écrits |

Les lots 1 à 3 peuvent progresser en parallèle. Le dernier raccordement et la recette réelle nécessitent les trois livraisons. L'intégrateur tourne parmi les trois personnes ; aucun quatrième rôle.

## Documents et exemples

- [Cadrage et règles](CADRAGE.md)
- [Contrats moteur et WebSocket](docs/CONTRATS.md)
- [Intégration et fusions](docs/INTEGRATION.md)
- [Recette](docs/RECETTE.md)
- [Catalogue initial](fixtures/characters.json)
- [Vues simulées](fixtures/game-views.json)
- [Types du jeu](src/contracts/game.ts) et [protocole](src/contracts/protocol.ts)

Les personnages sont fictifs ; portraits et équilibrage final restent à réaliser. Projet scolaire simple : salons en mémoire, fermeture = abandon, pas de reconnexion transparente. Les secrets du jeu peuvent être inspectables ; aucun identifiant réel des outils dans le dépôt.
