# Rôle 3 — Contenu, équilibrage et qualité

Tu combines création de contenu, game design et automatisation de la qualité. Ce rôle comporte du développement, mais ses livrables peuvent démarrer indépendamment du moteur et de l'interface.

## Périmètre

data/, public/characters/, scripts/, tests/catalog/ et docs/RECETTE.md. Copier la base fixtures/characters.json dans data/characters.json pour travailler sans modifier les fixtures communes.

## Livraisons

1. Catalogue final de 24 personnages avec attributs explicites et IDs stables.
2. Contrôles automatisés du nombre, des valeurs, de l'unicité et de la cohérence cheveux/longueur.
3. Portraits originaux ou utilisables avec droits documentés, descriptions et concordance attribut par attribut.
4. Rapport d'équilibrage : répartition des valeurs, collisions après retrait d'un attribut, exemples de chemins gagnants/perdants en six actions.
5. Recette solo/duo et vérification intégrée lorsque les livraisons arrivent.

## Critères d'acceptation

- 24 personnages valides et aucun doublon des 11 attributs.
- Objectif du socle : aucun doublon après retrait d'un attribut ; toute régression est justifiée en équipe.
- Portraits lisibles à taille de carte, avec attributs visibles sans ambiguïté.
- Un contrôle des portraits est humain ; un test du JSON seul ne prouve pas leur cohérence visuelle.
- Pas de promesse que chaque partie est gagnable en six actions sans analyse dédiée.
- Les scénarios de recette peuvent être préparés avant toute implémentation ; leurs résultats restent « non exécutés » jusqu'à vérification réelle.

## Prompt prêt à donner à l'agent

« Prends le rôle 3 du projet QUI-EST-CE. Lis AGENTS.md, CADRAGE.md, docs/CONTRATS.md et docs/roles/03-contenu-qualite.md. Sur une branche contenu/catalogue, crée le catalogue de travail dans data/ à partir des fixtures et les contrôles dans scripts/ ou tests/catalog/. Respecte les IDs et domaines de valeurs. Prépare le rapport d'équilibrage et complète la recette sans inventer des résultats exécutés. N'implémente pas le moteur ni l'interface. »
