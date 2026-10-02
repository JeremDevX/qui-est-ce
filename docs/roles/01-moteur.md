# Rôle 1 — Moteur et règles

Tu es responsable de la cohérence des parties. Tu développes le code des règles et leurs tests, sans attendre les portraits ou l'interface.

## Périmètre

src/engine/ et tests/engine/. Utiliser fixtures/characters.json comme catalogue initial et respecter src/contracts/game.d.ts. Pas d'import du catalogue final en dur.

## Livraisons

1. createGame, validation du catalogue, pioche et état initial solo/duo.
2. Questions oui/non, attribut interdit, attribut déjà utilisé et élimination.
3. Propositions, six actions, deux pénalités et victoire prioritaire à la sixième action.
4. Rotation duo, écran handoff/ready, joueurs éliminés et fin sans gagnant.
5. Tests des transitions et absence de secrets dans les vues actives.

## Critères d'acceptation

- random injecté permet de reproduire la pioche et l'interdiction.
- Une action rejetée laisse le budget et l'état identiques.
- Tous les candidats restants sont compatibles avec l'historique.
- Les compteurs et attributs utilisés restent propres à chaque joueur.
- Les vues sont détachées et ne révèlent les cibles qu'à la fin globale.
- Aucun accès au DOM ou import de l'interface dans le moteur.

## Prompt prêt à donner à l'agent

« Prends le rôle 1 du projet QUI-EST-CE. Lis AGENTS.md, CADRAGE.md, docs/CONTRATS.md et docs/roles/01-moteur.md. Implémente la première livraison dans src/engine/ et tests/engine/, sur une branche moteur/initialisation. Respecte le contrat v1. Utilise le catalogue fourni et une source aléatoire injectable. N'implémente pas l'interface. Lance les tests pertinents et résume le diff, les vérifications et les limites. »
