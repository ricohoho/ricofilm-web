---
description: Gérer et implémenter les fonctionnalités RicoFilm depuis le backlog
argument-hint: Numéro ou nom de la fonctionnalité (optionnel)
---

# Skill /feature — RicoFilm Feature Manager

Tu aides le développeur à choisir et implémenter une fonctionnalité du backlog RicoFilm.

## Étape 1 : Afficher le backlog

Lis le fichier mémoire des propositions :
`~/.claude/projects/-home-efassel-ricofilm-ricofilm-web/memory/project_feature_proposals.md`

Affiche un tableau récapitulatif avec uniquement : numéro, nom, statut, effort estimé.
Mets en avant l'ordre recommandé (notifications #3 → watchlist #1 → recommandations IA #5).

Si `$ARGUMENTS` contient un numéro ou un nom de feature, saute directement à l'étape 2 avec cette feature.
Sinon, demande à l'utilisateur laquelle il veut implémenter.

## Étape 2 : Analyser l'impact

Avant de coder, explore les fichiers concernés par la feature choisie dans ces trois dépôts :
- Backend : `/home/efassel/ricofilm/ricofilm-web/`
- Frontend : `/home/efassel/ricofilm/AngularRicofilm/`  
- IA : `/home/efassel/ricofilm/ricofilm-ia/`

Lance des agents Explorer en parallèle pour identifier :
- Les fichiers existants à modifier
- Les patterns du projet à respecter (Monk vs Mongoose, callback vs async/await, CommonJS vs ES modules)
- Les dépendances entre composants (ex: la feature touche-t-elle le backend + le frontend ?)

Présente un résumé : fichiers impactés, complexité réelle, risques.

## Étape 3 : Questions de cadrage

Avant de coder, pose les questions nécessaires sur :
- Le comportement exact attendu (edge cases, UI souhaité)
- Les choix d'implémentation non triviaux (ex: nouveau modèle Mongoose ou champ dans modèle existant ?)
- La priorité si plusieurs composants sont touchés (backend d'abord, puis frontend ?)

**Attends les réponses avant de passer à l'implémentation.**

## Étape 4 : Plan d'implémentation

Propose un plan structuré par composant :

### Backend (ricofilm-web)
- Nouveau modèle Mongoose si nécessaire (dans `app/models/`)
- Nouvelles routes : utiliser le pattern **moderne** (`app/routes/` + JWT) sauf si intégration legacy requise
- Nouveau contrôleur dans `app/controllers/`
- Notification mail si pertinent (`app/services/mail.service.js`)
- Documenter l'endpoint avec JSDoc Swagger

### Frontend (AngularRicofilm)
- Nouveau service dans `src/app/_services/`
- Nouveau composant PrimeNG dans le bon module
- Mise à jour du routing si nouvelle page
- Gestion des erreurs et toasts PrimeNG

### IA (ricofilm-ia)
- Uniquement si la feature implique du traitement Mistral
- Nouveau endpoint Flask dans `RicoSrviceIA.py`
- Mise à jour de la variable d'env côté backend si nouvel URL IA

**Attends la validation du plan avant d'implémenter.**

## Étape 5 : Implémentation

Implémente le plan validé en respectant ces contraintes RicoFilm :

**Backend — patterns obligatoires :**
```js
// Routes modernes : async/await + Mongoose + JWT
router.get('/endpoint', [authJwt.verifyToken], async (req, res) => {
  try {
    const result = await MonModel.find(query);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ msg: err.toString() });
  }
});

// Routes legacy : callbacks + Monk via req.db
const collection = req.db.get('collection');
collection.find(query, {}, (err, docs) => {
  if (err) return res.status(500).json({ msg: err.toString() });
  return res.json(docs);
});

// Validation params
if (!param || typeof param !== 'string') {
  return res.status(400).json({ msg: 'Invalid param' });
}
```

**Frontend — patterns obligatoires :**
- Services : utiliser `HttpClient` avec `Observable`, injecter `AuthService` pour le token
- Composants : utiliser les composants PrimeNG existants (`p-table`, `p-dialog`, `p-toast`)
- Evènements cross-composants : passer par `EventBusService`

**Montage routes :** toute nouvelle route backend doit être enregistrée **deux fois** dans `app.js` :
```js
app.use('/nouvelle-route', nouvelleRoute);
app.use('/ricofilm/nouvelle-route', nouvelleRoute);
```

## Étape 6 : Mise à jour du statut

Une fois l'implémentation terminée, mets à jour le fichier mémoire :
`~/.claude/projects/-home-efassel-ricofilm-ricofilm-web/memory/project_feature_proposals.md`

Change le statut de la feature de `non commencé` à `terminé` et ajoute la date (format YYYY-MM-DD).

Affiche un résumé : fichiers créés/modifiés, endpoints ajoutés, prochaine feature recommandée.
