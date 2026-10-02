# QUI-EST-CE ?

Projet de groupe à trois : deviner un personnage parmi 24 en six tours maximum, avec des questions oui/non et un attribut interdit tiré au hasard.

Ce dépôt contient le cadrage et le socle de collaboration. Le jeu reste à développer.

## Commencer

1. Lire [CADRAGE.md](CADRAGE.md), puis [les contrats](docs/CONTRATS.md).
2. Choisir un rôle : [moteur](docs/roles/01-moteur.md), [interface](docs/roles/02-interface.md) ou [contenu et qualité](docs/roles/03-contenu-qualite.md).
3. Donner [AGENTS.md](AGENTS.md) et la fiche du rôle à son agent IA.
4. Créer une branche et livrer une petite pull request avec les vérifications effectuées.

Le socle utilise JavaScript avec modules ES, des types de contrat et les tests natifs de Node. Aucun paquet à installer. Base proposée : application web locale sans compte ni serveur, pour limiter les dépendances entre les trois personnes.

```sh
npm test
```

Cette commande valide le catalogue et les exemples de contrat. Elle ne teste pas encore un moteur ou une interface fonctionnels.

## Trois rôles autonomes

| Rôle | Responsabilité | Travail immédiat sans autre livraison |
| --- | --- | --- |
| 1 — Moteur et règles | État de partie, questions, pioche, tours, victoire et défaite | Développer sur le catalogue initial et tester les transitions |
| 2 — Interface et expérience | Écrans, grille, questions, clavier et duo local | Développer avec les vues simulées fournies |
| 3 — Contenu et qualité | Personnages, portraits, équilibrage, validation et recette | Améliorer le catalogue, créer les portraits et préparer les scénarios |

Les contrats sont disponibles dès le premier commit. L'intégration finale reste un travail commun, mais aucun rôle n'attend qu'un autre termine pour commencer.

## Documents et exemples

- [Cadrage et règles](CADRAGE.md)
- [Contrats et points d'intégration](docs/CONTRATS.md)
- [Recette et backlog](docs/RECETTE.md)
- [Consignes pour agents IA](AGENTS.md)
- [Catalogue initial](fixtures/characters.json)
- [Vues simulées](fixtures/game-views.json)
- [Types communs](src/contracts/game.d.ts)

Les personnages sont fictifs. Le catalogue sert de base de développement ; les portraits et l'équilibrage final sont à réaliser. Les pictogrammes ou silhouettes provisoires de l'interface doivent être présentés comme tels.
