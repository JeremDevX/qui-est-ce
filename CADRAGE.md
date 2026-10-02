# Cadrage du projet QUI-EST-CE ?

Construire à trois un jeu jouable et compréhensible : identifier une personne parmi 24, en éliminant les personnages incompatibles avec les réponses. Ce document fixe les règles et les frontières de travail pour permettre trois développements en parallèle avec des agents IA.

## Périmètre de la première version

- 24 personnages fictifs possédant chacun les 11 attributs ci-dessous.
- Modes solo et duo.
- Pioche aléatoire du personnage à deviner.
- Six tours maximum pour trouver le personnage.
- Questions oui/non uniquement, portant chacune sur un seul attribut.
- Un type d'attribut ne peut être utilisé qu'une fois par joueur et par partie, quelle que soit la valeur demandée.
- Un attribut tiré au hasard au démarrage est interdit pendant toute la partie.
- Deux personnages ne peuvent pas partager les mêmes 11 attributs.
- Pénalité sur mauvaise proposition : défaite immédiate ou perte d'un tour, selon la variante choisie au démarrage.

## Les 11 attributs

Les valeurs ci-dessous sont des conventions proposées pour le socle. Elles décrivent uniquement des personnages fictifs et doivent être visibles sans ambiguïté dans les portraits.

| Attribut | Identifiant | Valeurs du contrat |
| --- | --- | --- |
| Couleur de cheveux | hairColor | noir, brun, blond, roux, blanc, aucun |
| Lunettes | glasses | oui / non |
| Couleur de peau | skinTone | claire, intermediaire, foncee |
| Femme / Homme | gender | femme, homme |
| Boucles d'oreilles | earrings | oui / non |
| Piercings | piercing | oui / non ; piercing visible hors boucles d'oreilles |
| Habits | clothing | tshirt, chemise, pull, veste ; vêtement principal |
| Couleur des yeux | eyeColor | marron, bleu, vert |
| Jeune / Vieux | ageGroup | jeune, vieux ; catégorie du personnage fictif |
| Longueur des cheveux | hairLength | aucun, court, long |
| Moustache / barbe | facialHair | aucune, moustache, barbe, les_deux |

Une question teste l'égalité d'un attribut avec une valeur : « Porte-t-il des lunettes ? » ou « Ses cheveux sont-ils blonds ? ». Pas de question composée, de comparaison d'âge libre ou de texte libre interprété par une IA.

## Décisions proposées pour démarrer

Ces choix précisent les ambiguïtés de la demande ; ils peuvent être révisés en équipe avant l'implémentation. Toute modification doit mettre à jour le cadrage, les contrats, les exemples et les consommateurs concernés.

| Sujet | Choix de départ |
| --- | --- |
| Support | Web, TypeScript strict, interface DOM avec Vite, serveur Node et WebSocket ws |
| Solo | Le programme tire un secret ; le joueur pose des questions et propose un nom |
| Duo | Deux joueurs dans deux navigateurs ou onglets, dans un salon WebSocket ; chacun a sa cible et joue à tour de rôle |
| Budget duo | Six actions maximum par joueur ; compteurs et attributs utilisés séparés |
| Attribut interdit duo | Un même attribut interdit pour les deux joueurs |
| Pénalité par défaut | Défaite immédiate sur mauvaise proposition |
| Variante perte d'un tour | La mauvaise proposition consomme exactement une action, sans coût supplémentaire |
| Élimination | Automatique d'après les réponses ; toutes les cartes restent consultables |
| Dernier tour | Une bonne proposition à la sixième action gagne ; une question à la sixième action sans victoire épuise le budget |

En duo, les cibles sont tirées indépendamment, avec remise : elles peuvent être identiques. Les joueurs rejoignent un salon puis indiquent qu'ils sont prêts. Le serveur démarre lorsque tous sont prêts et calcule les réponses et tours. Chaque interface reçoit la vue de son joueur. Pour ce projet scolaire, la confidentialité des cibles fictives n'est pas une exigence de sécurité ; aucun compte ni jeton d'accès n'est nécessaire.

Une fermeture de connexion pendant la partie vaut abandon. Pas de reprise automatique : recommencer une partie. Les salons sont en mémoire et disparaissent au redémarrage du serveur. Le duo sur un seul appareil avec écran de passage est remplacé par le duo réseau.

Un joueur qui trouve sa cible gagne immédiatement. Un joueur qui perd ou épuise ses actions sort de la rotation ; l'autre continue jusqu'à trouver sa cible ou épuiser son budget. Si les deux échouent, la partie se termine sans gagnant.

## Déroulement et priorités des règles

1. Valider le catalogue, choisir le mode et la pénalité, puis tirer les cibles et l'attribut interdit.
2. Afficher les 24 cartes, le budget restant et les attributs disponibles.
3. À chaque action, vérifier que la partie est active et que c'est le tour du joueur.
4. Pour une question, vérifier l'attribut, sa valeur, l'interdiction et l'absence d'utilisation précédente.
5. Une question valide coûte une action, marque le type d'attribut utilisé et renvoie oui/non. Garder les candidats compatibles avec toutes les réponses.
6. Une proposition valide coûte une action. Une bonne réponse gagne, même à la sixième action. Une mauvaise réponse applique la pénalité ; dans la variante perte d'un tour, elle élimine aussi la carte proposée.
7. Après une action sans victoire, un budget à zéro entraîne la défaite du joueur. En duo, passer au joueur encore actif.

Une action rejetée (attribut interdit, répété, valeur inconnue, mauvais joueur, personnage inconnu ou partie terminée) ne consomme aucun tour et ne modifie aucun état. Une proposition peut viser n'importe quel personnage connu, même déjà éliminé ; l'interface demande confirmation pour limiter les erreurs de clic.

Par convention de jeu, la vue affiche la cible seulement à la fin globale ; ce masquage est pédagogique, pas une exigence de confidentialité. Le moteur reste l'autorité pour les réponses, les tours et les restrictions ; un bouton désactivé dans l'interface ne suffit pas.

## Répartition et autonomie

| Rôle | Fichiers possédés | Livrables | Substitut disponible dès le départ |
| --- | --- | --- | --- |
| 1 — Moteur et serveur | src/engine/, src/server/, tests/engine/, tests/server/ | Règles, tirages, salons et serveur WebSocket | fixtures/characters.json |
| 2 — Interface et expérience | src/ui/, public/ui/, index.html, tests/ui/ | Grille, actions, client WebSocket, attente et fin, accessibilité | fixtures/game-views.json et client simulé dans src/ui/ |
| 3 — Contenu et qualité | data/, public/characters/, scripts/catalog/, tests/catalog/, tests/e2e/, docs/RECETTE.md | Catalogue, portraits, contrôles, équilibrage et recette | Catalogue initial et contrats ; scénarios sans moteur |

Les autres fichiers sont communs et réservés aux PR de socle, prises par un intégrateur tournant parmi les trois personnes. La matrice et l'ordre des lots sont dans docs/INTEGRATION.md ; AGENTS.md reprend toutes les règles de code et de collaboration.

Le moteur reçoit le catalogue en argument. Le serveur utilise le catalogue final lorsqu'il existe, sinon le catalogue initial. L'interface dépend de GameClient, implémenté par son propre simulateur puis son client réseau. Les trois premiers lots de chaque rôle sont réalisables sans livraison des autres ; la recette réelle intervient après raccordement.

## Qualité attendue

- Le catalogue possède exactement 24 IDs et 24 signatures d'attributs uniques.
- Objectif supplémentaire d'équilibrage : rester identifiable même après retrait de n'importe quel attribut. Le catalogue initial respecte cette propriété ; elle va au-delà de la règle d'unicité des 11 attributs.
- Six actions rendent la victoire possible, sans la garantir pour toute stratégie. Ne pas promettre la solvabilité universelle sans analyser les chemins de questions et le coût de la proposition finale.
- Les portraits montrent les attributs sans dépendre uniquement de la couleur ; descriptions textuelles, libellés et navigation clavier sont requis.
- Tests rapides ciblés pour chaque rôle, puis recette intégrée solo et duo.
- Les cibles fictives peuvent être publiques ; aucun vrai identifiant privé, mot de passe, token des outils ou contenu personnel dans ce dépôt.

## Hors périmètre initial

Comptes, classement, base de données, reconnexion avancée, protection de production, chatbot de questions, déploiement payant et images de personnes réelles. N'ajouter ces éléments que pour un besoin validé par l'équipe.

## Fin du projet

Le projet est terminé lorsque les règles passent les tests, que les 24 portraits correspondent au catalogue, que solo et duo sont jouables au clavier et sur petit écran, et que les scénarios de docs/RECETTE.md sont vérifiés. Le README doit alors indiquer la commande réelle pour lancer le jeu et les limites encore présentes.
