var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
  //RICO : request est le nom du tempate .jade !
  res.render('request', { title: 'RicoFilm' });
});


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
*/


/* GET userlist. */
router.get('/list'  , function(req, res) {
  var db = req.db;
  var collection = db.get('request');

  var _status=req.query.status;
  var _username=req.query.username;
  var _serveur_name=req.query.serveur_name;

  console.log('_username: '+_username );
  console.log('_status: '+_status );
  console.log('_serveur_name: '+_serveur_name );

  var srequete1='';
  var srequete2='';

  if(_username) {
    //var srequete1='{"username":"'+_username+'"}';
    var srequete='"username":"'+_username+'"';    
  } else  {
    var srequete='';
  }

  
  if(_status) {
    if (srequete=='') {
      var srequete='"status":"'+_status+'"';
    } else {
      var srequete=srequete + ',"status":"'+_status+'"';
    }
  }


  if(_serveur_name) {
    if (srequete=='') {
      var srequete='"serveur_name":"'+_serveur_name+'"';
    } else {
      var srequete=srequete + ',"serveur_name":"'+_serveur_name+'"';
    }
  }
  


  var srequete = '{ '+
                      srequete+
                     '}';
console.log('srequete: '+srequete );

  var objrequete = JSON.parse(srequete);


  collection.find(objrequete,{},function(e,docs){
    res.json(docs);
  });
});


/* POST to adduser. */
router.post('/add', function(req, res) {
  console.log('addrequest: debut' );
  var db = req.db;
  var collection = db.get('request');
  collection.insert(req.body, function(err, result){
    res.send(
      (err === null) ? { msg: '' } : { msg: err }
    );
  });
});


//Update REQUEST 
//http://programmerblog.net/nodejs-mongodb-tutorial/
router.post('/edit', function(req, res, next){ 
    console.log('editrequest: debut' );
    var db = req.db;
    var collection = db.get('request');
    var username      = req.body.username;
    var status        = req.body.status;
    var file          = req.body.file;
    console.log('editrequest: id:'+ req.body.id+'->'+status);
    console.log('editrequest: file'+file );
    collection.update({'id':req.body.id}, 
    { $set: {'status': status} }, function(err, result) { 
      //if(err) { throw err; }       
      //db.close();       
      //res.redirect('/'); 
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    }); 
});

module.exports = router;
