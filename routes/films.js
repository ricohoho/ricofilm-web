var express = require('express');
var router = express.Router();
var RECHERCHE_ACTEUR='acteur:'
var RECHERCHE_TITRE='titre:'
var RECHERCHE_ID='id:'
var RECHERCHE_YYYYMM='yyyymm';
/*
URL :
     -> detail du film AVA
  http://localhost:3000/films/list-> tt les film
  http://localhost:3000/films/list?filmname=cage --> tt les film avec 'cage': titre / acteur / meteur en scene
  http://localhost:3000/films/list?filmname=titre:District  ---> filtrage sur sur le titre
  http://localhost:3000/films/#  --> web
  http://localhost:3000/films/list?filmname=pitt&skip=0&infocount=O --> le nb de fiml qui match !
*/

/* GET home page. */
router.get('/', function(req, res, next) {
  //RICO : index  est le nom du tempate .jade !
  res.render('index', { title: 'RicoFilm' });
});

/* GET list film */
router.get('/list', function(req, res) {

  var db = req.db;
  var collection = db.get('films');
  var _filmname=req.query.filmname;
  //Skip : Commencer a afficher la liste à partie de la ligne = Skip
  var _skip=req.query.skip;
  var _infocount=req.query.infocount;
  //TRi ! 2021/01
  var _sort=req.query.sort;
  var _sortsens=req.query.sortsens;

  var _limit=req.query.limit;
  if (!_limit) {
    _limit=20;
  } else {
    _limit=parseInt(_limit, 10);
  }

  var _NbFilms=0;

  if(!_skip) {
    _skip=0;
  } else {
    _skip=parseInt(_skip, 10);
  }


  if(!_sort) {
    //_sort='[original_title,asc]';
    _sort='original_title';
  }
  
if(!_sortsens) {
//    _sortsens='asc';
    _sortsens='1';
  }
  
  sortComplet = "['"+_sort+"','"+_sortsens+"']";
  sortComplet = '{ "sort" : [{"'+_sort+'":'+_sortsens+'}]}';
  console.log('skip/sortComplet='+_skip+'/'+sortComplet);

  //sortComplet = JSON.parse(sortComplet); 
  //console.log('sortComplet.sort[0].original_title:'+sortComplet.sort[0].original_title);
  //"sort" : {"original_title":1}


  

  console.log('requete _filmname: '+_filmname );
  if(_filmname) {
    console.log('Filtre');
    //var srequete='{"original_title":"'+_filmname+'"}';
    //var objrequete = JSON.parse(srequete);
    //    var objrequete = {original_title: new RegExp('(?=.*' + _filmname+')')};
    //============ infos===============
    //  https://stackoverflow.com/questions/8246019/case-insensitive-search-in-mongo
    console.log('requete index: '+_filmname.indexOf(RECHERCHE_ACTEUR) +'-'+RECHERCHE_ACTEUR.length);
    if (_filmname.indexOf(RECHERCHE_ACTEUR)==0) {
      _filmname=_filmname.substring(_filmname.indexOf(RECHERCHE_ACTEUR)+RECHERCHE_ACTEUR.length);
      console.log('requete [acteur]: '+_filmname );
      var objrequete = {"credits.cast.name":{'$regex' : _filmname, '$options' : 'i'}};
    } else if (_filmname.indexOf(RECHERCHE_ID)==0) {
      _filmname=_filmname.substring(_filmname.indexOf(RECHERCHE_ID)+RECHERCHE_ID.length);
      console.log('requete [id]: <'+_filmname+'>' );
      int_id = parseInt(_filmname, 10);;
      var objrequete = {"id":int_id};
    } else if (_filmname.indexOf(RECHERCHE_YYYYMM)==0) {
        _filmname=_filmname.substring(_filmname.indexOf(RECHERCHE_YYYYMM)+RECHERCHE_YYYYMM.length+1);
        console.log('requete [yyyymm]: <'+_filmname+'>' );
        _yyyy =  _filmname.substring(0,4);
        _mm   =  _filmname.substring(4,6);
        console.log('requete [_yyyy]: <'+_yyyy+'>' );
        console.log('requete [_mm]: <'+_mm+'>' );
        _DateMin = _yyyy+'-'+_mm+'-01';
        _DateMax = _yyyy+'-'+_mm+'-30';
        //db.bios.find( { birth: { $gt: new Date('1940-01-01'), $lt: new Date('1960-01-01') } } )
      var objrequete ={ 
                        UPDATE_DB_DATE: { $gt: new Date(_DateMin), $lt: new Date(_DateMax) } 
                      };

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
  console.log('sortComplet'+sortComplet);

  optionBDString ='{' +
            '"limit": '+_limit+','+
            '"skip":'+ _skip+',' +
            '"sort":{"'+_sort+'":'+_sortsens+'}'+
            '}';
  console.log('optionBD:'+optionBDString);
  optionBD = JSON.parse(optionBDString);

  

  if(! _infocount) {

    collection.count(objrequete,{},function(e,count){
      console.log('Nb count docs'+count);      
      _NbFilms=count;
    });

    collection.find(objrequete,optionBD,function(e,docs){
      //Add header info
      res.append('NbFilms', _NbFilms);
      res.json(docs);
      console.log('retour XML');
    });




/*  ===> tri focntionne!!
        optionBD={limit : 4, "sort" : {"original_title":1}} ;
        collection.find(objrequete,optionBD,
        function(error,docs){
            if(error) {
                res.send(error);
                console.log('error'+error);
            } else{
                //response.send(docs);
                console.log('retour XML'+docs);
                res.json(docs );
            }
        });
*/
    ////20200124
    /*
    url="mongodb://localhost:27017/";
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("ricofilm");
      //Find the first document in the customers collection:
      dbo.collection("films").findOne({}, function(err, result) {
        if (err) throw err;
        console.log(result.name);
        db.close();
      });
    });
   */


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


  /* POST to adduser. */
router.post('/add', function(req, res) {
  console.log('addFilm: debut' );
  var db = req.db;
  var collection = db.get('films');
  collection.insert(req.body, function(err, result){
    res.send(
      (err === null) ? { msg: '' } : { msg: err }
    );
  });
});


});



module.exports = router;
