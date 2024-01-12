var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
  //RICO : user est le nom du tempate .jade !
  res.render('users', { title: 'RicoFilm' });
});

//Function pour lulu et MEDIETATIS //
router.get('/login', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	  var _user=req.query.user;
   	var _pwd=req.query.pwd;
  	//res.send('User = '+_user);
  	if (_user=='lulu' && _pwd=='lulu') {
  		res.send('{"result":"vid.html"}');
  	} else  {
  		res.send('{"result":"failed"}');
  	}
});


module.exports = router;
