var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET userlist. */
router.get('/filmlist', function(req, res) {
  var db = req.db;
  var collection = db.get('films');

  var _filmname=req.query.filmname;
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
                        {"credits.cast.name":{'$regex' : _filmname, '$options' : 'i'}}
                     ]};

  } else  {
    var srequete='{}';
    var objrequete = JSON.parse(srequete);
  }
  //Exemple de requete mongoDB
  //var optionBD={collation:{locale:'en',strength:2}};
  var optionBD={};
  collection.find(objrequete,optionBD,function(e,docs){
    res.json(docs);
  });
});

module.exports = router;
