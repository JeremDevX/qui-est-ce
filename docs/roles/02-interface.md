# Rôle 2 — Interface et client

Issue : https://github.com/JeremDevX/qui-est-ce/issues/3

## Périmètre exclusif

`src/ui/**`, `public/ui/**`, index.html, `tests/ui/**`. Tous les autres fichiers sont hors périmètre ; voir AGENTS.md et docs/INTEGRATION.md. Les contrats v2 sont la référence. Le socle fournit les dépendances : ne pas éditer package.json ou les types en parallèle.

## Lots à livrer dans cet ordre

Une petite PR par lot. Les lots 1 à 3 sont réalisables sans livraison des autres rôles, avec les contrats et substituts. Le lot 4 vérifie le vrai raccordement.

### I1 — Structure et client simulé

Branche : `interface/structure`.

- [ ] Créer index.html et src/ui/main.ts avec interface DOM TypeScript/Vite ; aucun framework ajouté.
- [ ] Exporter createMockClient(): GameClient dans src/ui/client/mock.ts ; l’UI reçoit GameClient, sans import du moteur/serveur.
- [ ] Créer accueil mode/pénalité, grille de 24 cartes et lecture d’une GameView ; valeurs/libellés alignés sur le contrat.
- [ ] Charger les exemples depuis fixtures sans les modifier ; afficher « Simulation » et un sélecteur de scénario en développement.

**Acceptation :** npm run build:ui réussit ; l’UI affiche les scénarios sans livraison moteur ; tests de rendu/formatage ou contrôle navigateur ciblé, sans prétendre tester les règles.

### I2 — Actions et accessibilité

Branche : `interface/ecrans`.

- [ ] Ajouter sélection d’un seul attribut et de sa valeur, bouton question, proposition avec confirmation, compteur et historique oui/non.
- [ ] Désactiver les attributs interdits/utilisés et les actions pendant le tour adverse ; seul un snapshot confirme la transition.
- [ ] Afficher lobby avec code et prêts, attente adverse, erreurs compréhensibles et fin avec cibles/gagnant.
- [ ] Clavier, focus visible, labels, annonce des réponses, descriptions textuelles des attributs et petit écran. Gérer portrait null avec silhouette provisoire.

**Acceptation :** Simulation de tous les états utiles et vérification clavier/petit écran ; bonne forme Command sans playerId ; tests sous tests/ui/. Aucune duplication du moteur de règles.

### I3 — Transport WebSocket

Branche : `interface/websocket`.

- [ ] Exporter createWebSocketClient(url: string): GameClient dans src/ui/client/websocket.ts. Utiliser WebSocket natif du navigateur.
- [ ] Implémenter connexion/envoi/subscription/close ; vérifier JSON reçu avant actualisation ; gérer snapshot/error/left et socket fermée.
- [ ] Envoyer create/join/ready/action/leave au format v2. Désactiver l’action envoyée jusqu’au snapshot ou error ; aucun succès optimiste.
- [ ] Tester avec faux serveur ws dans tests/ui/ sans attendre M3 ; injecter l’URL du serveur de test. Garder le choix simulation/réel dans main.ts.

**Acceptation :** Transport testé contre messages valides/mal formés, erreur métier, fermeture et désabonnement. Utiliser la même classe WebSocket native dans le navigateur et les tests Node, sans bibliothèque UI supplémentaire. Ne pas envoyer identité/cible. npm run check et build:ui passent sans serveur métier disponible.

### I4 — Raccordement et finition

Branche : `interface/integration`.

- [ ] Brancher le mode réel sur ws://localhost:3001/ws ; garder la simulation explicitement accessible pour le travail autonome.
- [ ] Vérifier une partie solo et un duo en deux onglets avec les portraits réels ; corriger uniquement son périmètre.
- [ ] Après déconnexion, afficher un message et proposer une nouvelle partie ; aucune reprise silencieuse ou gestion de token.
- [ ] Transmettre les résultats clavier/petit écran au rôle 3 et les commandes UI à l’intégrateur.

**Acceptation :** Vraies réponses et compteurs affichés après snapshot ; alternance et fin synchronisées ; build et recette UI valides. Dépend de M3 et C2 pour la vérification finale.

## Prompt à donner à l’agent

```text
Tu prends le rôle 2 « Interface et client », lot [identifiant du lot].
Lis AGENTS.md, CADRAGE.md, docs/CONTRATS.md, docs/INTEGRATION.md et cette fiche.
Écris uniquement dans : `src/ui/**`, `public/ui/**`, index.html, `tests/ui/**`.
Utilise les types v2 et les exports prévus. Fais au plus simple pour un projet scolaire.
Implémente seulement le lot demandé, puis lance les contrôles pertinents.
Si un fichier partagé doit évoluer, décris le besoin pour une PR de socle ; ne le modifie pas dans ce lot.
La PR indique comportement livré, chemins, exports, vérifications et limites.
Ne présente pas les fixtures ou la simulation comme une fonctionnalité réelle testée.
```

## Fin du rôle

Tous les lots sont acceptés, npm run check passe et les observations du raccordement sont consignées. Une autre personne relit avant fusion. La fermeture de l’issue attend le dernier lot ; les précédentes PR mentionnent « Related to #3 ».
