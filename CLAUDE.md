# CLAUDE.md — RicoFilm Web

Référence architecture, stack, conventions et commandes pour ce projet.

---

## Stack

| Couche | Technologie | Version |
|--------|-------------|---------|
| Runtime | Node.js | ≥ 14 |
| Framework | Express | 4.17.3 |
| DB ORM | Mongoose | 6.11.2 |
| DB Query | Monk | 7.3.2 |
| DB Driver | MongoDB | 3.6.3 |
| Auth | jsonwebtoken | 9.0.0 |
| Hash | bcryptjs | 2.4.3 |
| Mail | node-mailjet | 6.x |
| Templates | Pug | 3.0.2 |
| Monitoring | @sentry/node | 10.38.0 |
| HTTP Client | axios | 1.7.5 |
| API Docs | swagger-jsdoc + swagger-ui-express | 6/5 |
| MCP | @modelcontextprotocol/sdk | 1.27.1 |

---

## Commandes

```bash
npm run start:local     # Développement local (.env.local)
npm run start:cloud     # MongoDB cloud (.env.cloudmongo)
npm start               # Production (.env par défaut)
```

Port par défaut : **3000**

---

## Architecture

```
/bin/www                    # Point d'entrée Node
/app.js                     # Setup Express, CORS, middlewares, routes
/app/
  config/                   # auth.config.js (JWT secret)
  controllers/              # Logique métier (auth, user, mail, sync...)
  middlewares/              # authJwt.js, verifySignUp.js, UserMapper.js
  models/                   # Mongoose : User, Role + index.js
  routes/                   # Routes modernes (JWT protégées)
  services/                 # mail.service.js, sync.service.js, externalService.js
  mcp/                      # Serveur MCP (Model Context Protocol)
/routes/                    # Routes legacy (Monk, sans auth)
/views/                     # Templates Pug
/public/                    # Assets statiques JS/CSS
```

### Double système de routes

- **`/routes/*.js`** — Legacy, utilise **Monk** via `req.db`, pas de JWT
- **`/app/routes/*.js`** — Moderne, utilise **Mongoose**, protégé par JWT

Les deux sont montées en double : `/` et `/ricofilm/`

### Double accès base de données

- **Mongoose** (`app/models/`) — Utilisé pour `User`, `Role` (auth/users)
- **Monk** (`req.db`) — Utilisé pour `films`, `request` (collections legacy)

Les deux accèdent à la **même instance MongoDB**.

---

## Endpoints API principaux

### Auth
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/signup` | Inscription |
| POST | `/api/auth/signin` | Connexion → JWT |
| GET | `/api/auth/dcnx` | Déconnexion |

### Users (Mongoose + JWT)
| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/api/user/list` | admin/moderator |
| GET/PUT/DELETE | `/api/user/:id` | admin/moderator |
| GET | `/api/roles/list` | public |

### Films (Monk legacy)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/films/list` | Recherche (titre, acteur, réal, IA, TMDB) |
| GET | `/films/detail/:film` | Détail par titre ou `id:X` |
| GET | `/films/detail/id/:id` | Détail par ID |
| POST | `/films/add` | Ajouter un film |

Filtres `films/list` : `filmname=titre:X` / `acteur:X` / `real:X` / `ia:X` / `ia2:X`
Options : `skip`, `limit`, `sort`, `usage`, `infocount`

### Requêtes (Monk legacy)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/request/list` | Liste (filtres: username, status, serveur_name) |
| POST | `/request/add` | Créer → **notifie les admins par mail** |
| POST | `/request/edit` | Modifier statut |
| DELETE | `/request/delete/:id` | Supprimer |

### Mail
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/mail/test` | Test envoi mail |
| POST | `/api/mail/send` | Envoi libre |

### Autres
| Route | Description |
|-------|-------------|
| `/api/syncFilms` | Sync films entre DB (verifyToken) |
| `/api/syncRequests` | Sync requêtes entre DB (verifyToken) |
| `/emby/stream/:film` | Proxy streaming Emby (Range support) |
| `/emby/download/:film/:file` | Proxy download Emby |
| `/image/resize` | Redimensionnement image (jimp) |
| `/mcp/sse` | Connexion SSE Model Context Protocol |
| `/mcp/message` | Requêtes JSON-RPC MCP |
| `/api-docs` | Swagger UI |

---

## Authentification

- **Type** : JWT Bearer token, durée 24h
- **Header** : `Authorization: Bearer <token>`
- **Secret** : variable d'env (défaut hardcodé dans `app/config/auth.config.js` — à externaliser)
- **Middlewares** : `verifyToken`, `isAdmin`, `isModerator`, `isAdminOrModerator`
- **Payload JWT** : `{ id: user._id }`

**Rôles disponibles** : `user`, `admin`, `moderator`

---

## Variables d'environnement

```bash
# MongoDB
DB_PREFIX / DB_USER / DB_PASSWORD / DB_HOST / DB_PORT / DB_NAME / DB_POSTFIX

# MongoDB distant (sync)
REMOTE_DB_PREFIX / REMOTE_DB_USER / REMOTE_DB_PASSWORD / REMOTE_DB_HOST / REMOTE_DB_PORT / REMOTE_DB_NAME

# App
BASE_URL          # URL interne (ex: http://localhost:3000)
PUBLIC_URL        # URL publique (utilisée par MCP)
URL_CORS_ACCEPT   # Origine CORS autorisée (ex: http://localhost:4200)

# IA
IA_PROTOCOL / IA_HOST / IA_PORT / IA_URL / IA2_URL / IA2b_URL

# APIs externes
TMDB_API_KEY / TMDB_API_BEARER_TOKEN
EMBY_HOST / EMBY_API_KEY / EMBY_USER_ID

# MailJet
MJ_APIKEY_PUBLIC / MJ_APIKEY_PRIVATE
MJ_SENDER_EMAIL / MJ_SENDER_NAME

# Sentry
SENTRY_DSN
```

---

## Conventions de code

- **Module system** : CommonJS (`require` / `module.exports`), sauf MCP (ES modules dynamic import)
- **Style** : Mix `var` (legacy) / `const`/`let` (nouveau code) — préférer `const`/`let`
- **Async** : Mix callbacks (Monk legacy) et async/await (services/routes modernes)
- **Naming** : camelCase variables, PascalCase modèles, UPPER_SNAKE_CASE constantes
- **Collections Monk** : minuscules (`films`, `request`)

### Patterns à respecter

```js
// Requête Monk
const collection = db.get('request');
collection.find(query, {}, (err, docs) => { ... });

// Validation params
if (!param || typeof param !== 'string') {
  return res.status(400).json({ msg: 'Invalid param' });
}

// Erreur générique
return res.status(500).json({ msg: err.toString() });

// Regex MongoDB case-insensitive
{ field: { $regex: value, $options: 'i' } }

// Envoi mail (service)
await mailService.notifyAdminsNewRequest(request);
```

---

## Points d'attention

- **JWT secret hardcodé** dans `app/config/auth.config.js` — à passer en variable d'env
- **`.env.*` contiennent des secrets** — ne jamais committer `.env.local` / `.env.production`
- **Pas de rate limiting** — aucune protection brute force sur les routes auth
- **Routes dupliquées** — chaque route montée sur `/` ET `/ricofilm/` (legacy)
- **18 vulnérabilités npm** signalées — voir `npm audit`
- **Notification mail admins** — basée sur `User.active = true` + rôle `admin` dans MongoDB
