# Recette et backlog

Cette liste sert aux trois rôles et à leurs agents. Au démarrage, les scénarios métier sont non exécutés : le dépôt ne contient pas encore de jeu.

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
| Portraits | Les 11 attributs correspondent à chaque fiche | Non exécuté |
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

La propriété supplémentaire d'unicité après retrait de chaque attribut est contrôlée ; elle ne prouve pas la possibilité de gagner en six actions. Les portraits restent à null (lot C2) et les scénarios applicatifs ci-dessus restent non exécutés. Aucun test de moteur, d'interface ou de WebSocket n'est ajouté dans C1.

## Intégration commune

1. Vérifier les PR de chaque rôle et les tests locaux.
2. Dans une PR d'intégration, charger le catalogue final dans le serveur et brancher createWebSocketClient dans l’interface.
3. Ajouter la commande de lancement au README et les contrôles métier à la CI.
4. Exécuter les scénarios ci-dessus ; remplacer « non exécuté » par résultat, preuve et éventuel défaut.
5. Faire jouer une personne extérieure au groupe et noter les ambiguïtés.

## Collaboration GitHub

Une branche par tâche, une PR par livraison et une relecture par une autre personne. Tourner le rôle d'intégrateur entre les trois développeurs. Utiliser le modèle de PR fourni.

Le propriétaire doit inviter les deux autres personnes lorsque leurs pseudos GitHub sont connus. Ne pas inventer d'assignations. Le dépôt public ne donne pas automatiquement le droit de pousser. Les règles de protection de main sont à configurer séparément.
