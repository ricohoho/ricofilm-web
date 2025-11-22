var express = require('express');
var router = express.Router();

/* GET users listing. */
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Render the users page
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The users page
 */
router.get('/', function (req, res, next) {
	//res.send('respond with a resource');
	//RICO : user est le nom du tempate .jade !
	res.render('users', { title: 'RicoFilm' });
});

//Function pour lulu et MEDIETATIS //
/**
 * @swagger
 * /users/login:
 *   get:
 *     summary: User login
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Username
 *       - in: query
 *         name: pwd
 *         schema:
 *           type: string
 *         description: Password
 *     responses:
 *       200:
 *         description: Login result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 */
router.get('/login', function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	var _user = req.query.user;
	var _pwd = req.query.pwd;
	//res.send('User = '+_user);
	if (_user == 'lulu' && _pwd == 'lulu') {
		res.send('{"result":"vid.html"}');
	} else {
		res.send('{"result":"failed"}');
	}
});


module.exports = router;
