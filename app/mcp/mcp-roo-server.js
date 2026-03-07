const RicofilmMcpserver = require('./mcp.server.js');

async function run() {
  console.error("[ROO-SERVER] Initialisation locale du Serveur MCP...");

  // 1. Instancier la classe du serveur (ne nécessite pas de base de données directe 
  // puisque mcp.server.js lance des FETCH vers localhost:3000)
  const mcpLogic = new RicofilmMcpserver(null);
  await mcpLogic.start();

  // 2. Extraire la logique serveur configurée
  const serverInstance = mcpLogic.createServerInstance();

  // 3. Mapper ce serveur directement sur l'entrée/sortie console (Stdio)
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const transport = new StdioServerTransport();

  // 4. Connecter !
  await serverInstance.connect(transport);
  console.error("[ROO-SERVER] Prêt ! En écoute sur stdio pour VS Code.");
}

run().catch(err => {
  console.error("[ROO-SERVER] Erreur fatale :", err);
  process.exit(1);
});
