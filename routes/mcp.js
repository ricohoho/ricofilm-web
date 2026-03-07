const express = require('express');
const router = express.Router();
const RicofilmMcpserver = require('../app/mcp/mcp.server');

let mcpServerInstance = null;

// Initialize MCP Server (Async)
async function init(db) {
  if (!mcpServerInstance) {
    mcpServerInstance = new RicofilmMcpserver(db);
    await mcpServerInstance.start();
    console.log("[MCP] Serveur initialisé avec succès");
  }
  return mcpServerInstance;
}

// Endpoint GET pour l'établissement de la connexion SSE
/**
 * @swagger
 * /mcp/sse:
 *   get:
 *     summary: Établit une connexion Server-Sent Events (SSE) avec le serveur MCP
 *     tags: [MCP]
 *     responses:
 *       200:
 *         description: Connexion SSE établie
 */
router.get('/sse', async (req, res) => {
  try {
    const server = await init(req.db);
    await server.handleSSE(req, res);
  } catch (err) {
    console.error("[MCP] Erreur SSE:", err);
    res.status(500).send("Erreur d'initialisation MCP");
  }
});

// Endpoint POST pour la réception des messages JSON-RPC
/**
 * @swagger
 * /mcp/message:
 *   post:
 *     summary: Reçoit des requêtes d'outils ou d'actions MCP
 *     tags: [MCP]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         description: L'ID de session renvoyé lors de la connexion SSE
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Réponse du serveur MCP
 */
router.post('/message', async (req, res) => {
  try {
    const server = await init(req.db);
    await server.handleMessage(req, res);
  } catch (err) {
    console.error("[MCP] Erreur de message:", err);
    res.status(500).send("Erreur de traitement MCP");
  }
});

module.exports = router;
