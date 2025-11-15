const express = require('express');
const router = express.Router();
const axios = require('axios'); // Nécessite l'installation d'axios ou d'un autre client HTTP 

// Vos constantes Emby (stockées idéalement dans des variables d'environnement)
const EMBY_HOST = process.env.EMBY_HOST;
const EMBY_API_KEY = process.env.EMBY_API_KEY; // Votre clé API


//reccuperer l'id emby d'un film via son nom
async function getEmbyItemIdByName(FilmName, options = {}) {
    // options: { userId, parentId }
    console.log(`getEmbyItemIdByName called with FilmName: ${FilmName}`);
    const userId = options.userId || process.env.EMBY_USER_ID || '8c05e6fd08ac4fbd96b6aafaf06b59cc';
    const parentId = options.parentId || '4';
    if (!EMBY_HOST || !EMBY_API_KEY) {
        throw new Error('EMBY_HOST or EMBY_API_KEY not configured');
    }

    const url = `${EMBY_HOST}/Users/${userId}/Items` +
        `?SearchTerm=${encodeURIComponent(FilmName)}` +
        `&IncludeItemTypes=Movie` +
        `&ParentId=${encodeURIComponent(parentId)}` +
        `&api_key=${encodeURIComponent(EMBY_API_KEY)}`;
    console.log(`getEmbyItemIdByName URL: ${url}`);

    try {
        console.log('Making request to Emby for item search...');
        const resp = await axios.get(url);
        console.log(`Emby search response status: ${resp.status}`);
        // Emby renvoie normalement un objet { Items: [ ... ] }
        const items = resp.data && resp.data.Items ? resp.data.Items : [];
        console.log(`getEmbyItemIdByName found ${items.length} items`);
        if (items.length === 0) return null;
        // Retourne l'id du premier résultat
        return items[0].Id || null;
    } catch (err) {
        console.error('getEmbyItemIdByName error:', err.message || err);
        return null;
    }
}

// Node.js (Route /download/emby/:itemId/:filename)
router.get('/download/:filmname/:filename', async (req, res) => {
    
    const { filmname, filename } = req.params;
    console.log("download request received");
    const EmbyId = await getEmbyItemIdByName(filmname);
    console.log(`Resolved itemId: ${EmbyId}`);
    if (!EmbyId) {
        return res.status(404).send('film non trouvé dans Emby.');
    }

    // 1. URL Emby de téléchargement (celle qui renvoie le 302)
    const embyDownloadUrl = `${EMBY_HOST}/Items/${EmbyId}/Download?api_key=${EMBY_API_KEY}`;
    
    try {
        // --- NOUVELLE APPROCHE : UN SEUL APPEL AXIOS ---
        
        const fileResponse = await axios({
            method: 'get',
            url: embyDownloadUrl,
            responseType: 'stream', // Traiter la réponse comme un flux
            // 💡 CRITIQUE : Laisser Axios gérer la redirection (maxRedirects > 0, par défaut 5)
            // Cela économise une requête réseau pour la redirection.
            maxRedirects: 5 
        });

        // 2. Transférer les En-têtes pour le téléchargement
        
        // C'est critique pour indiquer le nom du fichier au navigateur
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Copier les en-têtes de streaming (Content-Type, Content-Length)
        // Ceci permet au navigateur de savoir la taille du fichier et son type.
        if (fileResponse.headers['content-type']) {
            res.setHeader('Content-Type', fileResponse.headers['content-type']);
        }
        if (fileResponse.headers['content-length']) {
            res.setHeader('Content-Length', fileResponse.headers['content-length']);
        }
        
        // 3. Établir le Piping Immédiatement
        
        // Dès que le premier morceau de données arrive dans le flux d'Axios, il est
        // immédiatement envoyé à la réponse de l'utilisateur.
        fileResponse.data.pipe(res);

        // Gestion des erreurs de transfert
        fileResponse.data.on('error', (err) => {
            console.error('Erreur de flux lors du piping:', err);
            // Fermer proprement la connexion si une erreur se produit
            if (!res.headersSent) {
                res.status(500).send('Erreur lors du transfert du fichier.');
            } else {
                res.end(); 
            }
        });

    } catch (error) {
        // ... votre gestion d'erreur reste la même ...
        if (error.response && error.response.status) {
            console.error(`Erreur Emby: Statut ${error.response.status}`);
            return res.status(error.response.status).send(`Erreur lors de la récupération du fichier Emby: ${error.response.status}`);
        }
        console.error('Erreur lors du proxy Emby:', error.message);
        res.status(500).send('Erreur lors de la récupération du fichier Emby.');
    }
});

// Apple TV et autres clients de streaming
router.get('/stream/:filmname', async (req, res) => {
    // ... validation de l'utilisateur ici ...
    console.log("Streaming request received");

    const filmname = req.params.filmname;
    //Recherche de EmbyId à partir du filmName
    const EmbyId = await getEmbyItemIdByName(filmname);
    console.log(`Resolved itemId: ${EmbyId}`);
    if (!EmbyId) {
        return res.status(404).send('film non trouvé dans Emby.');
    }

    const streamUrl = `${EMBY_HOST}/Videos/${EmbyId}/stream?static=true&api_key=${EMBY_API_KEY}`;
    console.log(`Stream URL: ${streamUrl}`);
    
    // Si l'utilisateur a envoyé un Range header, transmettez-le à Emby
    const rangeHeader = req.headers.range; 
    const headersToEmby = {};
    if (rangeHeader) {
        headersToEmby['Range'] = rangeHeader;
    }
    try {
        console.log("Initiating stream request to Emby");
        // Faire la requête à Emby pour le streaming
        const fileResponse = await axios({
            method: 'get',
            url: streamUrl,
            responseType: 'stream', // Lire comme un flux binaire
            headers: headersToEmby, // <<< ENVOYER le Range header à Emby
        });
        console.log(`Emby responded with status: ${fileResponse.status}`);

        // CRITIQUE : Si Emby renvoie 206 (Partial Content), le proxy doit faire de même
        if (fileResponse.status === 206) {
            res.status(206);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Range', fileResponse.headers['content-range']);
        }
        //res.setHeader('Content-Type', response.headers['content-type'] || 'video/x-matroska');

        // Définir les en-têtes de réponse pour le streaming (Video/Octet-stream)
        // C'est critique pour que le navigateur sache comment interpréter le flux.
        // 1. Copier les en-têtes d'Emby vers la réponse du client
        // CRITIQUE : Copier le Content-Type et Content-Length
        res.setHeader('Content-Type', fileResponse.headers['content-type'] || 'application/octet-stream');
        if (fileResponse.headers['content-length']) {
            res.setHeader('Content-Length', fileResponse.headers['content-length']);
        }
        // 2. Établir le "tuyau" (pipe)
        fileResponse.data.pipe(res);

        // 3. Gestion des erreurs de transfert
        fileResponse.data.on('error', (err) => {
            console.error('Erreur de flux Emby:', err);
            // Assurez-vous d'arrêter la réponse en cas d'erreur
            if (!res.headersSent) {
                res.status(500).send('Erreur interne du flux.');
            } else {
                res.end();
            }
        });

        // 4. Gestion de la fin du flux
        fileResponse.data.on('end', () => {
            // Le flux est terminé (peut ne pas se déclencher immédiatement pour les streams)
            console.log('Transfert du flux terminé.');
        });

    } catch (error) {
        // Gérer les erreurs (fichier non trouvé, etc.)
        console.error('Erreur lors du streaming Emby:', error.message);
        res.status(500).send('Erreur lors du streaming du fichier.');
    }
});

module.exports = router;
