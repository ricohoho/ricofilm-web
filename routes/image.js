const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
  //RICO : request est le nom du tempate .jade !
  res.render('request', { title: 'RicoFilm' });
});



// Point d'entrée pour redimensionner l'image depuis une URL
router.get('/resize', async (req, res) => {
    console.log('resize');
    try {
        const imageUrl = req.query.url;
        const width = parseInt(req.query.width);
        const height = parseInt(req.query.height);

        // Valider les paramètres
        if (!imageUrl || !width || !height) {
            return res.status(400).send('URL, width, and height are required.');
        }

        // Télécharger l'image depuis l'URL
        const response = await axios({
            url: imageUrl,
            responseType: 'arraybuffer'
        });

        const imageBuffer = Buffer.from(response.data, 'binary');

        // Redimensionner l'image avec Sharp
        const resizedImageBuffer = await sharp(imageBuffer)
            .resize(width, height)
            .toBuffer();

        // Configurer la réponse avec l'image redimensionnée
        res.set('Content-Type', 'image/jpeg');
        res.send(resizedImageBuffer);
    } catch (error) {
        console.error('Erreur lors du redimensionnement:', error);
        res.status(500).send('Erreur lors du redimensionnement de l\'image.');
    }
});


module.exports = router;
