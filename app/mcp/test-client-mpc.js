import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function run() {
  //const transport = new SSEClientTransport(new URL("http://localhost:3000/mcp/sse"));
  const transport = new SSEClientTransport(new URL("https://film.ricohoho.fr/mcp/sse"));
  const client = new Client({ name: "Rico-Test-Client", version: "1.0.0" }, { capabilities: {} });
  
  await client.connect(transport);
  console.log("Connecté au serveur !");
  
  // Lister les outils :
  const tools = await client.listTools();
  console.log("\nOutils disponibles :", tools.tools.map(t => t.name).join(", "));
  
  // Appeler l'outil :
  console.log("\nAppel de get_film_links pour 1254808...");
  const result = await client.callTool({
    name: "get_film_links",
    arguments: { film_id: "1153111", film_title: "Oxana" }
    //arguments: { film_id: "603", film_title: "Le Parrain" }
  });
  console.log("Résultat :", result);
  
  process.exit(0);
}
run().catch(console.error);
