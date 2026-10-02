# Cadrage principal pour les agents IA

## Mission et lecture obligatoire

Construire QUI-EST-CE à trois selon CADRAGE.md. Lire README.md, docs/CONTRATS.md, docs/INTEGRATION.md et la fiche docs/roles/ du rôle indiqué. Le cadrage fixe les règles du jeu ; ce fichier fixe les règles de travail. Si aucun rôle ou lot n'est indiqué, demander lequel prendre avant les modifications métier.

Le dépôt contient un socle, des contrats et des exemples. Les fixtures ne sont ni un moteur ni une preuve de fonctionnement du réseau. Signaler les fonctionnalités et vérifications encore absentes.

## Règles de code habituelles

- YAGNI : pas d'abstraction, option, config ou dépendance sans besoin réel.
- SRP : 1 fonction, classe, module ou composant = 1 rôle. Extraire si duplication ou complexité.
- Taille : viser <300 lignes/fichier. Si >500, extraire avant d'ajouter.
- Reuse : chercher l'existant avant de créer.
- Validation : aux frontières du système. Éviter les doublons internes.
- Erreurs : gérer près de la source. Pas de catch silencieux sauf fallback voulu.
- Types/contrats : préférer des types ou schémas explicites. Séparer données externes et modèles internes si transformation.
- Interfaces : tout changement de contrat doit être répercuté chez les consommateurs.
- Scope : diff minimal. Pas de renommage, déplacement ou reformatage hors tâche.
- Code mort : supprimer. Ne rien laisser commenté « au cas où ».
- Vérif : changement non trivial → check minimal pertinent. Signaler si non lancé.
- Secrets/PII : jamais commit ni log de secrets ou données sensibles.
- Données : action destructive ou migration risquée → accord explicite + backup/rollback.
- Sécurité : auth, rôles, permissions et isolation dans une couche de confiance. Le client n'est jamais source de vérité.
- Tests : viser l'exécution la plus rapide possible sans réduire la couverture ni la fiabilité.

## Stack et confiance

Tout code applicatif, test et script est en TypeScript strict, modules ES. Interface DOM avec Vite ; serveur Node avec ws ; tests natifs Node. Pas de framework ou de dépendance supplémentaire sans besoin concret. Node >=24.12 ; npm ci puis npm run check. Node exécute les types effaçables ; tsc vérifie les types séparément. Utiliser import type et les extensions .ts ; pas de any, @ts-ignore ou cast pour masquer une frontière non validée.

Le serveur possède les secrets, la pioche, les réponses, les budgets, la rotation, les identités et les salons. Valider les messages JSON reçus comme unknown avant usage. Les boutons UI ne remplacent pas les règles. Pour ce projet d'école, la confidentialité des secrets du jeu n'est pas une exigence de sécurité ; les vues individuelles évitent surtout les erreurs d'affichage. Aucun vrai mot de passe, token d'accès ou donnée personnelle dans le dépôt.

## Simplicité du projet scolaire

Salons en mémoire, deux joueurs maximum, aucune base de données, aucun compte, aucun jeton de reconnexion. Une déconnexion pendant la partie vaut abandon ; pour revenir, créer une nouvelle partie. Pas de versionnement de révision, cache anti-rejeu, matchmaking, infrastructure de production ou système générique sans besoin démontré. Les secrets publics autorisés sont les cibles fictives du jeu, jamais les identifiants réels des outils.

## Propriété des fichiers

| Rôle | Écritures autorisées |
| --- | --- |
| 1 — Moteur et serveur | `src/engine/**`, `src/server/**`, `tests/engine/**`, `tests/server/**` |
| 2 — Interface et client | `src/ui/**`, `public/ui/**`, index.html, `tests/ui/**` |
| 3 — Contenu et qualité | `data/**`, `public/characters/**`, `scripts/catalog/**`, `tests/catalog/**`, `tests/e2e/**`, docs/RECETTE.md |

Tous les autres fichiers sont communs : notamment `src/contracts/**`, `fixtures/**`, package*.json, tsconfig.json, .nvmrc, `.github/**`, README.md, CADRAGE.md, AGENTS.md, docs/CONTRATS.md, docs/INTEGRATION.md et les fiches de rôle. Leur modification passe par une PR commune prise par un intégrateur tournant parmi les trois personnes. Ne pas dupliquer un contrat dans son périmètre pour contourner cette règle.

## Travail agentique et fusion

1. Une session = un rôle, un lot, une branche. Préfixes moteur/, interface/, contenu/ ; socle/ pour l'intégration.
2. Commencer depuis le même socle v2 de la PR #5, de préférence après sa fusion. Ne pas conserver une branche basée sur le contrat v1.
3. Reprendre le prompt du lot dans la fiche : résultat attendu, chemins autorisés, exports publics et critères d'acceptation.
4. Livrer les lots de son rôle dans l'ordre, une petite PR par lot ; les premiers lots des trois rôles sont autonomes grâce aux fixtures et au simulateur.
5. Ne pas modifier les fichiers d'un autre rôle. Pour un besoin partagé, décrire le changement de contrat et tous les consommateurs dans une PR commune ; continuer les travaux indépendants pendant sa préparation.
6. Avant fusion : actualiser avec main, npm ci, npm run check et contrôle métier pertinent. Pour l'intégration UI réelle, npm run build:ui. Ne pas retirer des contrôles pour rendre la CI verte.
7. La PR précise le lot, les fichiers possédés, les exports, les commandes/résultats, les limites et le lien vers l'issue. Relire humainement le diff et les règles avant fusion.
8. Ne pas pousser directement sur main. Les accès collaborateurs et protections GitHub doivent être configurés par le propriétaire ; ce fichier ne les active pas.

Aucune garantie absolue de fusion : les périmètres réduisent les conflits textuels ; les contrats, la compilation et la recette détectent les incompatibilités de comportement. Ne pas annoncer « 100 % compatible » sans ces vérifications.

## Outils locaux

Si rtk est installé, préfixer les commandes shell avec rtk conformément à la préférence du propriétaire. Sinon utiliser les commandes normales : aucun chemin personnel ni outil local n'est requis pour contribuer. Ne pas copier de fichiers privés de configuration dans le dépôt.
