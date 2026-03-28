# Walkthrough : Intégration d'un Serveur MCP Local (Mistral AI)

## Vue d'ensemble

L'objectif principal était de doter l'application existante (`ricofilm-web`) d'un **serveur Model Context Protocol (MCP)** pleinement opérationnel afin de pouvoir exposer la base de données de films et les fonctionnalités d'application à un agent IA (notamment Mistral), tout en passant par les canaux HTTP ouverts.

## Ce qui a été accompli

### 1. Création de l'infrastructure Serveur MCP

- **Dépendances** : Installation de `@modelcontextprotocol/sdk`.
- **Classe Serveur** : Création du module [app/mcp/mcp.server.js](file://wsl.localhost/Ubuntu/home/efassel/ricofilm/ricofilm-web/app/mcp/mcp.server.js). Ce composant est responsable d'instancier un nouvel objet [Server](file://wsl.localhost/Ubuntu/home/efassel/ricofilm/ricofilm-web/app/mcp/mcp.server.js#31-39) pour **chaque client** qui se connecte via SSE (Server-Sent Events), une condition indispensable imposée par le protocole MCP.
- **Transports** : Implémentation du système `SSEServerTransport` avec gestion robuste des Identifiants Uniques de Session (UUID) générés par le SDK.

### 2. Implémentation des Outils (Tools) de l'Agent

Cinq outils cruciaux ont été configurés en proxy par-dessus l'API REST locale existante :

- `search_film` : Déclenche la route API existante pour rechercher par titre, réalisateur ou acteur.
- `get_film_links` : Consulte `/films/detail/id/...` pour obtenir l'objet, puis génère formellement les liens `/emby/stream...` et `/emby/download...` pour le visionnage. Le module a été rendu "intelligent" et tolère différents formats de recherche (`Mongo _id`, `TMDB id`, `IMDB tt00...`).
- `request_film` : Déclenche l'ajout d'une demande de film via la route `/request/add`.
- `list_film_requests` : Retourne la liste des films "À FAIRE" via `/request/list`.
- `launch_movie_playback` : Génère un lien de redirection direct vers le lecteur de l'application Angular.

### 3. Ajustements Réseau (Routes API Express)

- Création du routeur [/routes/mcp.js](file://wsl.localhost/Ubuntu/home/efassel/ricofilm/ricofilm-web/routes/mcp.js) branché sur les requêtes :
  - `GET /mcp/sse` pour initier l'écoute.
  - `POST /mcp/message` pour l’exécution des tâches (RPC).
- **Débogage CORS** : Assouplissement des directives dans [app.js](file://wsl.localhost/Ubuntu/home/efassel/ricofilm/ricofilm-web/app.js) pour tolérer dynamiquement toute requête provenant des ports `localhost` (Inspecteur MCP, etc).
- **Débogage Body-Parser** : Contournement du blocage de `express.json()` en transmettant délibérément `req.body` au SDK pour ne pas vider les buffers du pipeline de streaming.
- **Routage de détails de film** : Modification de la route existante `/detail/id/:id` (qui requiérait un objet ID MongoDB) pour lui faire supporter simultanément la recherche par `id` TheMovieDB ("603") ou TheInternetMovieDB ("tt0133...").

### 4. Agent IA dans VS Code (Roo Code)

Afin d'utiliser le serveur avec des agents locaux comme Roo Code, qui ne supportent pas bien le protocole SSE local depuis WSL, nous avons créé une architecture alternative :
- [app/mcp/mcp-roo-server.js](file://wsl.localhost/Ubuntu/home/efassel/ricofilm/ricofilm-web/app/mcp/mcp-roo-server.js) : Ce script instancie directement le [RicofilmMcpserver](file://wsl.localhost/Ubuntu/home/efassel/ricofilm/ricofilm-web/app/mcp/mcp.server.js#18-262), mais le connecte via la classe [StdioServerTransport](file://wsl.localhost/Ubuntu/home/efassel/ricofilm/ricofilm-web/node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.d.ts#9-28) au lieu de l'exposer sur Express.
- Ainsi, Roo Code communique et appelle les outils du backend Node nativement, en flux standard, bénéficiant des mêmes capacités d'interface (Base de données, API locale HTTP) que le serveur SSE, sans les problèmes de réseau ou de timeout.

## Méthodologie Validation

L'infrastructure a été intensivement testée localement en utilisant **l'Inspecteur officiel MCP** de la fondation Anthropic (pour le flux HTTP/SSE).
Elle est actuellement branchée avec succès sur **Roo Code** (API Stdio/Console) dans VS Code. Le backend est maintenant entièrement agnostique et certifié prêt à fonctionner avec tout LLM compatible MCP.
