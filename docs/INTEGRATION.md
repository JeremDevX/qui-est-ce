# Travail parallèle et intégration

## Base commune

Fusionner la PR #5 contenant le socle v2 avant de démarrer ; à défaut, tous partir du même dernier commit de socle/cadrage. Ne pas repartir du précédent contrat v1. Le socle fournit déjà dépendances, compilation, CI et fixtures ; les trois rôles n'éditent pas chacun package.json.

| Zone | Responsable exclusif | Point de raccordement |
| --- | --- | --- |
| src/engine, src/server, tests/engine, tests/server | Rôle 1, issue #2 | createGame, startServer, endpoint /ws |
| src/ui, public/ui, index.html, tests/ui | Rôle 2, issue #3 | createMockClient, createWebSocketClient, main.ts |
| data, public/characters, scripts/catalog, tests/catalog, tests/e2e, docs/RECETTE.md | Rôle 3, issue #4 | characters.json, portraits, recette |
| Tous les autres chemins | Intégrateur tournant, PR commune | Types, fixtures, dépendances, CI, documentation commune |

Un seul agent écrit dans un périmètre à un instant donné. Si deux agents aident la même personne, leur répartir des sous-dossiers ou des lots successifs. Aucune PR métier ne modifie un fichier commun sans transfert explicite du lot à l'intégrateur.

## Lots et dépendances réelles

| Étape | Rôle 1 | Rôle 2 | Rôle 3 |
| --- | --- | --- | --- |
| 1, parallèle dès le socle | M1 initialisation moteur | I1 structure UI et client simulé | C1 catalogue et validation |
| 2, parallèle | M2 règles et fins | I2 écrans/actions/accessibilité simulés | C2 portraits et droits |
| 3, parallèle | M3 serveur et salons | I3 client WebSocket testé avec faux serveur | C3 rapport d'équilibrage et recette écrite |
| 4, intégration commune | M4 tests réseau et limites | I4 raccordement au vrai serveur | C4 recette intégrée et tests ciblés |

M2 dépend de M1 ; M3 de M2 ; I2 de I1 ; I3 de I2 ; C2/C3 de C1. Chaque rôle progresse sans attendre la livraison des autres jusqu'à l'étape 4. La recette du vrai jeu dépend forcément du vrai jeu : ne pas la déclarer autonome ni validée avant ce raccordement.

## Procédure par PR

1. Créer une branche au préfixe du rôle et du lot ; une PR par lot, sans mélanger les trois périmètres.
2. Livrer les exports prévus même si seuls les appels utiles au lot sont implémentés ; ne pas faire passer des stubs pour des règles testées. Ne pas fusionner de tests en échec.
3. Déclarer le lot et les chemins modifiés ; lier l'issue sans la fermer avant son dernier lot (« Related to #2 », par exemple).
4. Actualiser avec main avant la fusion et lancer npm run check ; contrôle métier rapide pertinent en complément.
5. Faire relire le contrat et le résultat par une autre personne. Fusionner les lots d'un même rôle dans leur ordre ; les rôles distincts peuvent se fusionner dans n'importe quel ordre si le contrat reste identique.
6. Sur une branche socle/integration, réunir les trois dernières livraisons, npm ci, npm run check, npm run build:ui, puis la recette solo/duo dans deux navigateurs ou onglets.

L'intégrateur ajoute la commande dev:server (node src/server/index.ts), la documentation de lancement et les contrôles UI/réseau à la CI quand ces livraisons existent. Les tests natifs restent auto-découverts sous tests/**/*.test.ts ; aucun rôle n'ajoute sa propre liste à package.json.

## Critères de fusion du jeu

- Catalogue réel utilisable, 24 portraits vérifiés et règles moteur testées.
- UI compilée sans erreur et utilisable au clavier sur petit écran.
- Création/join/prêt duo, alternance, pénalités, sixième action et abandon testés sur le vrai serveur.
- Une commande mal formée ou jouée hors tour ne modifie pas la partie.
- Deux salons simultanés ne partagent pas leur état.
- README indique les commandes réelles et les limites scolaires (mémoire, fermeture = abandon, pas de reconnexion).

Des chemins disjoints rendent les conflits textuels rares ; ils ne garantissent pas le comportement intégré. La compilation et la recette sont nécessaires. Les protections de branche GitHub sont une opération distincte du propriétaire et ne sont pas configurées par ces documents.
