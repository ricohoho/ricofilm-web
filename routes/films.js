var express = require('express');
var router = express.Router();

/*
URL :
  http://localhost:3000/films/detail/ava -> detail du film AVA
  http://localhost:3000/films/filmlist-> tt les film
  http://localhost:3000/films/list?filmname=cage --> tt les film avec 'cage': titre / acteur / meteur en scene
  http://localhost:3000/films/#  --> web
*/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET userlist. */
router.get('/list', function(req, res) {
  var db = req.db;
  var collection = db.get('films');

  var _filmname=req.query.filmname;
  var _skip=req.query.skip;

  if(!_skip) {
    _skip=0;
  } else {
    _skip=parseInt(_skip, 10);
  }
  console.log('skip='+_skip);

  console.log('requete: '+_filmname );
  if(_filmname) {
    console.log('Filtre');
    //var srequete='{"original_title":"'+_filmname+'"}';
    //var objrequete = JSON.parse(srequete);
    //    var objrequete = {original_title: new RegExp('(?=.*' + _filmname+')')};
    //============ infos===============
    //https://stackoverflow.com/questions/8246019/case-insensitive-search-in-mongo

    var objrequete = { $or: [
                        {original_title:{'$regex' : _filmname, '$options' : 'i'}},
                        {"credits.cast.name":{'$regex' : _filmname, '$options' : 'i'}},
                        {"credits.crew.name":{'$regex' : _filmname, '$options' : 'i'}}
                     ]};

  } else  {
    var srequete='{}';
    var objrequete = JSON.parse(srequete);
  }
  /*Exemple de requete mongoDB
  //var optionBD={collation:{locale:'en',strength:2}};
  Paging
  {
  "limit": 20,
  "skip": 10
  }
  */
  var optionBD={
    "limit": 20,
    "skip": _skip,
    "sort":['insertDate','desc']
    //"sort": "original_title"
  };

  collection.find(objrequete,optionBD,function(e,docs){
    res.json(docs);
  });//.sort( { release_date: 1 } ).limit(5);


  router.get('/detail/:film', function(req, res) {
    console.log('get(x:film' );
    var db = req.db;
    var collection = db.get('films');

    //var _film=req.query.film;
    var _film=req.params.film;
    console.log('requete: film '+_film );
    if(_film) {
      var objrequete = {original_title:{'$regex' : _film, '$options' : 'i'}}
    } else  {
      var srequete='{}';
      var objrequete = JSON.parse(srequete);
    }
    collection.find(objrequete,{},function(e,docs){
      res.json(docs);
    });
  });


});

module.exports = router;
