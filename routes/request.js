//const { authJwt } = require("../app/middlewares");
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  //res.send('respond with a resource');
  //RICO : request est le nom du tempate .jade !
  res.render('request', { title: 'RicoFilm' });
});

/**
 * @swagger
 * /request:
 *   get:
 *     summary: Render the request page
 *     tags: [Request]
 *     responses:
 *       200:
 *         description: The request page
 */


//http://localhost:3000/request/list  ==> liste JSON de tt les requettes
//http://localhost:3000/request/list?username=rico  ==> liste JSON de tt les requettes de rico
//http://localhost:3000/request/list?status=AFAIRE
/*http://localhost:3000/request/add   (POST avec Body : Row : JSON   ==> creation d'un ligne collection request
{
    "username":"rico3",
    "id":"125742",
    "title":"10e chambre - Instants d'audience",
    "file":"10ème Chambre, Instants d'Audience (2004) - Raymond Depardon - Copie.avi",
    "size" : 93121.0
}

//http://localhost:3000/request/ ou http://localhost:3000/ricofilm/request ==> donne la liste en html Express !


*/


/* GET requestlist. */
//[authJwt.verifyToken],
//router.get('/list' , [authJwt.verifyToken],function(req, res) {
/**
 * @swagger
 * /request/list:
 *   get:
 *     summary: Get a list of requests
 *     tags: [Request]
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: Filter by username
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: serveur_name
 *         schema:
 *           type: string
 *         description: Filter by server name
 *     responses:
 *       200:
 *         description: List of requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/list', function (req, res) {
  var db = req.db;
  var collection = db.get('request');

  var _status = req.query.status;
  var _username = req.query.username;
  var _serveur_name = req.query.serveur_name;

  console.log('_username: ' + _username);
  console.log('_status: ' + _status);
  console.log('_serveur_name: ' + _serveur_name);

  var srequete1 = '';
  var srequete2 = '';

  if (_username) {
    //var srequete1='{"username":"'+_username+'"}';
    var srequete = '"username":"' + _username + '"';
  } else {
    var srequete = '';
  }


  if (_status) {
    if (srequete == '') {
      var srequete = '"status":"' + _status + '"';
    } else {
      var srequete = srequete + ',"status":"' + _status + '"';
    }
  }


  if (_serveur_name) {
    if (srequete == '') {
      var srequete = '"serveur_name":"' + _serveur_name + '"';
    } else {
      var srequete = srequete + ',"serveur_name":"' + _serveur_name + '"';
    }
  }



  var srequete = '{ ' +
    srequete +
    '}';
  console.log('srequete: ' + srequete);

  var objrequete = JSON.parse(srequete);


  collection.find(objrequete, {}, function (e, docs) {
    res.json(docs);
  });
});


/* POST to adduser. */
/**
 * @swagger
 * /request/add:
 *   post:
 *     summary: Add a new request
 *     tags: [Request]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 *               file:
 *                 type: string
 *               size:
 *                 type: number
 *     responses:
 *       200:
 *         description: Request added successfully
 */
router.post('/add', function (req, res) {
  console.log('addrequest: debut');
  var db = req.db;
  var collection = db.get('request');
  collection.insert(req.body, function (err, result) {
    res.send(
      (err === null) ? { msg: '' } : { msg: err }
    );
  });
});


//Update REQUEST 
//http://programmerblog.net/nodejs-mongodb-tutorial/
/**
 * @swagger
 * /request/edit:
 *   post:
 *     summary: Edit a request
 *     tags: [Request]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               status:
 *                 type: string
 *               username:
 *                 type: string
 *               file:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request updated successfully
 */
router.post('/edit', function (req, res, next) {
  console.log('editrequest: debut');
  var db = req.db;
  var collection = db.get('request');
  var username = req.body.username;
  var status = req.body.status;
  var file = req.body.file;
  console.log('editrequest: id:' + req.body.id + '->' + status);
  console.log('editrequest: file' + file);
  collection.update({ 'id': req.body.id },
    { $set: { 'status': status, 'username': username } }, function (err, result) {
      if (err) {
        console.log('editrequest: erreur' + err);
        throw err;
      }
      res.send(
        (err === null) ? { msg: '' } : { msg: err }
      );
    });
  console.log('editrequest: Fin ');
});

/* DELETE to deleteuser. */
/**
 * @swagger
 * /request/delete/{id}:
 *   delete:
 *     summary: Delete a request
 *     tags: [Request]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The request ID
 *     responses:
 *       200:
 *         description: Request deleted successfully
 */
router.delete('/delete/:id', function (req, res) {
  var db = req.db;
  var collection = db.get('request');
  var userToDelete = req.params.id;
  // IDs seem to be stored as numbers, so we try to convert.
  // If it's a valid number, we use it as a number.
  if (!isNaN(userToDelete)) {
    userToDelete = parseInt(userToDelete);
  }
  collection.remove({ 'id': userToDelete }, function (err) {
    res.send((err === null) ? { msg: '' } : { msg: 'error: ' + err });
  });
});

module.exports = router;
