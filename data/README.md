# Catalogue, portraits et équilibrage — C1 à C3

characters.json contient 24 personnages fictifs avec leurs 11 attributs et les chemins des portraits. Les IDs c01 à c24 restent stables. Les prénoms et certains attributs de pilosité ont été revus pour le style classique demandé ; la fixture initiale reste inchangée.

Depuis la racine du dépôt, avec Node >=24.12 :

```sh
node scripts/catalog/validate.ts
node --test tests/catalog/*.test.ts
node scripts/catalog/generate-portraits.ts
node scripts/catalog/report-balance.ts
```

Le contrôle lit le catalogue réel, vérifie les domaines du contrat v2, les 11 champs, les IDs et les signatures uniques, ainsi que la cohérence cheveux absents/couleur absente. Un catalogue invalide produit un message explicite et un code de sortie 1.

Les 24 portraits PNG sont livrés sous public/characters/, aux chemins /characters/c01.png à /characters/c24.png. Le validateur vérifie leur présence et refuse les fichiers vides. La planche data/portraits.html permet de les revoir avec les descriptions des 11 attributs : l'ouvrir directement dans un navigateur. Ce n'est pas une interface du jeu.

La révision conserve les 24 IDs. Les portraits c02, c03, c09, c10, c12, c14, c16, c17, c19, c20 et c21 ont été repris pour rendre les oreilles et piercings plus visibles. Paul (c10) est désormais classé « vieux » conformément à son portrait ; l'analyse d'équilibrage et la planche ont été régénérées. Les descriptions textuelles complètent les portraits. La conformité visuelle nécessite une revue humaine ; les contrôles automatiques ne peuvent pas la garantir.

## Provenance et droits

Illustrations fictives créées pour le projet avec l'outil de génération d'images intégré, puis découpées individuellement à partir de la planche générée. Onze portraits ont ensuite été retouchés avec le même outil. Aucune photo ni personne réelle n'a servi de modèle. Aucune licence générale du dépôt n'est ajoutée par ce lot.

Le générateur reconstruit uniquement la planche HTML à partir des chemins et attributs existants ; il ne modifie ni le catalogue ni les PNG. La planche et l'interface fournissent des descriptions textuelles des attributs pour l'accessibilité.

La validation exige aussi des signatures distinctes après retrait de chacun des 11 attributs. Cette propriété d'équilibrage est supplémentaire à l'unicité des 11 attributs demandée par les règles. Elle ne prouve pas qu'une stratégie puisse toujours gagner en six actions, proposition finale comprise : voir le rapport C3 ci-dessous.

Export livré : validateCatalog(value: unknown): Character[] dans scripts/catalog/catalog.ts. Il rejette les entrées invalides, ne transforme pas les valeurs et ne modifie pas l'entrée. Ce contrôle est indépendant du moteur et de l'interface ; aucune partie réelle n'est testée par C1 ou C2.

Export C2 : validatePortraitFiles(characters: Character[], publicRoot?: URL): Promise<void>, dans scripts/catalog/check-portraits.ts. Ce contrôle complète celui du JSON sans changer le contrat Character.

## Analyse C3

equilibrage.md est généré depuis le catalogue validé : distributions avec valeurs absentes, collisions projetées et comparaison de deux stratégies. Le rapport indique les cibles isolées en cinq questions maximum, puis une proposition comprise dans les six actions. Aucun personnage ou portrait n'est modifié.

Exports d'analyse dans scripts/catalog/balance.ts : attributeIds, findCollisions et traceStrategy ; types Strategy, QuestionStep, StrategyTrace. scripts/catalog/report-balance.ts exporte buildBalanceReport. Le domaine interne existant domains est maintenant exporté par catalog.ts pour réutilisation. Aucun changement des contrats partagés.

node --test tests/catalog/balance.test.ts vérifie les chemins, les limites et l'identité du rapport publié. Le modèle suppose des réponses exactes et n'exécute ni jeu ni pénalité ni WebSocket. Les étapes de recette réelle, marquées « à exécuter », sont dans docs/RECETTE.md ; elles appartiennent au lot C4.
