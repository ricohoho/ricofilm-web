var express = require('express');
var router = express.Router();
var RECHERCHE_ACTEUR='acteur:'
var RECHERCHE_TITRE='titre:'
/*
URL :  
  http://localhost:3000/films/detail/ava -> detail du film AVA
  http://localhost:3000/films/list-> tt les film
  http://localhost:3000/films/list?filmname=cage --> tt les film avec 'cage': titre / acteur / meteur en scene
  http://localhost:3000/films/#  --> web
  http://localhost:3000/films/list?filmname=pitt&skip=0&infocount=O --> le nb de fiml qui match !
*/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'RicoFilm' });
});

/* GET userlist. */
router.get('/list', function(req, res) {
  var db = req.db;
  var collection = db.get('films');

  var _filmname=req.query.filmname;
  var _skip=req.query.skip;
  var _infocount=req.query.infocount;

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
    console.log('requete index: '+_filmname.indexOf(RECHERCHE_ACTEUR) +'-'+RECHERCHE_ACTEUR.length);
    if (_filmname.indexOf(RECHERCHE_ACTEUR)==0) {
      _filmname=_filmname.substring(_filmname.indexOf(RECHERCHE_ACTEUR)+RECHERCHE_ACTEUR.length);
      console.log('requete [acteur]: '+_filmname );
      var objrequete = {"credits.cast.name":{'$regex' : _filmname, '$options' : 'i'}};
    } else if (_filmname.indexOf(RECHERCHE_TITRE)==0) {
      _filmname=_filmname.substring(_filmname.indexOf(RECHERCHE_TITRE)+RECHERCHE_TITRE.length);
      console.log('requete [titre]: '+_filmname );
      var objrequete = { $or: [
                        {original_title:{'$regex' : _filmname, '$options' : 'i'}},
                        {title:{'$regex' : _filmname, '$options' : 'i'}}
                     ]};
    } else {
      var objrequete = { $or: [
                        {original_title:{'$regex' : _filmname, '$options' : 'i'}},
                        {title:{'$regex' : _filmname, '$options' : 'i'}},
                        {"credits.cast.name":{'$regex' : _filmname, '$options' : 'i'}},
                        {"credits.crew.name":{'$regex' : _filmname, '$options' : 'i'}}
                     ]};
    }

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
    //"sort":'RICO.fileDate'
    "sort":"-RICO.fileDate"
    //"sort":['title','asc']
    //"sort": "original_title"
    //"sort":['release_date','desc']
  };
  if(! _infocount) {
    collection.find(objrequete,optionBD,function(e,docs){
      res.json(docs);
      console.log('retour XML');
    });//.sort( { release_date: 1 } ).limit(5);
  } else {
    collection.count(objrequete,{},function(e,count){
      console.log('Nb count docs'+count);
      var obj = new Object();
      obj.count = count
      res.json(obj);
    });
  }


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
