// app/mcp/mcp.server.js
// Utilisation de requêtes asynchrones pour charger les modules ESM
let Server, SSEServerTransport;
let CallToolRequestSchema, ListToolsRequestSchema;

async function initMCP() {
  if (!Server) {
    const mcpServer = await import("@modelcontextprotocol/sdk/server/index.js");
    Server = mcpServer.Server;
    const mcpSSE = await import("@modelcontextprotocol/sdk/server/sse.js");
    SSEServerTransport = mcpSSE.SSEServerTransport;
    const mcpTypes = await import("@modelcontextprotocol/sdk/types.js");
    CallToolRequestSchema = mcpTypes.CallToolRequestSchema;
    ListToolsRequestSchema = mcpTypes.ListToolsRequestSchema;
  }
}

class RicofilmMcpserver {
  constructor(db) {
    this.db = db;
    // SSE transports and servers are stateful according to the MCP SDK. 
    // We strictly need ONE standard `Server` instance per connected SSE client.
    this.sessions = new Map(); 
  }

  async start() {
    await initMCP();
    console.error("[MCP] Moteur Node MCP prêt.");
  }

  createServerInstance() {
    const serverInstance = new Server(
      { name: "Ricofilm-MCP", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers(serverInstance);
    return serverInstance;
  }

  setupHandlers(serverInstance) {
    serverInstance.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "search_film",
          description: "Rechercher un film dans la base de données de Ricofilm par titre, acteur ou réalisateur.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              actor: { type: "string" },
              director: { type: "string" }
            }
          }
        },
        {
          name: "get_film_links",
          description: "Obtenir les liens de streaming et de téléchargement pour un film spécifique. Si le film n'est pas disponible, il faut proposer à l'utilisateur de faire une requête avec l'outil request_film.",
          inputSchema: {
            type: "object",
            properties: {
              film_id: { type: "string", description: "L'ID MongoDB du film ou son ID TMDB" },
              film_title: { type: "string", description: "Le titre du film pour la recherche de liens" }
            },
            required: ["film_id", "film_title"]
          }
        },
        {
          name: "request_film",
          description: "Ajouter une demande (request) pour qu'un film soit ajouté au serveur. A utiliser quand un film n'est pas disponible pour le streaming.",
          inputSchema: {
            type: "object",
            properties: {
              film_title: { type: "string", description: "Titre du film à demander" }
            },
            required: ["film_title"]
          }
        },
        {
          name: "launch_movie_playback",
          description: "Lancer la lecture d'un film. Retourne un lien direct pour démarrer le player Ricofilm/Emby dans l'application web Angular.",
          inputSchema: {
            type: "object",
            properties: {
              film_title: { type: "string", description: "Titre original du film à lancer" }
            },
            required: ["film_title"]
          }
        },
        {
          name: "list_film_requests",
          description: "Afficher la liste de tous les films actuellement en demande (requests).",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ]
    }));

    serverInstance.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        console.error(`[MCP] Executing tool ${name} with args:`, args);
        
        const port = process.env.PORT || 3000;
        const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
        const publicUrl = process.env.PUBLIC_URL || baseUrl;

        if (name === "search_film") {
          let searchParam = "";
          let url = "";

          if (args.title) {
            searchParam = encodeURIComponent(`titre:${args.title}`);
            url = `${baseUrl}/films/list?filmname=${searchParam}&limit=5`;
          } else if (args.actor) {
            searchParam = encodeURIComponent(`acteur:${args.actor}`);
            url = `${baseUrl}/films/list?filmname=${searchParam}&limit=5`;
          } else if (args.director) {
            searchParam = encodeURIComponent(`real:${args.director}`);
            url = `${baseUrl}/films/list?filmname=${searchParam}&limit=5`;
          } else {
            // Recherche par défaut si rien n'est précisé
            url = `${baseUrl}/films/list?limit=5`;
          }

          console.error(`[MCP] Appel API search_film : ${url}`);
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const docs = await response.json();
          
          return { content: [{ type: "text", text: JSON.stringify(docs, null, 2) }] };
        }
        
        if (name === "get_film_links") {
          let url = "";
          
          if (args.film_id.length === 24 || !isNaN(args.film_id) || args.film_id.startsWith('id:') || args.film_id.startsWith('tt')) {
            // Extraction de l'ID numérique au cas où le client l'a envoyé avec le préfixe
            const cleanId = args.film_id.startsWith('id:') ? args.film_id.substring(3) : args.film_id;
            url = `${baseUrl}/films/detail/id/${cleanId}`;
          } else {
            url = `${baseUrl}/films/detail/${encodeURIComponent(args.film_id)}`;
          }

          console.error(`[MCP] Appel API get_film_links detail : ${url}`);
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const result = await response.json();
          
          // L'API /films/detail renvoie souvent un tableau ou l'objet directement
          const doc = Array.isArray(result) ? result[0] : result;

          if (!doc) {
             return { content: [{ type: "text", text: `Film non trouvé dans la base. URL de requête: non applicable.` }] };
          }
          
          const streamApi = `${publicUrl}/emby/stream/${encodeURIComponent(doc.original_title || doc.title)}`;
          const downloadApi = `${publicUrl}/emby/download/${encodeURIComponent(doc.original_title || doc.title)}/film.mp4`;
          
          let responseText = `Film: ${doc.title}\n`;
          if (doc.status === 'wanted' || doc.status === 'added_from_tmdb') {
             responseText += `ATTENTION: Le film ne semble pas avoir de fichier physique et est en mode statut="${doc.status}". Il est probablement non disponible pour le streaming. Utilisez l'outil request_film.\n`;
          }
          responseText += `Lien pour lecture direct API (streaming HTTP partiel): ${streamApi}\n`;
          responseText += `Lien pour télécharger: ${downloadApi}\n`;
          
          return { content: [{ type: "text", text: responseText }] };
        }
        
        if (name === "request_film") {
          const url = `${baseUrl}/request/add`;
          
          const newRequest = {
            username: "MCP_Agent",
            title: args.film_title,
            status: "AFAIRE",
            date_demande: new Date()
          };
          
          console.error(`[MCP] Appel API request_film (POST) : ${url}`);
          const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newRequest)
          });
          
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const result = await response.json();
          
          return { content: [{ type: "text", text: `La requête pour le film "${args.film_title}" a été ajoutée avec succès via l'API. (Réponse : ${JSON.stringify(result)})` }] };
        }
        
        if (name === "launch_movie_playback") {
          const playLink = `${publicUrl}/ricofilm/#/filmdetail/${encodeURIComponent(args.film_title)}`;
          return { content: [{ type: "text", text: `Pour lancer la lecture dans l'application, dirigez l'utilisateur vers ce lecteur : ${playLink}` }] };
        }
        
        if (name === "list_film_requests") {
           const url = `${baseUrl}/request/list`;

           console.error(`[MCP] Appel API list_film_requests : ${url}`);
           const response = await fetch(url);
           if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
           const requests = await response.json();
           
           // Filtrer côté code métier ou faire des requêtes plus fines
           const pendingRequests = requests.filter(r => r.status !== 'FAIT').slice(0, 10);
           return { content: [{ type: "text", text: JSON.stringify(pendingRequests, null, 2) }] };
        }

        throw new Error(`Tool not found: ${name}`);
      } catch (error) {
        console.error("[MCP] Tool execution error:", error);
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    });
  }

  async handleSSE(req, res) {
    console.error("[MCP] Nouvelle connexion SSE client");
    
    // Le SDK ModelContextProtocol génère automatiquement un UUID de session 
    // et l'ajoute à l'URL relative fournie.
    // On construit l'endpoint POST absolu public
    const port = process.env.PORT || 3000;
    const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
    // Utilisez la variable de votre domaine public si elle existe, sinon codez l'URL publique complète
    const publicUrl = process.env.PUBLIC_URL || baseUrl; 
    // Initialisation avec l'URL absolue
    const messageEndpoint = new URL('/mcp/message', publicUrl).toString(); 
    // Si publicUrl vaut "https://film.ricohoho.fr", messageEndpoint vaudra "https://film.ricohoho.fr/mcp/message"
    const transport = new SSEServerTransport(messageEndpoint, res);
    //Ancine version avec l'RL relative , mai ne fonctionne pas avec le reverse proxy
    //const transport = new SSEServerTransport('/mcp/message', res);
    const sessionId = transport.sessionId;
    
    console.error(`[MCP] Endpoint message configuré pour la session : ${sessionId}`);
    
    // Créer une TOUTE NOUVELLE instance de Serveur MCP spécifique à ce client
    const serverInstance = this.createServerInstance();
    
    this.sessions.set(sessionId, { server: serverInstance, transport: transport });
    
    res.on("close", () => {
      console.error(`[MCP] Connexion SSE fermée pour la session ${sessionId}`);
      this.sessions.delete(sessionId);
    });

    await serverInstance.connect(transport);
  }

  async handleMessage(req, res) {
    const sessionId = req.query.sessionId;
    const session = this.sessions.get(sessionId);
    
    if (session && session.transport) {
      // Transmettre le req.body (déjà parsé par express.json() dans app.js) en 3ème argument
      // pour éviter l'erreur "stream is not readable" du SDK
      await session.transport.handlePostMessage(req, res, req.body);
    } else {
      console.error("[MCP] Session introuvable ou transport manquant pour l'ID", sessionId);
      res.status(404).send("Session not found. Connect to /mcp/sse first.");
    }
  }
}

module.exports = RicofilmMcpserver;
