# Contrats entre les trois rôles

Le contrat v1 est fourni avant les développements. Sa référence de types est src/contracts/game.d.ts. Les modules JavaScript peuvent utiliser ces types via JSDoc ; aucun compilateur TypeScript n'est requis pour le socle.

## Catalogue

Un personnage possède id, name, portrait (chemin local relatif ou null) et attributes. Les 11 champs sont obligatoires, avec les domaines de valeurs du cadrage. IDs stables : un changement de nom ou de portrait ne change pas l'ID.

Le rôle 3 livre data/characters.json et public/characters/. Le rôle 1 reçoit la liste par createGame ; l'interface la reçoit via GameView. Aucun rôle ne dépend d'une livraison distante.

## API du moteur

Le rôle 1 livrera src/engine/index.js avec createGame(options, random?). random est une fonction injectée renvoyant un nombre dans [0, 1), Math.random par défaut. Elle permet des tests reproductibles de pioche et d'interdiction sans exposer les secrets dans les options publiques.

- options contient characters, mode et penalty.
- createGame renvoie un GamePort avec getView() et dispatch(action).
- getView() fournit un instantané détaché : le modifier ne modifie pas l'état interne.
- dispatch(action) renvoie { ok: true, view } ou { ok: false, error, view }.
- Une action mal formée ou illégale renvoie une erreur explicite et la vue inchangée. Le catalogue invalide au démarrage déclenche une erreur explicite.
- Le port est synchrone pour le MVP local ; aucun réseau ni événement asynchrone ajouté au contrat.

Actions : question { type: 'question', playerId, attribute, value }, proposition { type: 'guess', playerId, characterId } et passage { type: 'ready', playerId }.

Le duo démarre en phase handoff pour p1. Après chaque action valide non terminale, la phase passe à handoff pour le prochain joueur actif ; seule ready du joueur attendu ouvre playing. Le passage ne coûte aucune action. En solo, ready est rejetée et la partie démarre en playing.

## Vue publique

GameView contient le mode, la pénalité, l'état global, la phase, le joueur attendu, l'attribut interdit, le catalogue public, les états des joueurs et le gagnant éventuel.

En playing, currentPlayer contient uniquement le joueur actif : compteur restant, IDs candidats, attributs utilisés et historique. Les états publics des joueurs contiennent seulement leurs IDs et statuts. En handoff, currentPlayer est null : pas de candidats ni d'historique du joueur précédent. En finished, currentPlayer est null et revealedTargets contient les cibles des joueurs. revealedTargets reste null avant finished.

Une vue ne contient ni seed de pioche, ni cible cachée, ni état privé d'un autre joueur. Les attributs de toutes les cartes sont publics. En local, cette séparation limite les fuites accidentelles dans l'UI ; elle ne constitue pas une protection contre l'inspection du programme.

## Exemples disponibles

fixtures/game-views.json donne des vues solo initiale, solo après réponse, passage duo et fin victorieuse. Le rôle 2 construit son adaptateur simulé dans src/ui/, sans modifier les fixtures communes : il peut proposer un choix de scénario et des réponses simulées. Il doit indiquer ce mode dans son écran de développement et ne pas prétendre appliquer les règles réelles.

À l'intégration, remplacer seulement l'objet GamePort simulé par createGame. Le rôle 2 possède le point d'entrée de la page. L'intégrateur ajoute la commande de lancement et la CI métier dans une PR commune.

## Évolution du contrat

Toute PR de contrat indique la raison, les consommateurs affectés et met à jour types, fixtures, cadrage et tests concernés. Ne pas fusionner une rupture tant que les adaptations des consommateurs ne sont pas disponibles. Les travaux sans rupture continuent en parallèle sur v1.
