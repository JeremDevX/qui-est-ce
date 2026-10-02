# Catalogue et portraits — lots C1 et C2

characters.json reprend les noms et les 11 attributs des 24 personnages fictifs de fixtures/characters.json, avec les chemins des portraits C2. Les IDs c01 à c24 restent stables ; seuls les fichiers du rôle 3 sont modifiés.

Depuis la racine du dépôt, avec Node >=24.12 :

```sh
node scripts/catalog/validate.ts
node --test tests/catalog/*.test.ts
node scripts/catalog/generate-portraits.ts
```

Le contrôle lit le catalogue réel, vérifie les domaines du contrat v2, les 11 champs, les IDs et les signatures uniques, ainsi que la cohérence cheveux absents/couleur absente. Un catalogue invalide produit un message explicite et un code de sortie 1.

Les 24 portraits SVG sont livrés sous public/characters/, aux chemins /characters/c01.svg à /characters/c24.svg. Le validateur vérifie leur présence et refuse les fichiers vides. La planche data/portraits.html permet de les revoir avec les descriptions des 11 attributs : l'ouvrir directement dans un navigateur. Ce n'est pas une interface du jeu.

## Provenance et droits

Dessins vectoriels originaux créés spécialement pour ce projet scolaire à l'aide de l'assistant de développement, par le code TypeScript de scripts/catalog/portrait.ts. Aucun média téléchargé, photo, personne réelle, police embarquée ou service de génération d'images. L'équipe peut réutiliser et modifier ces dessins pour le projet ; aucune licence générale du dépôt n'est ajoutée par ce lot.

Le générateur reconstruit les SVG, la planche et les chemins dans le catalogue. Il conserve les IDs, noms et attributs ; relire le diff après régénération si un portrait a été modifié à la main. Les formes des vêtements, la longueur des cheveux, les rides et les accessoires donnent des repères visuels. Femme/Homme et Jeune/Vieux sont indiqués explicitement ; ne pas inférer le genre d'un personnage d'après sa coiffure ou sa pilosité. Les descriptions de chaque SVG et de la planche complètent les couleurs pour l'accessibilité.

La validation exige aussi des signatures distinctes après retrait de chacun des 11 attributs. Cette propriété d'équilibrage est supplémentaire à l'unicité des 11 attributs demandée par les règles. Elle ne prouve pas qu'une stratégie puisse toujours gagner en six actions, proposition finale comprise : cette analyse appartient à C3.

Export livré : validateCatalog(value: unknown): Character[] dans scripts/catalog/catalog.ts. Il rejette les entrées invalides, ne transforme pas les valeurs et ne modifie pas l'entrée. Ce contrôle est indépendant du moteur et de l'interface ; aucune partie réelle n'est testée par C1 ou C2.

Export C2 : validatePortraitFiles(characters: Character[], publicRoot?: URL): Promise<void>, dans scripts/catalog/check-portraits.ts. Ce contrôle complète celui du JSON sans changer le contrat Character.
