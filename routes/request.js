var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
  res.render('request', { title: 'RicoFilm' });
});

/* GET userlist. */
router.get('/list', function(req, res) {
  var db = req.db;
  var collection = db.get('request');

  var _username=req.query.username;
  console.log('requete: '+_username );
  if(_username) {
    var srequete='{"username":"'+_username+'"}';
    var objrequete = JSON.parse(srequete);
  } else  {
    var srequete='{}';
    var objrequete = JSON.parse(srequete);
  }
  collection.find(objrequete,{},function(e,docs){
    res.json(docs);
  });
});


/* POST to adduser. */
router.post('/addrequest', function(req, res) {
  var db = req.db;
  var collection = db.get('request');
  collection.insert(req.body, function(err, result){
    res.send(
      (err === null) ? { msg: '' } : { msg: err }
    );
  });
});

module.exports = router;
