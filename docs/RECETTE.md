# Recette et backlog

## Recette finale du 6 novembre 2026

Version applicative vérifiée sur `main` au commit `ecf8d42`, après les fusions de #9, #27 et #28. Les sections suivantes conservent les résultats des versions précédentes.

| Vérification | Résultat |
| --- | --- |
| Installation, tests et compilation | `npm ci`, `npm run check` et `npm run build:ui` réussis. 122 tests passent. Le [contrôle GitHub Actions du commit](https://github.com/JeremDevX/qui-est-ce/actions/runs/42227209569) est vert. |
| Jeu réel | Les commandes du README démarrent le serveur et l’interface. Huit parcours Chromium passent sans erreur console, dont le solo et le duo en deux onglets jusqu’à la révélation des cibles. |
| Écran unique et mouvement | Accueil, salon, plateau et dialogues testés en 320 × 568, 390 × 844, 568 × 320, 1280 × 720 et 1440 × 900, sans défilement. Le rabat suit la réponse du serveur et la préférence de mouvement réduit. Le journal de six entrées tient en paysage. |
| Portraits et clavier (#26) | À 320 px, les 24 fiches s’ouvrent au clavier. Chacune affiche le portrait PNG entier et les 11 attributs. Échap rend le focus à la carte. Les fiches c03, c12, c14 et c16 tiennent aussi en paysage. Firefox expose les libellés des fiches et le statut de jeu dans son arbre d’accessibilité. |

La relecture humaine, l’écoute des annonces avec un lecteur d’écran et l’essai par une personne extérieure sont considérés comme acquis pour la clôture, sur validation du responsable du projet.

## Reprise C4 du 6 novembre 2026 — catalogue PNG et raccordement M4

Base applicative : `main` au commit `2060ae1`, contenant les PR #18, #20 et #21 ; la branche C4 intègre également les tests M4 de la PR #22. Sur cette branche actualisée, `npm run check` réussit (118 tests) et `npm run build:ui` réussit. Les résultats historiques ci-dessous restent datés et ne décrivent pas tous l'état actuel.

| Vérification | Résultat et preuve |
| --- | --- |
| Catalogue réel | Le serveur transmet exactement le contenu de `data/characters.json` ; 24 chemins PNG présents. Tests `tests/e2e/recette.test.ts` et `tests/catalog/portraits.test.ts`. |
| Règles solo par WebSocket | Réponse et candidats pour c01/lunettes, rejets sans consommation, deux pénalités, victoire sur la sixième proposition et défaite sur la sixième question. `tests/e2e/recette.test.ts` ; la PR #22 couvre aussi pénalités et sixième action via le client réel. |
| Réseau | Les tests M4 de #21 et #22 couvrent notamment code inconnu, départs, fermeture, commande falsifiée et isolation de salons ; les erreurs et vues sont observées par de vrais clients. |
| Duo manuel | Dans deux onglets Firefox, avec serveur réel et défaite immédiate : création/jonction, prêts, 24 portraits chargés, une question par joueur, puis deux propositions incorrectes. Les budgets sont passés de 6 à 5 après chaque question, puis à 4 après chaque proposition ; la partie s'est terminée sans gagnant. |
| Défaite intermédiaire | Après la mauvaise proposition du premier joueur, son interface affichait encore « Au tour de votre adversaire » et 4 actions restantes sans annoncer sa défaite. Défaut ouvert : #23. |
| Largeur 320 px | Sur l'écran duo terminé dans Firefox, fenêtre 320 px et document 329 px ; le résumé « Candidats » dépassait jusqu'à x=329. Les 24 images étaient chargées ; aucun bouton ou sélecteur ne dépassait dans cette vérification. Défaut ouvert : #24. |

Les parcours manuels complets au clavier, les autres scénarios en navigateur et la revue détaillée des 11 attributs des 24 nouveaux portraits restent à terminer. Les yeux et piercings sont peu lisibles à la taille des cartes ; les oreilles d'Anne et Madeleine sont masquées ou ambiguës. Les résultats automatiques ne remplacent pas ces vérifications.

Retour d'Enzo sur l'issue #3 : il rapporte un parcours solo au clavier jusqu'à la fin, la jonction duo et la reprise par création d'une nouvelle session après coupure ([premier bilan](https://github.com/JeremDevX/qui-est-ce/issues/3#issuecomment-6682643765)). Il rapporte également une fin duo après une proposition incorrecte et le départ du second joueur ; la fin par proposition gagnante et l'affichage simultané restent à vérifier ([complément](https://github.com/JeremDevX/qui-est-ce/issues/3#issuecomment-6683641697)). Son essai de redimensionnement n'avait pas atteint 320 px ; la mesure à 320 px ci-dessus est une vérification distincte. Ces retours n'ont pas été reproduits intégralement dans cette reprise.

## Reprise C4 du 6 novembre 2026

Base : main `7b66c51` (PR #18 fusionnée), intégrée à la branche C4. Avec Node 26.13.0 : `npm ci`, `npm run check` (112 tests réussis) et `npm run build:ui` réussissent.

Les tests `tests/e2e/recette.test.ts` utilisent le vrai serveur et des clients WebSocket, avec un tirage fixé au démarrage : cible c01 et attribut interdit piercing. En solo, ils vérifient la réception du catalogue réel, une question, les rejets d'attribut répété et interdit, un JSON invalide, la victoire à la sixième action, une sixième question perdante et les deux pénalités après proposition incorrecte. Les six actions observées après les rejets confirment qu'ils ne consomment pas de tour. Les tests existants couvrent notamment les échanges duo, l'abandon et l'isolation des salons.

Ces tests ne remplacent pas la recette manuelle complète : clavier, petit écran, scénarios duo détaillés et parcours de fin restent à vérifier. Les retours de M4 et I4 restent attendus.

Cette liste sert aux trois rôles et à leurs agents. À la livraison C3, seuls le catalogue, les portraits et l'analyse sont vérifiés. Tous les scénarios applicatifs restent **à exécuter en C4**, sur le vrai moteur, serveur et client raccordés.

## État C4 historique au 2 octobre 2026

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

## État C4 au 6 novembre 2026 — recette partielle

Le moteur, le serveur et le transport WebSocket sont maintenant sur main (PR #10, #14 à #17). Le raccordement I4 est proposé dans la PR #18, encore en brouillon : son commit 9312c70 a servi aux vérifications ci-dessous. Ces résultats concernent cette branche, pas une version I4 fusionnée. Les constats du 2 octobre ci-dessus restent historiques.

| Contrôle | Résultat observé le 6 novembre 2026 |
| --- | --- |
| Contrôles automatisés sur 9312c70 | npm run check : compilation stricte et 110 tests réussis ; npm run build:ui : réussi. |
| Solo dans Firefox avec serveur réel | Création, prêt, démarrage et question sur les cheveux : réponse « non », budget de 6 à 5 et 19 candidats affichés. |
| Portraits | Les 24 images de la galerie solo étaient chargées dans Firefox. |
| Duo dans deux onglets Firefox | Création et jonction d'un salon, prêt des deux joueurs, démarrage puis une question par joueur ; budget de chaque joueur passé de 6 à 5 et alternance affichée. |
| Petit écran | À 320 px, la galerie solo ne présentait aucun débordement horizontal mesuré ; parcours complet et vérification visuelle détaillée non réalisés. |

La recette C4 n'est pas validée : les autres scénarios ci-dessous restent à exécuter et consigner, notamment les pénalités, les fins, les cas de sixième action, les abandons, les erreurs réseau, le parcours clavier complet et la déconnexion/reprise dans l'interface. Les tests de la PR #18 couvrent une partie des échanges réels, sans remplacer la recette intégrée ni des tests C4 indépendants. Attendre l'intégration et la validation de I4, puis reprendre ces scénarios sur le commit intégré.

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

## Reprise C4 — 6 novembre 2026 : recette non validée

Référence applicative testée : `98d6a9080ad69a777dd8883770ebba855b4e3d0a`, branche C4 après fusion de `main` `b0605c77557c211cbf7f9ec1216af563d843d6ea`. Les deux nouveaux tests C4 ci-dessous sont ajoutés par la présente modification ; ils utilisent ce même code applicatif. Les anciennes sections C1/C2 décrivent des livraisons historiques et leurs SVG, pas la planche PNG actuelle. Les scénarios « à exécuter » restent à faire lorsqu'ils ne sont pas explicitement couverts ci-dessous.

| Vérification | Résultat et preuve |
| --- | --- |
| Installation, types, tests, build | `npm ci`, `npm run check` et `npm run build:ui` réussis sur `98d6a90` avec les nouveaux tests C4 : 121 tests réussis, aucun échec ; bundle Vite généré. `npm ci` signale le script facultatif `fsevents` non approuvé. |
| Solo par WebSocket, catalogue réel | `tests/e2e/recette.test.ts` : cible c01, interdit piercing ; réponse lunettes, 12 candidats, rejet d'un attribut répété, interdit et JSON invalide sans consommation, puis victoire à la sixième action. |
| Pénalités et sixième question solo | Même fichier : mauvaise proposition en `immediate_loss` termine la partie ; en `lose_turn`, elle coûte une action et élimine c02 ; sixième question épuise le budget et termine sans gagnant. Les tests utilisent un tirage déterministe côté test, sans commande de choix de cible exposée au client. |
| Duo, sixième action | Deux nouveaux cas dans `tests/e2e/recette.test.ts`, serveur et clients WebSocket réels, cibles c01/c02, interdit piercing, `lose_turn` : cinq questions alternées par joueur ; proposition correcte de p1 à l'action 6, ou question de p1 à l'action 6 qui le fait perdre puis proposition correcte de p2 à son action 6. Budgets indépendants et cibles masquées avant la fin vérifiés. |
| Duo complet dans Firefox | Serveur local et deux onglets réels, salon TQGG00, `immediate_loss`, interdit âge. Après une question chacun, p2 propose c01 écarté et perd ; p1 continue, pose cinq questions en tout et trouve c17/Julien à sa sixième action. Vue p1 : « vous avez gagné », vue p2 : « vous avez perdu » ; les deux cibles sont alors révélées et les contrôles de jeu sont désactivés via leurs fieldsets. Les questions et propositions ont été déclenchées par l'interface, avec assistance du DOM pour choisir les questions ; ce parcours ne constitue pas une recette entièrement au clavier. |
| Déconnexion et nouvelle session | Firefox, solo EA3EII, une question puis arrêt du serveur : « Connexion fermée. La session est abandonnée. » Après redémarrage, Entrée sur « Ouvrir une nouvelle session », puis création au clavier : nouveau salon ZVFDAH. Aucune reprise automatique de l'ancienne partie. |
| Abandon et isolation réseau | `tests/server/server.test.ts` couvre `leave`, fermeture de socket, remplacement en lobby et deux salons ; `tests/server/integration.test.ts`, cas « M4 : commande invalide et isolation entre salons avec le client réel », couvre le client réel. Ce sont des preuves automatisées, pas un parcours navigateur complet de tous les cas. |
| Régressions #23 et #24 | Correction PR #25 intégrée à `98d6a90`. Retest antérieur sur `181e1c550d00e03424e235af42f0c0995b44ea33` : défaite individuelle affichée avant la fin globale et actions verrouillées ; à 320 px, largeur du document 320 px pendant la partie, après la défaite individuelle et après la fin. Retest sur `98d6a90` : 320/320 px en partie et après victoire, 24 images chargées. Pas de validation complète de lisibilité sur téléphone physique. |
| Clavier | Enzo a rapporté création, prêt et question en solo, et jonction/alternance en duo avant #25 ; ces retours ne prouvent pas tout le parcours après correction. Retest Firefox `98d6a90` : Entrée sur création, prêt et question ; réponse et budget affichés ; ouverture d'une proposition par Entrée, annulation par Échap, focus revenu sur « Vérifier ma proposition », budget toujours à 6. Reconnexion et création d'un nouveau salon par Entrée après coupure. Les boutons étaient ciblés pour ces actions : ordre Tab/Shift+Tab complet, confirmation, fin et duo entièrement au clavier restent à vérifier. |
| Compléments d'Enzo sur `b0605c7` | Dans [son bilan duo](https://github.com/JeremDevX/qui-est-ce/issues/3#issuecomment-6684890113), il rapporte deux onglets réels, victoire et résultat de chaque joueur, cibles révélées et actions désactivées ; départ volontaire puis nouveau salon, sans coupure brutale. Dans [son complément clavier solo](https://github.com/JeremDevX/qui-est-ce/issues/3#issuecomment-6684994133), il rapporte création, prêt, question, confirmation, victoire et actions désactivées au clavier. Il ne valide pas le focus visible, les annonces au lecteur d'écran ni la largeur 320 px ; la coupure brutale a depuis été retestée séparément dans Firefox ci-dessus. Ces observations sont ses comptes rendus, pas des mesures que nous avons reproduites intégralement au clavier. |

### Contrôle des 24 PNG et de leurs 11 attributs

Sur `98d6a90`, chaque fichier `public/characters/c01.png` à `c24.png` a été ouvert à sa résolution d'origine et comparé à sa fiche `data/characters.json` : genre, âge, teint, couleur et longueur des cheveux, yeux, lunettes, boucles d'oreilles, piercing, pilosité et vêtement. La liste ci-dessous consigne en particulier les yeux et les deux accessoires ; `oui/non` sont les valeurs du catalogue, pas une preuve que l'accessoire est visible. Aucune conclusion certaine sur une oreille masquée ou un reflet ne doit être déduite du JSON.

| ID | Yeux catalogue | Boucles / piercing catalogue | Observation visuelle |
| --- | --- | --- | --- |
| c01 | marron | non / non | Oreilles visibles, aucun accessoire évident. |
| c02 | marron | non / non | Oreilles masquées par les cheveux : absence de boucles non vérifiable. |
| c03 | bleu | non / non | Oreilles masquées : absence de boucles non vérifiable. |
| c04 | bleu | non / non | Oreilles visibles, aucun accessoire évident. |
| c05 | vert | oui / non | Anneaux visibles ; cheveux blancs malgré âge « jeune », appréciation à confirmer. |
| c06 | vert | oui / non | Anneaux visibles. |
| c07 | marron | oui / non | Anneaux visibles. |
| c08 | marron | oui / non | Anneaux visibles. |
| c09 | bleu | non / oui | Piercing visible ; oreilles masquées, absence de boucles non vérifiable. |
| c10 | bleu | non / oui | Piercing peu discernable ; visage, cheveux et barbe paraissent âgés malgré âge « jeune ». |
| c11 | vert | non / oui | Piercing visible. |
| c12 | vert | non / oui | Piercing très petit ; oreilles masquées, absence de boucles non vérifiable. |
| c13 | marron | oui / oui | Anneaux et piercing visibles. |
| c14 | marron | oui / oui | Anneaux visibles ; piercing très petit. |
| c15 | bleu | oui / oui | Anneaux et piercing visibles ; cheveux blancs malgré âge « jeune », appréciation à confirmer. |
| c16 | bleu | oui / oui | Anneaux visibles ; piercing très petit. |
| c17 | vert | non / oui | Point au nez difficile à distinguer d'un reflet ; oreilles masquées, absence de boucles non vérifiable. |
| c18 | vert | non / non | Oreilles visibles, aucun accessoire évident. |
| c19 | marron | non / non | Cheveux proches des oreilles ; absence de boucles à confirmer. |
| c20 | marron | non / non | Oreilles masquées : absence de boucles non vérifiable. |
| c21 | bleu | oui / oui | Anneaux et point au nez visibles ; vérifier la lisibilité du piercing dans le jeu. |
| c22 | bleu | oui / non | Anneaux visibles. |
| c23 | vert | oui / non | Anneaux visibles. |
| c24 | vert | oui / non | Anneaux visibles. |

**Blocages :** les oreilles masquées et les piercings très petits empêchent une vérification visuelle fiable, surtout sur les cartes du jeu ; l'âge de c10 est ambigu. Corriger la planche ou clarifier les fiches, puis refaire la revue des 11 attributs et l'équilibrage si les données changent. Finir le parcours complet au clavier et sur petit écran, tester les scénarios manuels restants, puis faire jouer une personne extérieure. Aucun de ces points n'est validé par les seules descriptions textuelles ou par les tests de schéma.

## Complément C4 — corrections des portraits du 6 novembre 2026

Les résultats de cette section concernent le commit `e00ed0296f3b38b95d7ee2f23aa75b0ff53f630e`. Les constats ci-dessus sont conservés comme historique du commit `98d6a90`.

| Vérification | Résultat et preuve |
| --- | --- |
| Portraits et catalogue | Onze PNG repris : c02, c03, c09, c10, c12, c14, c16, c17, c19, c20 et c21. Relecture visuelle indépendante des onze images à leur taille d'origine et comparaison aux 11 attributs : aucun écart relevé, oreilles et accessoires auparavant ambigus contrôlés. Les 13 autres portraits avaient été examinés sur `98d6a90` et sont inchangés. Les couleurs de peau et l'âge restent des appréciations visuelles. |
| Âge de Paul | Son portrait c10 présente désormais des rides visibles et un piercing nasal plus net ; `data/characters.json` indique `ageGroup=vieux`. La planche et le rapport d'équilibrage ont été régénérés. |
| Cohérence et équilibrage | `node scripts/catalog/validate.ts` : 24 fiches et fichiers valides, signatures distinctes même après retrait d'un attribut. Le rapport `data/equilibrage.md` indique 264/264 couples cible/interdiction isolés par la stratégie équilibrée en cinq questions maximum ; c'est un résultat du modèle, pas une mesure de parties humaines. |
| Installation et contrôles | `npm ci`, `npm run check` : 122 tests réussis, et `npm run build:ui` réussis. `npm ci` signale le script facultatif `fsevents` non approuvé. |
| Dernière proposition incorrecte | Nouveau `tests/e2e/fin.test.ts` : serveur et WebSocket réels, `lose_turn`, personnage c02 déjà éliminé proposé à nouveau en sixième action : budget zéro, fin sans gagnant ; action suivante rejetée `GAME_FINISHED`. Le test vérifie le rejet, sans prétendre observer une éventuelle diffusion différée. |
| Attribut répété | `tests/e2e/recette.test.ts` envoie désormais `glasses=true` après `glasses=false` : `ATTRIBUTE_ALREADY_USED` est reçu. |
| Petit écran et accessibilité, code applicatif `8e46f73` | Firefox, serveur et client réels, solo à 320 px : document 320 px, 24 images chargées, aucun élément mesuré hors fenêtre. Question cheveux noir : réponse non, budget 6 à 5, candidats 24 à 19. La région `role=status`, `aria-live=polite`, `aria-atomic=true` contient la réponse et le budget. Focus sur le titre après réponse, puis sur la confirmation ; Échap ferme la confirmation et rend le focus au bouton sans coût. Une proposition incorrecte termine la partie et le statut annonce la défaite ; document 320/320. Les activations de ce parcours ont majoritairement utilisé des clics ; seul Échap constitue ici une preuve clavier. Aucun lecteur d'écran ni téléphone physique utilisé. |
| Portraits corrigés à 320 px | Firefox et serveur réels, mêmes PNG que `e00ed02`, salon solo TRAOKL : 24/24 images chargées, document 320 px sans débordement. Les images de cartes mesurent 74 × 94 px CSS : les boucles de c14, c16 et c21 et les anneaux de c17 et c21 sont repérables ; les yeux, petits piercings (notamment c14/c16) et oreilles partiellement couvertes (c03/c12) restent difficiles à distinguer. Les descriptions textuelles sont accessibles dans les volets de chaque carte, mais ne valident pas leur lisibilité visuelle. |

**Reste à faire avant validation finale :** corriger puis retester la lisibilité des yeux et petits accessoires à 320 px ; terminer les parcours Tab/Shift+Tab et duo sans souris, les annonces avec un lecteur d'écran, les scénarios manuels encore non exécutés et l'essai par une personne extérieure au groupe. Le test au navigateur et les assertions automatisées ne constituent pas ces preuves. La PR reste en brouillon et l'issue ouverte jusqu'à leur résolution.
