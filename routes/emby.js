const express = require('express');
const router = express.Router();
const axios = require('axios'); // Nécessite l'installation d'axios ou d'un autre client HTTP

// Vos constantes Emby (stockées idéalement dans des variables d'environnement)
const EMBY_HOST = process.env.EMBY_HOST;
const EMBY_API_KEY = process.env.EMBY_API_KEY; // Votre clé API

// Endpoint sécurisé pour le téléchargement
router.get('/download/emby/:itemId/:filename', async (req, res) => {
const { itemId, filename } = req.params;

// 1. Construire l'URL de téléchargement Emby (avec l'API Key)
const embyDownloadUrl = `${EMBY_HOST}/Items/${itemId}/Download?api_key=${EMBY_API_KEY}`;

try {
// 2. Transmettre la requête d'Emby vers le client
const response = await axios({
method: 'get',
url: embyDownloadUrl,
responseType: 'stream', // Traiter la réponse comme un flux
maxRedirects: 0, // Ne pas suivre la redirection (l'URL de download est le 'Location' header)
});

// La première requête GET renvoie un code 302 (Redirection) avec l'URL réelle du fichier dans l'en-tête 'Location'.
const finalFileUrl = response.headers.location;

if (!finalFileUrl) {
return res.status(500).send('Erreur: URL de fichier Emby introuvable.');
}

// 3. Récupérer le fichier réel en suivant l'URL de redirection
const fileResponse = await axios({
method: 'get',
url: finalFileUrl,
responseType: 'stream',
});

// 4. Définir les en-têtes pour le téléchargement côté client
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
// Vous pouvez aussi définir Content-Type si vous le connaissez (e.g., 'video/x-matroska')
// res.setHeader('Content-Type', fileResponse.headers['content-type'] || 'application/octet-stream');

// 5. Transférer le flux binaire directement à l'utilisateur
fileResponse.data.pipe(res);

} catch (error) {
console.error('Erreur lors du proxy Emby:', error.message);
res.status(500).send('Erreur lors de la récupération du fichier Emby.');
}
});

module.exports = router;
