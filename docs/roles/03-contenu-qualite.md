# Rôle 3 — Contenu et qualité

Issue : https://github.com/JeremDevX/qui-est-ce/issues/4

## Périmètre exclusif

`data/**`, `public/characters/**`, `scripts/catalog/**`, `tests/catalog/**`, `tests/e2e/**`, docs/RECETTE.md. Tous les autres fichiers sont hors périmètre ; voir AGENTS.md et docs/INTEGRATION.md. Les contrats v2 sont la référence. Le socle fournit les dépendances : ne pas éditer package.json ou les types en parallèle.

## Lots à livrer dans cet ordre

Une petite PR par lot. Les lots 1 à 3 sont réalisables sans livraison des autres rôles, avec les contrats et substituts. Le lot 4 vérifie le vrai raccordement.

### C1 — Catalogue et contrôle

Branche : `contenu/catalogue`.

- [ ] Copier fixtures/characters.json dans data/characters.json ; conserver les IDs c01…c24 et tous les domaines du contrat.
- [ ] Écrire les contrôles TypeScript sous scripts/catalog/ et tests/catalog/ : 24 personnages, IDs/signatures uniques, exactement 11 attributs, valeurs connues.
- [ ] Vérifier hairColor=aucun si et seulement si hairLength=aucun ; chemins portraits locaux ou null. Ne pas modifier la fixture commune.
- [ ] Comparer aussi les signatures après retrait de chacun des 11 attributs ; documenter cette exigence supplémentaire d’équilibrage.

**Acceptation :** Tests sur le catalogue réel et cas invalides ciblés ; contrôle exécutable avec node scripts/catalog/validate.ts ; aucune dépendance moteur/UI.

### C2 — Portraits et descriptions

Branche : `contenu/portraits`.

- [ ] Créer 24 portraits fictifs sous public/characters/ ; SVG simples acceptés pour limiter le travail et les dépendances.
- [ ] Représenter sans ambiguïté lunettes, yeux, habits, cheveux, accessoires et catégories du catalogue ; rester cohérent même pour des personnages atypiques.
- [ ] Renseigner portrait dans data/characters.json ; documenter provenance/droits dans data/README.md, sans images de personnes réelles.
- [ ] Contrôler fichiers manquants et cohérence visuelle ; fournir dans docs/RECETTE.md la liste de vérification par portrait. L’UI construit les descriptions depuis les attributs.

**Acceptation :** 24 chemins existants et portraits revus visuellement ; droits indiqués ; tests catalogue passent. Aucun changement de type Character ni du composant UI.

### C3 — Équilibrage et recette préparée

Branche : `contenu/equilibrage`.

- [ ] Produire data/equilibrage.md depuis un script TypeScript : distributions et collisions après retrait de chaque attribut.
- [ ] Analyser les stratégies en comptant la proposition finale dans les six actions ; ne pas conclure que l’unicité seule garantit une victoire en six coups.
- [ ] Préparer docs/RECETTE.md avec étapes/résultats attendus solo et duo : les deux pénalités, sixième action, interdit/répété, abandon, code inconnu, clavier.
- [ ] Indiquer « à exécuter » pour tout scénario sans vrai jeu ; distinguer contrôle catalogue et recette applicative.

**Acceptation :** Rapport reproductible, limites explicites et recette exécutable par une autre personne. Le moteur et l’UI ne sont pas nécessaires à ce lot.

### C4 — Recette intégrée

Branche : `contenu/recette`.

- [ ] Exécuter les scénarios sur les livraisons M3/I3 puis leurs corrections M4/I4 ; noter date, résultat et preuve utile dans docs/RECETTE.md.
- [ ] Écrire seulement les tests d’intégration rapides utiles sous tests/e2e/ en utilisant startServer et ws ; ne pas importer les internes moteur/serveur.
- [ ] Vérifier vrai catalogue, alternance, budget, pénalités et abandon ; compléter les vérifications manuelles clavier et petit écran.
- [ ] Ouvrir les défauts avec reproduction et périmètre propriétaire ; ne pas corriger le code du rôle 1 ou 2 dans sa branche.

**Acceptation :** Recette réelle consignée, contrôles intégrés passent, limites restantes explicites. Ce dernier lot dépend du jeu raccordé ; aucune annonce de succès avant exécution.

## Prompt à donner à l’agent

```text
Tu prends le rôle 3 « Contenu et qualité », lot [identifiant du lot].
Lis AGENTS.md, CADRAGE.md, docs/CONTRATS.md, docs/INTEGRATION.md et cette fiche.
Écris uniquement dans : `data/**`, `public/characters/**`, `scripts/catalog/**`, `tests/catalog/**`, `tests/e2e/**`, docs/RECETTE.md.
Utilise les types v2 et les exports prévus. Fais au plus simple pour un projet scolaire.
Implémente seulement le lot demandé, puis lance les contrôles pertinents.
Si un fichier partagé doit évoluer, décris le besoin pour une PR de socle ; ne le modifie pas dans ce lot.
La PR indique comportement livré, chemins, exports, vérifications et limites.
Ne présente pas les fixtures ou la simulation comme une fonctionnalité réelle testée.
```

## Fin du rôle

Tous les lots sont acceptés, npm run check passe et les observations du raccordement sont consignées. Une autre personne relit avant fusion. La fermeture de l’issue attend le dernier lot ; les précédentes PR mentionnent « Related to #4 ».
