# Équilibrage du catalogue — C3

Rapport généré depuis data/characters.json par node scripts/catalog/report-balance.ts. Aucun moteur, interface ou serveur WebSocket exécuté.

## Distribution des 11 attributs

| Attribut | Répartition (effectif sur 24) |
| --- | --- |
| hairColor | noir : 5 ; brun : 5 ; blond : 5 ; roux : 5 ; blanc : 4 ; aucun : 0 |
| glasses | false : 12 ; true : 12 |
| skinTone | claire : 8 ; intermediaire : 8 ; foncee : 8 |
| gender | femme : 12 ; homme : 12 |
| earrings | false : 12 ; true : 12 |
| piercing | false : 16 ; true : 8 |
| clothing | tshirt : 6 ; chemise : 6 ; pull : 6 ; veste : 6 |
| eyeColor | marron : 8 ; bleu : 8 ; vert : 8 |
| ageGroup | jeune : 16 ; vieux : 8 |
| hairLength | aucun : 0 ; court : 12 ; long : 12 |
| facialHair | aucune : 6 ; moustache : 6 ; barbe : 6 ; les_deux : 6 |

false/true signifient non/oui. Une valeur absente reste affichée avec un effectif zéro.

## Collisions de signatures

Sur les 11 attributs : 0 groupe(s) de collision.

| Attribut retiré | Groupes identiques sur les 10 autres attributs |
| --- | --- |
| hairColor | 0 |
| glasses | 0 |
| skinTone | 0 |
| gender | 0 |
| earrings | 0 |
| piercing | 0 |
| clothing | 0 |
| eyeColor | 0 |
| ageGroup | 0 |
| hairLength | 0 |
| facialHair | 0 |

Cette unicité supplémentaire après retrait d’un attribut garantit seulement des signatures différentes ; elle ne garantit pas un chemin légal en six actions.

## Stratégies comparées — cinq questions puis une proposition

- Ordre fixe : premier attribut disponible qui partage les candidats ; choisir sa valeur qui minimise la plus grande branche.
- Partage équilibré : même critère, appliqué à tous les attributs disponibles à chaque étape.
- Égalités départagées par l’ordre des domaines dans scripts/catalog/catalog.ts. Questions d’égalité oui/non, un seul attribut, aucun type répété, attribut interdit exclu.
- Chaque cible est analysée séparément pour chaque interdiction. Une cible isolée est proposée à l’action suivante. Après cinq questions, plusieurs candidats = cible non garantie par cette méthode ; aucune proposition au hasard comptée comme victoire.

| Interdit | Méthode | Cibles isolées en ≤5 questions | Actions maximales des réussites, proposition incluse | Candidats maximum après arrêt | Cibles non garanties |
| --- | --- | --- | --- | --- | --- |
| hairColor | Ordre fixe | 24/24 | 6 | 1 | Aucune |
| hairColor | Partage équilibré | 24/24 | 6 | 1 | Aucune |
| glasses | Ordre fixe | 17/24 | 6 | 3 | c03, c04, c07, c09, c10, c19, c24 |
| glasses | Partage équilibré | 24/24 | 6 | 1 | Aucune |
| skinTone | Ordre fixe | 18/24 | 6 | 2 | c02, c04, c07, c18, c20, c23 |
| skinTone | Partage équilibré | 24/24 | 6 | 1 | Aucune |
| gender | Ordre fixe | 16/24 | 6 | 2 | c03, c04, c05, c10, c12, c17, c18, c23 |
| gender | Partage équilibré | 24/24 | 6 | 1 | Aucune |
| earrings | Ordre fixe | 16/24 | 6 | 2 | c03, c04, c05, c17, c18, c22, c23, c24 |
| earrings | Partage équilibré | 24/24 | 6 | 1 | Aucune |
| piercing | Ordre fixe | 16/24 | 6 | 2 | c04, c09, c10, c12, c15, c17, c18, c23 |
| piercing | Partage équilibré | 24/24 | 6 | 1 | Aucune |
| clothing | Ordre fixe | 16/24 | 6 | 2 | c04, c09, c10, c12, c15, c17, c18, c23 |
| clothing | Partage équilibré | 24/24 | 6 | 1 | Aucune |
| eyeColor | Ordre fixe | 16/24 | 6 | 2 | c04, c09, c10, c12, c15, c17, c18, c23 |
| eyeColor | Partage équilibré | 24/24 | 6 | 1 | Aucune |
| ageGroup | Ordre fixe | 16/24 | 6 | 2 | c04, c09, c10, c12, c15, c17, c18, c23 |
| ageGroup | Partage équilibré | 24/24 | 6 | 1 | Aucune |
| hairLength | Ordre fixe | 16/24 | 6 | 2 | c04, c09, c10, c12, c15, c17, c18, c23 |
| hairLength | Partage équilibré | 24/24 | 6 | 1 | Aucune |
| facialHair | Ordre fixe | 16/24 | 6 | 2 | c04, c09, c10, c12, c15, c17, c18, c23 |
| facialHair | Partage équilibré | 24/24 | 6 | 1 | Aucune |

La méthode de partage équilibré isole 264/264 couples cible/interdiction dans ce modèle.

## Exemple reproductible

Cible c01, attribut interdit piercing, méthode de partage équilibré :

| Question | Attribut = valeur | Réponse | Candidats restants |
| --- | --- | --- | --- |
| 1 | glasses = false | Oui | c01, c03, c05, c07, c09, c11, c13, c15, c17, c19, c21, c23 |
| 2 | gender = femme | Non | c01, c05, c09, c13, c17, c21 |
| 3 | earrings = false | Oui | c01, c09, c17 |
| 4 | hairColor = noir | Oui | c01 |

Proposer c01 à l’action 5 : une proposition finale est comptée dans les six actions.

## Interprétation et limites

Une stratégie choisissant chaque question adaptativement peut avoir de meilleurs résultats qu’un ordre fixe. Ces deux méthodes gloutonnes ne recherchent pas tous les arbres possibles ; leurs échecs ne prouvent pas une impossibilité pour toute stratégie.

Les réussites supposent des réponses exactes et des actions conformes au modèle. Aucune mauvaise proposition n’est tentée : les deux variantes de pénalité ne changent pas ces chemins. Une mauvaise proposition retire du budget ou termine la partie ; elle ne peut pas être considérée comme gratuite.

Cinq réponses binaires offrent au plus 32 feuilles pour 24 cibles ; cette borne théorique ne suffit pas, car seules certaines partitions sont accessibles et un attribut ne peut pas être réutilisé. Une sixième question sans proposition consomme le dernier tour et ne gagne pas.

Le catalogue et les portraits ne sont pas modifiés par le rapport. Aucun taux de victoire de joueurs réels, validation du moteur ou succès réseau n’est déduit de cette analyse. La recette applicative reste à exécuter en C4.
