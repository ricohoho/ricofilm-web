var express = require('express');
var router = express.Router();

/* GET home page. */
/**
 * @swagger
 * /:
 *   get:
 *     summary: Render the home page
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: The home page
 */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'RicoFilm' });
});

console.log('router');
module.exports = router;
