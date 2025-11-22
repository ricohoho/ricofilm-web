const { authJwt } = require("../app/middlewares");
const axios = require('axios');
var express = require('express');
var router = express.Router();
const { getSQLMongo } = require('../app/controllers/film.controller');
const { callExternalServiceMistral } = require('../app/services/externalService');

var RECHERCHE_ACTEUR = 'acteur:'
var RECHERCHE_REAL = 'real:'
var RECHERCHE_TITRE = 'titre:'
var RECHERCHE_ID = 'id:'
var RECHERCHE_YYYYMM = 'yyyymm';
var RECHERCHE_IA = 'ia:';
var RECHERCHE_IA2 = 'ia2:';
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
router.get('/', function (req, res, next) {
  //RICO : index  est le nom du tempate .jade !
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.render('index', { title: 'RicoFilm' });
});



/* GET list film */
/* renvoi les liens des images des n dernier film ajoutés  : 2024/08/25 */
/**
 * @swagger
 * /films/listmenufilmimage:
 *   get:
 *     summary: Get images of the last added films
 *     tags: [Films]
 *     parameters:
 *       - in: query
 *         name: filmname
 *         schema:
 *           type: string
 *         description: Filter by film name
 *     responses:
 *       200:
 *         description: List of film images
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/listmenufilmimage', function (req, res) {
  var db = req.db;
  var collection = db.get('films');
  var _filmname = req.query.filmname;
  var _skip = 0;
  var _limit = 10;
  var _sort = 'UPDATE_DB_DATE';
  var _sortsens = '-1';
  //PAs de filtre
  var srequete = '{}';
  var objrequete = JSON.parse(srequete);

  const projection = { original_title: 1 };

  optionBDString = '{' +
    '"projection":{ "id": 1,"original_title":1,"title":1,"UPDATE_DB_DATE":1,"backdrop_path":1,"credits":1,"poster_path":1},' +
    '"limit": ' + _limit + ',' +
    '"skip":' + _skip + ',' +
    '"sort":{"' + _sort + '":' + _sortsens + '}' +
    '}';
  console.log('optionBD:' + optionBDString);
  optionBD = JSON.parse(optionBDString);

  collection.find(objrequete, optionBD, function (e, docs) {
    res.json(docs);
    console.log('retour XML:docs');
  });
});

/* GET list film */
/* liste rapide utilisée dans la reherche locale angular apres chauqe frappe de lettre
Cette endpoint rammene tout les film en local avec juste l'id et le title et l'originale_title*/
/**
 * @swagger
 * /films/listselect:
 *   get:
 *     summary: Get a selection list of films
 *     tags: [Films]
 *     parameters:
 *       - in: query
 *         name: filmname
 *         schema:
 *           type: string
 *         description: Filter by film name
 *     responses:
 *       200:
 *         description: Selection list of films
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/listselect', [authJwt.verifyToken], function (req, res) {
  var db = req.db;
  var collection = db.get('films');
  var _filmname = req.query.filmname;
  var _skip = 0;
  var _limit = 0;
  var _sort = 'original_title';
  var _sortsens = '1';
  //PAs de filtre
  var srequete = '{}';

  //2025/10/31 : Assouplissement de la requete : on cherche dans title et original_title
  //Attention on n'envoi plus de _filmname car on fait une recherche en local et totale depuis angular
  //var objrequete = JSON.parse(srequete);
  var objrequete = {};
  if (_filmname && _filmname.trim() !== "") {
    objrequete = {
      $or: [
        { original_title: { $regex: _filmname, $options: "i" } },
        { title: { $regex: _filmname, $options: "i" } }
      ]
    };
  }

  const projection = { original_title: 1 };

  optionBDString = '{' +
    '"projection":{ "id": 1,"original_title":1,"title":1},' +
    '"limit": ' + _limit + ',' +
    '"skip":' + _skip + ',' +
    '"sort":{"' + _sort + '":' + _sortsens + '}' +
    '}';
  console.log('optionBD:' + optionBDString);
  optionBD = JSON.parse(optionBDString);

  collection.find(objrequete, optionBD, function (e, docs) {
    res.json(docs);
    console.log('retour XML:docs');
  });
});



/* GET list film */
//router.get('/list', [authJwt.verifyToken], async function(req, res) {
/**
 * @swagger
 * /films/list:
 *   get:
 *     summary: Get a list of films
 *     tags: [Films]
 *     parameters:
 *       - in: query
 *         name: filmname
 *         schema:
 *           type: string
 *         description: Filter by film name
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of records to skip
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records to return
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field
 *       - in: query
 *         name: sortsens
 *         schema:
 *           type: string
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: List of films
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/list', async function (req, res) {

  console.log('film/list:');
  //res.header("Access-Control-Allow-Origin", "*");
  //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  var db = req.db;
  var collection = db.get('films');
  var _filmname = req.query.filmname;
  //Skip : Commencer a afficher la liste à partie de la ligne = Skip
  var _skip = req.query.skip;
  var _infocount = req.query.infocount;
  //TRi ! 2021/01
  var _sort = req.query.sort;
  var _sortsens = req.query.sortsens;

  var _limit = req.query.limit;
  if (!_limit) {
    _limit = 20;
  } else {
    _limit = parseInt(_limit, 10);
  }

  var _NbFilms = 0;
  var filmTitlesFromIA = null;

  if (!_skip) {
    _skip = 0;
  } else {
    _skip = parseInt(_skip, 10);
  }

  if (!_sort) {
    _sort = 'original_title';
  }

  if (!_sortsens) {
    _sortsens = '1';
  }

  sortComplet = "['" + _sort + "','" + _sortsens + "']";
  sortComplet = '{ "sort" : [{"' + _sort + '":' + _sortsens + '}]}';
  console.log('skip/sortComplet=' + _skip + '/' + sortComplet);


  console.log('requete _filmname: ' + _filmname);
  //1 - Gestion de la recherche centraliséé et via IA
  if (_filmname) {
    console.log('1 / Filtre avec recherche filmname: ' + _filmname);
    //============ infos===============
    //  https://stackoverflow.com/questions/8246019/case-insensitive-search-in-mongo
    //=================================
    console.log('requete index: ' + _filmname.indexOf(RECHERCHE_ACTEUR) + '-' + RECHERCHE_ACTEUR.length);
    if (_filmname.indexOf(RECHERCHE_ACTEUR) == 0) {
      _filmname = _filmname.substring(_filmname.indexOf(RECHERCHE_ACTEUR) + RECHERCHE_ACTEUR.length);
      console.log('requete [acteur]: ' + _filmname);
      var objrequete = { "credits.cast.name": { '$regex': _filmname, '$options': 'i' } };
    } else if (_filmname.indexOf(RECHERCHE_REAL) == 0) {
      _filmname = _filmname.substring(_filmname.indexOf(RECHERCHE_REAL) + RECHERCHE_REAL.length);
      console.log('requete [real]: ' + _filmname);
      var objrequete = { "credits.crew.name": { '$regex': _filmname, '$options': 'i' } };
    } else if (_filmname.indexOf(RECHERCHE_ID) == 0) {
      _filmname = _filmname.substring(_filmname.indexOf(RECHERCHE_ID) + RECHERCHE_ID.length);
      console.log('requete [id]: <' + _filmname + '>');
      int_id = parseInt(_filmname, 10);;
      var objrequete = { "id": int_id };
    } else if (_filmname.indexOf(RECHERCHE_YYYYMM) == 0) {
      _filmname = _filmname.substring(_filmname.indexOf(RECHERCHE_YYYYMM) + RECHERCHE_YYYYMM.length + 1);
      console.log('requete [yyyymm]: <' + _filmname + '>');
      _yyyy = _filmname.substring(0, 4);
      _mm = _filmname.substring(4, 6);
      console.log('requete [_yyyy]: <' + _yyyy + '>');
      console.log('requete [_mm]: <' + _mm + '>');
      _DateMin = _yyyy + '-' + _mm + '-01';
      _DateMax = _yyyy + '-' + _mm + '-30';
      //db.bios.find( { birth: { $gt: new Date('1940-01-01'), $lt: new Date('1960-01-01') } } )
      var objrequete = {
        UPDATE_DB_DATE: { $gt: new Date(_DateMin), $lt: new Date(_DateMax) }
      };
    } else if (_filmname.indexOf(RECHERCHE_TITRE) == 0) {
      _filmname = _filmname.substring(_filmname.indexOf(RECHERCHE_TITRE) + RECHERCHE_TITRE.length);
      console.log('requete [titre]: ' + _filmname);
      var objrequete = {
        $or: [
          { original_title: { '$regex': _filmname, '$options': 'i' } },
          { title: { '$regex': _filmname, '$options': 'i' } }
        ]
      };
    } else if (_filmname.indexOf(RECHERCHE_IA) == 0 || _filmname.indexOf(RECHERCHE_IA2) == 0) {
      console.log('requete init IA: ' + _filmname);
      var iaChoice = '';
      if (_filmname.indexOf(RECHERCHE_IA) == 0) {
        iaChoice = RECHERCHE_IA;
      }
      if (_filmname.indexOf(RECHERCHE_IA2) == 0) {
        iaChoice = RECHERCHE_IA2;
      }
      console.log('iaChoice: ' + iaChoice);

      _filmname = _filmname.substring(_filmname.indexOf(iaChoice) + iaChoice.length);
      console.log('requete IA: ' + _filmname);
      const requestData = { requete: _filmname };
      try {

        var srequete = await callExternalServiceMistral(iaChoice, requestData);

        if (iaChoice == RECHERCHE_IA2 && srequete != null) {
          /*le retour est sous la forme  : La réponse est un objet JSON: 
          [
              { imdb_id: 'tt12593682', title: 'Bullet Train' },
              { imdb_id: 'tt2402702', title: 'The Lost City' },
              { imdb_id: 'tt2935510', title: 'Ad Astra' },
              { imdb_id: 'tt7131622', title: 'Once Upon a Time in Hollywood' },
              { imdb_id: 'tt5463162', title: 'Deadpool 2' },
              { imdb_id: 'tt2668864', title: 'War Machine' },
              { imdb_id: 'tt0496424', title: 'Allied' },
              { imdb_id: 'tt3774114', title: 'By the Sea' }
            ] 
          il faut le convertir en requete MongoDB, on garde les titres pour info: 
                {
                  imdb_id: {
                    $in: [
                      'tt12593682',
                      'tt2402702',
                      'tt2935510',
                      'tt7131622',
                      'tt5463162',
                      'tt2668864',
                      'tt0496424',
                      'tt3774114'
                    ]
                  }
                }
            */
          //filmTitlesFromIA = srequete.map(item => item.title);
          filmTitlesFromIA = Array.from(new Set(srequete.map(item => item.title)));
          srequete = convertToMongoInQueryTitle(srequete);
          console.log('srequete convertie="' + iaChoice + '"', srequete);
        }

        console.log('srequete=', srequete);
        // Vérifie si la réponse est déjà un objet JSON, en effet sur les requetes simple 
        // on a directment un json par exmple : { 'credits.cast.name': 'Aaron Taylor-Johnson' }
        if (srequete == null) {
          var srequete = '{}';
          var objrequete = JSON.parse(srequete);
        } else {
          if (typeof srequete === 'object') {
            var objrequete = srequete;
          } else {
            var objrequete = JSON.parse(srequete);
          }
        }

      } catch (error) {
        console.error('Error calling external service IA:', error);
        var objrequete = { "id": "0" };
        var objrequete = JSON.parse(srequete);
        //throw error;
      }
      console.log('requete IA: ' + objrequete);
    } else {
      //Recherche Centralisée : titre / acteur / realisateur
      console.log('requete [centralisée] sans indication de recherche: ' + _filmname)
      var objrequete = {
        $or: [
          { original_title: { '$regex': _filmname, '$options': 'i' } },
          { title: { '$regex': _filmname, '$options': 'i' } },
          { "credits.cast.name": { '$regex': _filmname, '$options': 'i' } },
          { "credits.crew.name": { '$regex': _filmname, '$options': 'i' } }
        ]
      };
    }

  } else {
    //2 - Gestion de la recherche detaillée
    console.log('2 / Filtre avec recherche filtre detaillée: ');
    console.dir(req.query, { depth: null, colors: true });
    const { title, original_title, actor, director, release_year, status } = req.query;
    var objrequete = {};
    console.log('1title=' + title);
    // Titre partiel
    if (title) {
      console.log('2title=' + title);
      //objrequete.title = { '$regex': new RegExp(title, 'i') };
      objrequete.title = { '$regex': title, '$options': 'i' }
      /*
      objrequete = { $or: [
                        {original_title:{'$regex' : title, '$options' : 'i'}},
                        {title:{'$regex' : title, '$options' : 'i'}}
                     ]};
      */
    }

    if (original_title) {
      objrequete.original_title = { $regex: new RegExp(original_title, 'i') };
    }

    // Acteur
    if (actor) {
      objrequete['credits.cast.name'] = { $regex: new RegExp(actor, 'i') };
    }

    // Réalisateur
    if (director) {
      objrequete['credits.crew'] = {
        $elemMatch: {
          job: { $regex: /Director/i },
          name: { $regex: new RegExp(director, 'i') }
        }
      };
    }

    // Année
    if (release_year) {
      objrequete.release_date = {
        $gte: new Date(`${release_year}-01-01`),
        $lt: new Date(`${Number(release_year) + 1}-01-01`)
      };
    }

    // Statut
    if (status) {
      objrequete.status = status;
    }

  }

  console.log('sortComplet' + sortComplet);

  optionBDString = '{' +
    '"limit": ' + _limit + ',' +
    '"skip":' + _skip + ',' +
    '"sort":{"' + _sort + '":' + _sortsens + '}' +
    '}';
  console.log('optionBD:' + optionBDString);
  optionBD = JSON.parse(optionBDString);

  console.log('info count=' + _infocount);

  if (!_infocount) {

    try {
      collection.count(objrequete, {}, function (e, count) {
        console.log('Nb count docs' + count);
        _NbFilms = count;
      });

      collection.find(objrequete, optionBD, async function (e, docs) {
        //traitment spcifique à la recherche IA : on complete avec les film manquant de la base de donnée
        if (filmTitlesFromIA) {
          //Tableau des titre : ["titre1","titre2"]
          const foundTitles = docs.map(doc => doc.original_title);
          console.log('foundTitles(film BD)=', foundTitles);
          //Tableau des film present dans filmTitlesFromIA et pas présent dans  foundTitles
          const missingTitles = filmTitlesFromIA.filter(title => !foundTitles.includes(title));
          console.log('missingTitles(à chercher sur TMDB)=', missingTitles);
          //Si il existe des film missing
          if (missingTitles.length > 0) {
            //Pour chaque film faire une recherche sur le film MovieDB en assychrone
            const tmdbPromises = missingTitles.map(title => searchMovieOnTMDB(title));
            //Attendre le retour pour chache recherche de film
            const tmdbResults = await Promise.all(tmdbPromises);

            const newFilms = tmdbResults.filter(film => film !== null).map(film => {
              film._id = film.id;
              film.status = 'added_from_tmdb';
              film.RICO_FICHIER = [];
              return film;
            });

            docs = docs.concat(newFilms);
          }
        }
        //Add header info
        res.append('NbFilms', _NbFilms);
        res.json(docs);
        console.log('retour XML');
      });
    } catch (error) {
      console.log('error execution Mongo' + error);
      res.send(error);
    }




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
    collection.count(objrequete, {}, function (e, count) {
      console.log('Nb count docs' + count);
      var obj = new Object();
      obj.count = count
      res.json(obj);
    });
  }


  /**
   * @swagger
   * /films/detail/{film}:
   *   get:
   *     summary: Get film details
   *     tags: [Films]
   *     parameters:
   *       - in: path
   *         name: film
   *         required: true
   *         schema:
   *           type: string
   *         description: The film name or ID
   *     responses:
   *       200:
   *         description: Film details
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   */
  router.get('/detail/:film', function (req, res) {
    console.log('get(x:film');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var db = req.db;
    var collection = db.get('films');

    //var _film=req.query.film;
    var _film = req.params.film;
    console.log('requete: film ' + _film);
    if (_film) {
      var objrequete = { original_title: { '$regex': _film, '$options': 'i' } }
    } else {
      var srequete = '{}';
      var objrequete = JSON.parse(srequete);
    }

    collection.find(objrequete, {}, function (e, docs) {
      res.json(docs);
    });



  });


  /* POST to add film. */
  /**
   * @swagger
   * /films/add:
   *   post:
   *     summary: Add a new film
   *     tags: [Films]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Film added successfully
   */
  router.post('/add', function (req, res) {
    console.log('addFilm: debut');
    var db = req.db;
    var collection = db.get('films');
    collection.insert(req.body, function (err, result) {
      res.send(
        (err === null) ? { msg: '' } : { msg: err }
      );
    });
  });



});


// Convertit un tableau d'objets { imdb_id, title } en requête MongoDB { imdb_id: { $in: [...] } }
function convertToMongoInQueryImdb(array) {
  return {
    imdb_id: {
      $in: array.map(item => item.imdb_id)
    }
  };
}

// Convertit un tableau d'objets { imdb_id, title } en requête MongoDB { original_title: { $in: [...] } }
function convertToMongoInQueryTitle(array) {
  console.log('convertToMongoInQueryTitle array=', array);
  return {
    original_title: {
      $in: array.map(item => item.title)
    }
  };
}

// Search for a movie on TheMovieDB
async function searchMovieOnTMDB(title) {
  console.log(`Searching TMDB for movie: ${title}`);
  // TMDB API endpoint for searching movies
  // We use encodeURIComponent to handle special characters in the title
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1`;
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.TMDB_API_BEARER_TOKEN}`
    }
  };

  try {
    const response = await axios.get(url, options);
    if (response.data && response.data.results && response.data.results.length > 0) {

      //il faudrait retouner le detail du film plutot que le resultat de la recherche
      const filmId = response.data.results[0].id;
      const sURLDetailImdb = `https://api.themoviedb.org/3/movie/${filmId}?api_key=${process.env.TMDB_API_KEY}&language=fr-FR&append_to_response=credits,videos`;
      console.log(`Fetching TMDB details for movie ID: ${filmId} from URL: ${sURLDetailImdb}`);
      const detailResponse = await axios.get(sURLDetailImdb);
      if (detailResponse.data) {
        return detailResponse.data; // Return detailed movie info
      } else {
        return null; // No detailed data found
      }
      //return response.data.results[0]; // Return the first, most likely result
    }
    return null; // No results found
  } catch (error) {
    console.error(`Error fetching movie "${title}" from TMDB:`, error);
    return null;
  }
}

module.exports = router;
