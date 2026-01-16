const express = require('express');
const Jimp = require('jimp');
const axios = require('axios');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    //res.send('respond with a resource');
    //RICO : request est le nom du tempate .jade !
    res.render('request', { title: 'RicoFilm' });
});



// Point d'entrée pour redimensionner l'image depuis une URL
/**
 * @swagger
 * /image/resize:
 *   get:
 *     summary: Resize an image from a URL
 *     tags: [Image]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: URL of the image to resize
 *       - in: query
 *         name: width
 *         required: true
 *         schema:
 *           type: integer
 *         description: Target width
 *       - in: query
 *         name: height
 *         required: true
 *         schema:
 *           type: integer
 *         description: Target height
 *     responses:
 *       200:
 *         description: Resized image
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing parameters
 *       500:
 *         description: Error resizing image
 */
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

        // Redimensionner l'image avec Jimp
        const image = await Jimp.read(imageBuffer);
        image.resize(width, height);
        const resizedImageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);

        // Configurer la réponse avec l'image redimensionnée
        res.set('Content-Type', 'image/jpeg');
        res.send(resizedImageBuffer);
    } catch (error) {
        console.error('Erreur lors du redimensionnement:', error);
        res.status(500).send('Erreur lors du redimensionnement de l\'image.');
    }
});


module.exports = router;
