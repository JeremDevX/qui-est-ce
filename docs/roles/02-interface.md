# Rôle 2 — Interface et expérience

Tu es responsable du parcours jouable, lisible et accessible. Tu peux concevoir les écrans immédiatement avec les vues simulées, sans attendre le moteur.

## Périmètre

src/ui/, public/ui/, index.html et tests/ui/. Le point d'entrée reçoit GamePort. Ne pas importer d'état interne du moteur ni recalculer les règles métier.

## Livraisons

1. Adaptateur simulé local et choix de scénarios depuis fixtures/game-views.json.
2. Accueil : mode, pénalité et explication des règles.
3. Grille de 24 cartes, candidats éliminés, descriptions, compteur et historique.
4. Question par un seul attribut et une seule valeur ; attributs indisponibles expliqués.
5. Proposition confirmée, écrans de passage duo, victoire et défaite.
6. Clavier, focus, messages d'erreur et adaptation au petit écran.

## Critères d'acceptation

- Les scénarios simulés suffisent pour montrer tous les écrans principaux.
- Un libellé explicite distingue le mode de développement simulé.
- Les erreurs du moteur sont affichées sans changer artificiellement les compteurs.
- La vue de passage ne révèle pas la grille filtrée ni l'historique précédent.
- Les attributs sont compréhensibles avec descriptions et libellés ; la couleur seule ne transmet pas une information essentielle.
- L'intégration change l'adaptateur, sans réécrire les composants.

## Prompt prêt à donner à l'agent

« Prends le rôle 2 du projet QUI-EST-CE. Lis AGENTS.md, CADRAGE.md, docs/CONTRATS.md et docs/roles/02-interface.md. Crée les premiers écrans dans ton périmètre, sur une branche interface/ecrans. Utilise un GamePort simulé local et les fixtures, sans attendre ou implémenter le moteur. Indique clairement le mode simulé. Prévois clavier et petit écran. Vérifie les parcours disponibles et signale les scénarios métier qui ne sont pas encore testables. »
