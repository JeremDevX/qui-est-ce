# Catalogue de travail — lot C1

characters.json reprend à l'identique les 24 personnages fictifs de fixtures/characters.json. Les IDs c01 à c24 restent stables ; seuls les fichiers du rôle 3 sont modifiés.

Depuis la racine du dépôt, avec Node >=24.12 :

```sh
node scripts/catalog/validate.ts
node --test tests/catalog/catalog.test.ts
```

Le contrôle lit le catalogue réel, vérifie les domaines du contrat v2, les 11 champs, les IDs et les signatures uniques, ainsi que la cohérence cheveux absents/couleur absente. Un catalogue invalide produit un message explicite et un code de sortie 1.

Les portraits sont à null pour C1. Les futurs chemins partent de la racine publique, par exemple /characters/c01.svg ; leur existence et leur cohérence visuelle seront vérifiées en C2. Les noms et attributs sont fictifs ; aucun média tiers n'est ajouté dans ce lot.

La validation exige aussi des signatures distinctes après retrait de chacun des 11 attributs. Cette propriété d'équilibrage est supplémentaire à l'unicité des 11 attributs demandée par les règles. Elle ne prouve pas qu'une stratégie puisse toujours gagner en six actions, proposition finale comprise : cette analyse appartient à C3.

Export livré : validateCatalog(value: unknown): Character[] dans scripts/catalog/catalog.ts. Il rejette les entrées invalides, ne transforme pas les valeurs et ne modifie pas l'entrée. Ce contrôle est indépendant du moteur et de l'interface ; aucune partie réelle n'est testée par C1.
