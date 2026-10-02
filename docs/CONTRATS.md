# Contrats v2 — TypeScript et WebSocket

Références uniques : src/contracts/game.ts et src/contracts/protocol.ts. Le contrat v1 JavaScript et le duo sur un seul appareil sont remplacés avant le début des lots. Les types n'effectuent pas de validation JSON à l'exécution.

## Stack minimale

Node >=24.12, TypeScript strict, interface DOM avec Vite, serveur WebSocket avec ws, tests natifs node:test. Tout code, test et script est en .ts avec types effaçables et import type. npm ci installe le socle ; npm run check compile les types et exécute les tests. Aucun framework, compte ou base de données.

## Catalogue

Character contient id, name, portrait (chemin depuis la racine publique, par exemple /characters/c01.svg, ou null) et les 11 attributes. Les IDs restent stables. Le rôle 3 livre data/characters.json et les fichiers public/characters/. Le moteur reçoit Character[] en argument ; il n'importe pas le catalogue final. Le serveur charge data/characters.json si présent, sinon fixtures/characters.json, puis valide à cette frontière. L'interface reçoit le catalogue dans GameView.

Ne pas ajouter un champ au contrat pour une description : l'interface peut construire le texte à partir des attributs publics. Les mentions de droits sont dans data/README.md.

## API du moteur — rôle 1

src/engine/index.ts exporte createGame: CreateGame. createGame(options, random?) retourne GameEngine ; random renvoie un nombre dans [0, 1), Math.random par défaut. Le test injecte sa séquence pour reproduire les tirages. Ordre : cible p1, cible p2 si duo, puis attribut interdit dans l'ordre de AttributeValues. Aucun choix de cible dans les messages réseau.

- getView(viewerId) retourne un instantané détaché, personnalisé pour ce joueur connu. Un viewer inconnu est une erreur explicite.
- dispatch(action) retourne ActionResult sans vue. Le serveur ajoute playerId depuis la connexion ; le navigateur envoie seulement Command.
- forfeit(playerId) applique un abandon : joueur perdu, rotation vers l'autre encore actif, fin sans gagnant si personne ne joue. Une partie déjà finie retourne GAME_FINISHED sans mutation.
- Catalogue invalide : erreur explicite au démarrage. Action invalide : erreur typée et aucune mutation ni action consommée.

Le moteur commence directement avec p1 actif, sans écran de passage ni action ready. La préparation des joueurs appartient au salon, avant createGame.

GameView contient viewerId et selfPlayer (uniquement candidats, historique et budget de ce joueur), même pendant le tour adverse ou après la fin. players expose id et status. activePlayerId est null à la fin ; revealedTargets est null avant la fin puis contient les cibles. L'UI désactive les actions quand activePlayerId diffère de viewerId.

Cette projection facilite le bon affichage, sans ambition de confidentialité pour le projet scolaire. Les cibles fictives peuvent être inspectables. Les vrais identifiants des outils ne sont jamais publiés.

## WebSocket — rôle 1 et rôle 2

Endpoint local : ws://localhost:3001/ws. Vite : http://localhost:5173. Ports fixes pour le développement scolaire ; pas de configuration générique. src/server/index.ts démarre le serveur ; src/server/server.ts exporte startServer(port?: number), qui retourne Promise<{ port: number; close: () => Promise<void> }>. port=0 permet les tests sans collision. Aucun lancement réseau lors de l'import de server.ts. Une origine de déploiement réelle sera cadrée seulement si demandée.

Messages texte JSON, protocolVersion: 2. Les objets exacts sont dans protocol.ts. Exemple :

```json
{"protocolVersion":2,"type":"action","command":{"type":"question","attribute":"glasses","value":true}}
```

Flux : create-room → snapshot lobby ; join-room → snapshot lobby aux deux joueurs ; ready → snapshot mis à jour ; quand tous les joueurs attendus sont prêts, création du moteur puis snapshots playing personnalisés. Solo utilise le même transport avec un joueur attendu ; duo en attend deux. Le créateur est p1, le second p2 ; six caractères alphanumériques pour un code de salon libre. Le serveur contrôle les collisions de codes et la limite de deux joueurs.

Une connexion appartient à un seul salon. create/join quand elle est déjà rattachée est rejeté avec INVALID_MESSAGE. join-room sur une partie commencée est rejeté avec ROOM_FULL. ready répété en lobby est sans effet ; après démarrage, erreur INVALID_MESSAGE. Une action avant démarrage retourne NOT_STARTED ; une action sans salon NOT_JOINED. Une action valide diffuse un snapshot à chaque participant ; une erreur est envoyée seulement à son auteur et ne modifie rien. WebSocket conserve l'ordre des messages d'une connexion ; le serveur traite les transitions du salon sans await entre lecture et mutation.

leave : retirer la connexion et envoyer left à son auteur. Fermeture de socket : même effet sans réponse. En lobby, si p2 part, p1 peut attendre un nouveau p2 ; si p1 part, fermer le salon et les connexions restantes. En partie, appeler forfeit puis diffuser les nouvelles vues à ceux qui restent. Supprimer le salon dès qu'il n'a plus de connexion. Pas de reconnexion transparente : une nouvelle connexion crée ou rejoint une nouvelle partie. Redémarrer le serveur perd les salons.

Valider JSON inconnu, version, type, valeurs et champs interdits à la frontière. Un playerId, une cible ou un catalogue dans une commande est rejeté. JSON mal formé → INVALID_MESSAGE ; version différente → UNSUPPORTED_VERSION. Les erreurs et vues respectent les types ; pas de stack technique affichée à l'utilisateur. Aucun ack, requestId, cache anti-rejeu, révision ou token de session.

## API de l'interface — rôle 2

src/ui/client/mock.ts exporte createMockClient(): GameClient. src/ui/client/websocket.ts exporte createWebSocketClient(url: string): GameClient. src/ui/main.ts choisit le client ; le reste de l'UI reçoit uniquement GameClient. Aucun import du moteur ou du serveur.

getState retourne le dernier état ; subscribe notifie les changements et retourne unsubscribe. send envoie sans prétendre que l'action a réussi ; seul le snapshot reçu confirme la transition. Désactiver une action envoyée jusqu'au prochain snapshot ou error pour éviter les doubles clics. close ferme le transport. Une rupture passe connection à closed et propose une nouvelle partie. Pas de reconnexion automatique.

Le simulateur peut exposer un sélecteur de scénarios clairement marqué « Simulation ». Les fixtures sont des exemples statiques : le simulateur n'est pas un moteur de règles. Le transport valide les messages reçus à sa frontière avant d'actualiser l'état.

## Points d'intégration et évolution

Les chemins/export ci-dessus et les valeurs d'attributs sont figés pour les lots. L'intégrateur adapte le socle dans une PR dédiée si un besoin réel apparaît, avec tous les consommateurs et exemples mis à jour. Voir docs/INTEGRATION.md pour l'ordre et les contrôles. Aucune duplication locale des contrats.
