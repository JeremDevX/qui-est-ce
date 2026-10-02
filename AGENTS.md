# Consignes pour les agents IA

## Avant de coder

Lire README.md, CADRAGE.md, docs/CONTRATS.md et la fiche du rôle assigné dans docs/roles/. Si aucun rôle n'est indiqué, demander lequel prendre avant toute modification métier.

Le dépôt est un socle de travail, pas encore un jeu fonctionnel. Les fixtures ne sont pas une implémentation du moteur. Ne pas annoncer un scénario testé si seul un exemple statique a été validé.

## Périmètre

- Rôle 1 : src/engine/ et tests/engine/.
- Rôle 2 : src/ui/, public/ui/, index.html et tests/ui/.
- Rôle 3 : data/, public/characters/, scripts/, tests/catalog/ et docs/RECETTE.md.
- Contrats et socle commun : PR distincte, impact sur les trois consommateurs documenté.
- Chercher l'existant avant de créer. Ne pas toucher au périmètre d'un autre rôle pour contourner une dépendance : utiliser les fixtures ou un adaptateur conforme au contrat.

## Code

- YAGNI : pas d'abstraction, option, configuration ou dépendance sans besoin réel.
- SRP : une fonction, classe, module ou composant = un rôle. Extraire si duplication ou complexité.
- Viser moins de 300 lignes par fichier. Au-delà de 500, extraire avant d'ajouter.
- Valider aux frontières du système ; éviter les validations internes en double.
- Gérer les erreurs près de la source ; pas de catch silencieux sauf fallback voulu et documenté.
- Types et contrats explicites. Toute modification de contrat doit être répercutée chez ses consommateurs.
- Diff minimal : pas de renommage, déplacement ou reformatage hors tâche.
- Supprimer le code mort. Ne pas laisser de code commenté « au cas où ».
- Ne jamais committer ni journaliser de secrets ou de données sensibles.
- Action destructive ou migration risquée : accord explicite et backup/rollback.
- Le moteur fait respecter les règles ; l'interface n'est jamais source de vérité. Un futur mode réseau doit placer secrets et règles dans une couche de confiance côté serveur.

## Travail avec l'IA

1. Une tâche, un rôle et une branche par session. Préfixes : moteur/, interface/, contenu/.
2. Donner à l'agent le résultat attendu, les fichiers autorisés et les critères de la fiche de rôle.
3. Demander un plan court, puis implémenter par petites PR vérifiables. Pas de refonte générale ni de nouvelle stack sans besoin explicite.
4. Exécuter le contrôle pertinent le plus rapide sans réduire la couverture ni la fiabilité ; npm test valide le socle. Signaler tout contrôle non lancé.
5. Relire humainement les règles, le diff et les résultats des tests avant fusion.
6. Résumer dans la PR : comportement obtenu, contrat touché, vérifications et limites.

Ne pas supprimer les contrôles pour faire passer la CI. Ne pas remplacer les tests du moteur par les fixtures de vue. Ne pas pousser directement sur main lors du développement en équipe. La protection de branche et les accès collaborateurs devront être configurés par le propriétaire ; leur présence n'est pas garantie par ce fichier.
