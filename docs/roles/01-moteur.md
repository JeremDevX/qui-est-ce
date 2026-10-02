# Rôle 1 — Moteur et serveur

Issue : https://github.com/JeremDevX/qui-est-ce/issues/2

## Périmètre exclusif

`src/engine/**`, `src/server/**`, `tests/engine/**`, `tests/server/**`. Tous les autres fichiers sont hors périmètre ; voir AGENTS.md et docs/INTEGRATION.md. Les contrats v2 sont la référence. Le socle fournit les dépendances : ne pas éditer package.json ou les types en parallèle.

## Lots à livrer dans cet ordre

Une petite PR par lot. Les lots 1 à 3 sont réalisables sans livraison des autres rôles, avec les contrats et substituts. Le lot 4 vérifie le vrai raccordement.

### M1 — Initialisation et vues

Branche : `moteur/initialisation`.

- [ ] Créer src/engine/index.ts et exporter createGame: CreateGame ; séparer état interne et projection dans de petits modules.
- [ ] Valider les 24 personnages et les domaines d’attributs à l’entrée. Injecter random pour tirer les cibles et l’attribut interdit selon le contrat.
- [ ] Initialiser six actions par joueur, p1 actif, catalogue détaché, selfPlayer par viewer ; ne pas importer data/characters.json dans le moteur.
- [ ] Préparer dispatch/forfeit pour M2 sans annoncer les règles finies. Les fonctionnalités non livrées sont clairement indiquées dans la PR.

**Acceptation :** Catalogue invalide rejeté ; séquence de tirages reproductible ; vue p1/p2 conforme et modification de la vue sans effet interne. Tests sous tests/engine/initialisation.test.ts.

### M2 — Questions, propositions et fins

Branche : `moteur/regles`.

- [ ] Implémenter question oui/non sur un seul attribut, filtrage automatique et historique du joueur ; refuser interdit/répété/valeur inconnue sans mutation.
- [ ] Implémenter les deux pénalités, proposition connue même éliminée, bonne sixième proposition gagnante et sixième question perdante.
- [ ] Alterner les joueurs encore actifs ; victoire immédiate, un perdant sort de rotation, deux perdants terminent sans gagnant.
- [ ] Implémenter forfeit sans coût d’action et les erreurs hors tour/partie finie. Toutes les règles viennent de CADRAGE.md.

**Acceptation :** Table de transitions testée : invalides inchangés, compteurs séparés, même cible possible, sixième action, deux pénalités, abandon et fin sans gagnant. Tests moteur sans réseau.

### M3 — Serveur WebSocket et salons

Branche : `moteur/salons`.

- [ ] Créer src/server/server.ts avec startServer(port?) sans écoute à l’import ; créer src/server/index.ts pour le lancement local port 3001, endpoint /ws.
- [ ] Charger le catalogue final si disponible, sinon la fixture ; valider à cette frontière. Utiliser ws et les types partagés déjà installés.
- [ ] Implémenter create-room/join-room/ready/action/leave, codes libres de six caractères, p1/p2 liés aux connexions et un salon par connexion.
- [ ] Démarrer solo quand p1 est prêt et duo quand les deux sont prêts. Diffuser chaque vue personnalisée, erreurs seulement à l’auteur ; fermeture = abandon selon le contrat.
- [ ] Pas de comptes, tokens, base de données, révision, anti-rejeu ni reconnexion avancée.

**Acceptation :** Tests avec deux vrais clients ws et serveur port 0 : création/join/prêt, action hors tour, troisième joueur refusé, deux salons isolés, JSON invalide, fermeture/abandon ; fermer sockets et serveur en nettoyage.

### M4 — Raccordement et revue réseau

Branche : `moteur/integration`.

- [ ] Vérifier avec le vrai client du rôle 2 et le catalogue du rôle 3 ; corriger uniquement les chemins possédés par ce rôle.
- [ ] Faire exécuter les scénarios duo et solo ; vérifier départ avant/après démarrage, fin, code inconnu et socket fermée.
- [ ] Donner à l’intégrateur les commandes et limites exactes à reporter dans README/CI ; ne pas éditer soi-même ces fichiers communs dans une PR métier.

**Acceptation :** npm run check passe avec les trois livraisons ; deux onglets jouent sur /ws ; fournir les résultats et limites à la recette C4. Dépend de I3 et C1 pour le raccordement réel.

## Prompt à donner à l’agent

```text
Tu prends le rôle 1 « Moteur et serveur », lot [identifiant du lot].
Lis AGENTS.md, CADRAGE.md, docs/CONTRATS.md, docs/INTEGRATION.md et cette fiche.
Écris uniquement dans : `src/engine/**`, `src/server/**`, `tests/engine/**`, `tests/server/**`.
Utilise les types v2 et les exports prévus. Fais au plus simple pour un projet scolaire.
Implémente seulement le lot demandé, puis lance les contrôles pertinents.
Si un fichier partagé doit évoluer, décris le besoin pour une PR de socle ; ne le modifie pas dans ce lot.
La PR indique comportement livré, chemins, exports, vérifications et limites.
Ne présente pas les fixtures ou la simulation comme une fonctionnalité réelle testée.
```

## Fin du rôle

Tous les lots sont acceptés, npm run check passe et les observations du raccordement sont consignées. Une autre personne relit avant fusion. La fermeture de l’issue attend le dernier lot ; les précédentes PR mentionnent « Related to #2 ».
