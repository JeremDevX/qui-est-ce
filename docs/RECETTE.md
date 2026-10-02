# Recette et backlog

Cette liste sert aux trois rôles et à leurs agents. À la livraison C3, seuls le catalogue, les portraits et l'analyse sont vérifiés. Tous les scénarios applicatifs restent **à exécuter en C4**, sur le vrai moteur, serveur et client raccordés.

## État C4 — bloqué par les livraisons applicatives

Vérification du 2 octobre 2026, sur main au commit d2b054b (C3 fusionné). Les références distantes ont été actualisées ; aucune PR ouverte ni branche moteur/interface n'est disponible. Sous src/, seuls src/contracts/game.ts et src/contracts/protocol.ts existent. Ce constat porte sur le dépôt publié, pas sur d'éventuels travaux locaux des autres personnes.

| Prérequis absent | Responsable et suivi | Conséquence pour C4 |
| --- | --- | --- |
| src/engine/index.ts et createGame réel | Rôle 1, [issue #2](https://github.com/JeremDevX/qui-est-ce/issues/2), M1/M2 | Aucune partie réelle ni vérification des pénalités/sixième action |
| src/server/server.ts, startServer et src/server/index.ts | Rôle 1, issue #2, M3/M4 | Pas de serveur à lancer/importer ; impossible de tester salons, alternance et abandon via ws |
| index.html, src/ui/main.ts et client WebSocket raccordé | Rôle 2, [issue #3](https://github.com/JeremDevX/qui-est-ce/issues/3), I1–I4 | Pas d'interface jouable ; clavier, petit écran et parcours duo non exécutables |

Contrôles réellement exécutés : npm ci réussi ; npm run check réussi (TypeScript strict, 55 tests existants, aucun nouveau test intégré) ; npm run build:ui échoue avec UNRESOLVED_ENTRY / Cannot resolve entry module index.html. Reproduction : checkout du commit indiqué, npm ci, npm run build:ui. Ce résultat confirme une livraison manquante ; il ne démontre pas un défaut dans une interface déjà implémentée.

Aucun scénario du vrai jeu exécuté, aucune connexion WebSocket testée, aucun test sous tests/e2e/ ajouté : l'export public startServer n'existe pas. Aucun test ignoré, faux serveur ou moteur de substitution n'est ajouté pour annoncer une réussite. Les 55 tests du socle/catalogue/analyse ne valident pas C4. L'issue #4 reste ouverte ; C4 et la fin du rôle ne sont pas acceptés.

Reprise après publication des livraisons #2/#3 : actualiser contenu/recette avec la base intégrée, relire les contrats v2 ; npm ci, npm run check et npm run build:ui ; ajouter les tests ciblés sous tests/e2e/ utilisant uniquement startServer et ws ; exécuter les scénarios ci-dessous et consigner commit/date/preuves. Les vérifications clavier/petit écran utilisent ensuite la vraie UI raccordée. Les défauts réellement constatés seront ouverts avec reproduction dans le périmètre propriétaire.

Aucune évolution de contrat n'est demandée. La PR commune d'intégration doit ajouter dev:server, les commandes réelles au README et les contrôles applicatifs à la CI, comme prévu dans docs/INTEGRATION.md ; ces fichiers partagés ne sont pas modifiés ici. Les dépendances manquantes sont déjà suivies par les issues #2/#3, sans issue dupliquée.

## Premier lot en parallèle

| Rôle | Tâche initiale | Preuve attendue |
| --- | --- | --- |
| Moteur | Initialiser une partie avec random injecté | Tests de validation, tirage, solo et duo |
| Interface | Afficher les quatre vues simulées | Démonstration des écrans, clavier et petit écran |
| Contenu et qualité | Créer le catalogue de travail et ses contrôles | Rapport sur 24 fiches et unicité |

## Scénarios de recette

| Scénario | Résultat attendu | État initial |
| --- | --- | --- |
| Catalogue réel C1 | 24 IDs c01–c24, 11 domaines valides, signatures uniques même après retrait d'un attribut | Automatisé : scripts/catalog/validate.ts et tests/catalog/catalog.test.ts |
| Solo initial | 24 candidats, 6 actions, un attribut interdit | Non exécuté |
| Question oui/non | Une action consommée, candidats cohérents, type marqué utilisé | Non exécuté |
| Attribut répété avec autre valeur | Rejet sans changement d'état | Non exécuté |
| Attribut interdit ou valeur inconnue | Rejet sans consommation | Non exécuté |
| Bonne proposition à la sixième action | Victoire | Non exécuté |
| Question à la sixième action | Défaite par budget épuisé | Non exécuté |
| Mauvaise proposition, pénalité immédiate | Défaite immédiate du joueur | Non exécuté |
| Mauvaise proposition, perte d'un tour | Une seule action consommée et carte éliminée | Non exécuté |
| Duo | Deux compteurs, deux historiques, types utilisés indépendants | Non exécuté |
| Salon duo | Code rejoignable, deux joueurs prêts avant démarrage, p1 commence | Non exécuté |
| Déconnexion | Abandon sans coût d’action, autre joueur continue | Non exécuté |
| Salons isolés | Les actions d’un salon ne changent pas l’autre | Non exécuté |
| Message réseau invalide | Erreur explicite sans mutation | Non exécuté |
| Joueur incorrect ou action après fin | Rejet et état inchangé | Non exécuté |
| Un joueur duo échoue | L'autre continue avec ses actions restantes | Non exécuté |
| Les deux joueurs duo échouent | Fin sans gagnant | Non exécuté |
| Vue avant fin | selfPlayer correspond au destinataire, cible masquée par convention de jeu | Non exécuté |
| Portraits C2 | 24 SVG présents ; les 11 attributs correspondent à chaque fiche | Revue visuelle de la planche et contrôles automatisés C2 |
| Accessibilité | Partie au clavier, focus visible, descriptions et erreurs lisibles | Non exécuté |
| Petit écran | Cartes et actions utilisables sans débordement bloquant | Non exécuté |

## Livraison C1 — catalogue et contrôles

Le 2 octobre 2026, data/characters.json reprend les 24 fiches fictives initiales avec leurs IDs stables. Contrôle du catalogue réel et cas invalides ciblés : effectif, structure, noms, IDs, 11 attributs, domaines, cohérence cheveux, signatures et chemins de portraits. Commandes :

```sh
node scripts/catalog/validate.ts
node --test tests/catalog/catalog.test.ts
npm run check
```

Résultat C1 : validateur réussi, compilation TypeScript stricte réussie et 45 tests réussis (42 du catalogue réel, 3 du socle).

La propriété supplémentaire d'unicité après retrait de chaque attribut est contrôlée ; elle ne prouve pas la possibilité de gagner en six actions. À la livraison C1, les portraits étaient à null (avant C2) et les scénarios applicatifs ci-dessus restent non exécutés. Aucun test de moteur, d'interface ou de WebSocket n'est ajouté dans C1.

## Livraison C2 — portraits et descriptions

Le 2 octobre 2026, revue visuelle des 24 SVG dans data/portraits.html. Pour chaque fiche, comparer : couleur et longueur des cheveux, lunettes, peau, libellé Femme/Homme, boucles d'oreilles, piercing au nez, type de vêtement, yeux, libellé Jeune/Vieux et rides, moustache/barbe. Les cheveux longs restent derrière le visage et les accessoires ; les lunettes laissent les iris visibles.

Le contrôle automatique vérifie les fichiers présents/non vides, les IDs, les titres accessibles et les descriptions des 11 attributs ; il ne remplace pas la revue visuelle. Les noms et les attributs C1 sont conservés. Provenance et droits dans data/README.md.

| ID | Personnage | Portrait | Revue des 11 attributs |
| --- | --- | --- | --- |
| c01 | Alex | /characters/c01.svg | Vérifiés sur la planche |
| c02 | Camille | /characters/c02.svg | Vérifiés sur la planche |
| c03 | Sacha | /characters/c03.svg | Vérifiés sur la planche |
| c04 | Lou | /characters/c04.svg | Vérifiés sur la planche |
| c05 | Noa | /characters/c05.svg | Vérifiés sur la planche |
| c06 | Charlie | /characters/c06.svg | Vérifiés sur la planche |
| c07 | Eden | /characters/c07.svg | Vérifiés sur la planche |
| c08 | Morgan | /characters/c08.svg | Vérifiés sur la planche |
| c09 | Robin | /characters/c09.svg | Vérifiés sur la planche |
| c10 | Alix | /characters/c10.svg | Vérifiés sur la planche |
| c11 | Sam | /characters/c11.svg | Vérifiés sur la planche |
| c12 | Andrea | /characters/c12.svg | Vérifiés sur la planche |
| c13 | Max | /characters/c13.svg | Vérifiés sur la planche |
| c14 | Dominique | /characters/c14.svg | Vérifiés sur la planche |
| c15 | Claude | /characters/c15.svg | Vérifiés sur la planche |
| c16 | Ariel | /characters/c16.svg | Vérifiés sur la planche |
| c17 | Jess | /characters/c17.svg | Vérifiés sur la planche |
| c18 | Mel | /characters/c18.svg | Vérifiés sur la planche |
| c19 | Chris | /characters/c19.svg | Vérifiés sur la planche |
| c20 | Taylor | /characters/c20.svg | Vérifiés sur la planche |
| c21 | Kim | /characters/c21.svg | Vérifiés sur la planche |
| c22 | Sky | /characters/c22.svg | Vérifiés sur la planche |
| c23 | Jamie | /characters/c23.svg | Vérifiés sur la planche |
| c24 | Ash | /characters/c24.svg | Vérifiés sur la planche |

Résultats C2 : 48 tests réussis et compilation stricte réussie ; 24 SVG bien formés, fichiers présents/non vides, noms et attributs conservés ; régénération identique.

Commandes : node scripts/catalog/generate-portraits.ts, node scripts/catalog/validate.ts, npm run check. La planche n'exécute ni moteur, ni interface, ni WebSocket ; les scénarios du vrai jeu restent non exécutés. L'analyse d'équilibrage C3 est décrite ci-dessous.

## Livraison C3 — analyse du catalogue

node scripts/catalog/report-balance.ts génère data/equilibrage.md depuis le JSON réel validé : distributions, collisions et comparaison d'un ordre fixe et d'un partage équilibré adaptatif. Maximum cinq questions, sans répétition de type ni attribut interdit, puis une proposition comptée comme action.

Le partage équilibré isole les 264 couples cible/interdiction en six actions au maximum dans ce modèle. L'ordre fixe échoue pour certaines cibles. Zéro collision complète et zéro collision après retrait de chaque attribut. Les valeurs absentes et les distributions inégales sont indiquées ; aucune modification des fiches ou portraits n'est nécessaire.

Les tests vérifient le rapport reproductible, les 264 chemins, la non-mutation du catalogue et des contre-exemples : signatures distinctes mais attribut non réutilisable, sixième question nécessaire mais budget insuffisant. Ce sont des contrôles de l'analyse, pas des parties réelles. Aucun taux de victoire de joueurs ni succès moteur/réseau n'est déduit du rapport.

Résultats C3 (2 octobre 2026) : npm run check réussi, compilation stricte et 55 tests réussis ; node scripts/catalog/validate.ts réussi. Le test du rapport compare le fichier publié à sa génération. Aucun scénario applicatif exécuté.

## Préparation de la recette C4 — à exécuter

Après raccordement M3/I3 puis M4/I4 : Node >=24.12, npm ci, npm run check ; démarrer node src/server/index.ts et npm run dev:ui dans deux terminaux. Ouvrir http://localhost:5173 dans deux navigateurs ou sessions distinctes connectés au vrai ws://localhost:3001/ws. Ces commandes supposent les fichiers livrés par les autres rôles ; ils sont absents au lot C3. Le mode Simulation ne constitue pas une preuve.

Recréer une partie pour chaque cas ; choisir mode et pénalité. Relever code, interdit, budgets et historique. En duo : selfPlayer correspond au destinataire, compteurs/historiques individuels, revealedTargets=null avant la fin globale. Après fin : activePlayerId=null et cibles révélées.

Pour les cas à cible connue, le futur test C4 utilise l'API publique createGame, le catalogue réel ordonné c01…c24 et un random injecté : [0, 0.5] en solo donne c01 puis piercing interdit ; [0, 0.05, 0.5] en duo donne c01, c02 puis piercing interdit. C'est une préparation de test moteur, pas une option du navigateur ni un message réseau. En recette réseau/manuelle, tirer normalement et adapter les valeurs au tirage observé dans une instrumentation de test côté serveur, ou reproduire les actions après révélation. Ne pas ajouter de commande de choix du secret au contrat.

Les rejets empêchés par l'UI sont également tentés via le futur test moteur ou un client ws de test v2. Comparer avant/après : candidats, budget, historique, types utilisés, statuts et joueur actif. Un bouton désactivé seul ne valide pas la règle côté serveur. Aucun test applicatif n'est livré par C3.

### Solo et règles — à exécuter

| Cas | Étapes, dans une nouvelle partie sauf indication | Résultat attendu |
| --- | --- | --- |
| Initialisation | Créer un solo, choisir la pénalité, se déclarer prêt | 24 candidats, 6 actions, 1 interdit connu, p1 actif, aucun type utilisé |
| Réponse/élimination | Cible c01/interdit piercing : demander glasses=false | Oui ; 12 candidats c01,c03,…,c23 ; 5 actions ; glasses utilisé ; historique complété |
| Type répété | Après cette question, demander glasses=true | ATTRIBUTE_ALREADY_USED ; état inchangé, budget 5 |
| Interdit | Depuis le même état, demander piercing=false | FORBIDDEN_ATTRIBUTE ; état inchangé |
| Valeur inconnue | Test moteur : hairColor=violet ; puis message réseau équivalent | INVALID_VALUE au moteur ; erreur de validation v2 au réseau ; aucune mutation/consommation |
| Personnage inconnu | Proposer c99 | UNKNOWN_CHARACTER ; état inchangé |
| Victoire à l'action 6 | Cible c01/interdit piercing : glasses=false, skinTone=claire, gender=homme, earrings=false, clothing=tshirt ; puis proposer c01 | Cinq oui ; 1 action avant proposition ; dernière action consommée, p1 won, finished, winnerId=p1 |
| Question à l'action 6 | Même préparation ; demander hairColor=noir au lieu de proposer | Oui, mais budget 0 : p1 lost, finished, winnerId=null ; pas de proposition gratuite |
| Pénalité immédiate | Cible c01, immediate_loss : confirmer c02 à l'action 1 | Défaite immédiate de p1, partie finie sans gagnant ; proposition dans l'historique |
| Perte d'une action | Cible c01, lose_turn : proposer c02 à l'action 1 | Partie active, exactement 5 actions, c02 éliminé ; poursuivre et proposer c01 pour gagner |
| Erreur au dernier tour | Cible c01, lose_turn : cinq questions ci-dessus, puis c02 | Budget 0, p1 lost, fin sans gagnant ; pas de coût double |
| Chemin du rapport | Cible c01/interdit piercing : glasses=false, gender=femme, earrings=false, hairColor=noir puis c01 | Oui/non/oui/oui ; c01 seul après quatre questions ; victoire action 5, 1 action restante |
| Action après fin | Après une fin, envoyer une question via l'API/client de test | GAME_FINISHED ; état inchangé |

Une question même devenue non informative coûte une action. Une proposition vers un personnage connu déjà éliminé reste autorisée ; en lose_turn, refaire c02 coûte encore une action et ne réintroduit pas sa carte.

### Duo et salons WebSocket — à exécuter

Utiliser A/p1, B/p2 et une troisième session C pour les rejets. Les messages ont protocolVersion=2 et une commande sans playerId ; le serveur déduit l'identité de la socket. Préparer les cibles connues seulement pour les assertions de réponse/victoire selon la méthode ci-dessus.

| Cas | Étapes | Résultat attendu |
| --- | --- | --- |
| Code inconnu | C rejoint un code de six caractères absent | ROOM_NOT_FOUND ; aucun salon rejoint/créé pour C |
| Création/attente | A crée un duo ; B rejoint ; A prêt seul, puis B prêt | Lobby tant que tous ne sont pas prêts ; puis playing aux deux, p1 actif, même interdit, 6 actions chacun |
| Salon plein | C rejoint un salon à deux joueurs ou déjà commencé | ROOM_FULL ; vues A/B inchangées |
| Hors tour | Au tour de p1, B envoie une question valide via son client de test | WRONG_PLAYER pour B seulement ; les deux vues inchangées |
| Alternance/indépendance | Interdit piercing : A demande glasses=false ; B demande glasses=false | Une action chacun ; glasses utilisé indépendamment chez chacun ; retour au tour p1 |
| Pénalité immédiate | Cibles c01/c02, immediate_loss : A propose c02 ; B propose ensuite c02 | p1 lost, B conserve 6 actions et continue seul, cibles masquées ; ensuite B gagne immédiatement |
| Perte d'une action | Cibles c01/c02, lose_turn : A propose c02 puis B pose une question valide | A playing avec 5 actions ; c02 éliminé chez A uniquement ; après B, A actif |
| Deux échecs | Cibles c01/c02, immediate_loss : A propose c02 puis B propose c01 | Deux lost ; finished, winnerId=null, activePlayerId=null, cibles révélées |
| Victoire globale | À son tour, A propose sa bonne cible avant B | Fin immédiate, winnerId=p1 ; B ne peut plus agir malgré son budget |
| Abandon explicite | En partie, A envoie leave | left à A ; p1 lost sans coût d'action ; B reçoit une vue et continue avec son budget |
| Socket fermée | Nouvelle partie : fermer la session/socket de A en partie | Même abandon vu par B ; aucune réponse à la socket fermée, aucune reprise automatique |
| Départ en lobby | B quitte, C rejoint ; dans un autre lobby, A quitte | Premier : A attend, C devient p2 ; second : salon et connexions restantes fermés |
| Isolation | Créer deux salons ; agir dans le premier | État du second inchangé |
| Messages invalides | JSON cassé, version 1, puis action avec playerId ou cible injectée | INVALID_MESSAGE pour structure/JSON/champs interdits ; UNSUPPORTED_VERSION pour version ; aucune mutation |
| Action hors partie | Action sans salon, puis action en lobby | NOT_JOINED puis NOT_STARTED ; aucune mutation |

Pour le sixième tour duo, rejouer les deux cas solo de sixième action en alternant avec des actions légales du second joueur. Chaque joueur conserve son compteur ; le perdant sort de la rotation, l'autre continue. Tester les deux pénalités séparément.

### Clavier et petit écran — à exécuter

1. Sans souris, parcourir avec Tab/Shift+Tab : mode, pénalité, création/join, code, prêt, questions, cartes. Focus visible, ordre compréhensible, étiquettes/erreurs lisibles et interdit annoncé.
2. Utiliser Entrée/Espace sur les commandes prévues ; choisir une valeur et poser une question. Lire réponse, budget et éliminations. Attente réseau/tour adverse empêchent les doubles actions ; focus utilisable après réception.
3. Ouvrir une proposition et annuler : aucun coût ni historique. Rouvrir, confirmer une fois, terminer une partie et en démarrer une nouvelle au clavier.
4. En duo, faire join/prêt et une alternance au clavier dans les deux sessions. Après fermeture adverse, lire l'abandon et poursuivre ; côté déconnecté, nouvelle partie proposée sans reconnexion automatique.
5. À largeur 320 px puis écran normal : 24 cartes consultables, descriptions et actions accessibles sans débordement bloquant. Les attributs ne dépendent pas seulement des couleurs.

### Consigner l'exécution C4

Pour chaque cas : date, commit, mode/pénalité, navigateur, interdit, étapes réelles, attendu/observé et preuve utile (capture, test ou message reçu). Remplacer « à exécuter » uniquement après exécution réelle. Ouvrir tout défaut reproductible dans le périmètre moteur/serveur ou interface, sans corriger ces fichiers dans le lot contenu. Un contrôle du catalogue ou une fixture ne valide pas un scénario réseau.

## Intégration commune

1. Vérifier les PR de chaque rôle et les tests locaux.
2. Dans une PR d'intégration, charger le catalogue final dans le serveur et brancher createWebSocketClient dans l’interface.
3. Ajouter la commande de lancement au README et les contrôles métier à la CI.
4. Exécuter les scénarios ci-dessus ; remplacer « non exécuté » par résultat, preuve et éventuel défaut.
5. Faire jouer une personne extérieure au groupe et noter les ambiguïtés.

## Collaboration GitHub

Une branche par tâche, une PR par livraison et une relecture par une autre personne. Tourner le rôle d'intégrateur entre les trois développeurs. Utiliser le modèle de PR fourni.

Le propriétaire doit inviter les deux autres personnes lorsque leurs pseudos GitHub sont connus. Ne pas inventer d'assignations. Le dépôt public ne donne pas automatiquement le droit de pousser. Les règles de protection de main sont à configurer séparément.
