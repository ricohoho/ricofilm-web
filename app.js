var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//== Ajour de l'authentificaiton avec JWT + Mango + Express
//https://www.bezkoder.com/node-js-express-login-mongodb/
//EF 20231028 authent
const cors = require("cors");
const cookieSession = require("cookie-session");
const dbConfig = require("./app/config/db.config");


// Database
var mongo = require('mongodb');
//20200124
var MongoClient = require('mongodb').MongoClient; 
var monk = require('monk');
//Version Local
var db = monk('localhost:27017/ricofilm');
//var db = monk('mongodb://ricoAdmin:rineka5993@davic.mkdh.fr:27017/ricofilm');




var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var filmsRouter = require('./routes/films');
var resquestRouter = require('./routes/request');
var imageRouter = require('./routes/image');
//var mailRouter = require('./routes/mail');


var app = express();

//permet d'empecher les probleem cors, soit  : 
//=> autoriser une application angular dispo en localhost:4200 de se connecter sur une app node sur le port 3000
 app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:4200',
    optionSuccessStatus: 200
  })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



//EF 20231028 authent =========>
app.use(
  cookieSession({
    name: "bezkoder-session",
    keys: ["COOKIE_SECRET"], // should use as secret environment variable
    httpOnly: true
  })
);
const dbm = require("./app/models");
const Role = dbm.role;

dbm.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });
//<============================


//app.use('/ricofilm', express.static('public'));
app.use('/ricofilm', express.static(__dirname + '/public'));

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/films', filmsRouter);
app.use('/request', resquestRouter);
app.use('/image', imageRouter);


app.use('/ricofilm/', indexRouter);
app.use('/ricofilm/users', usersRouter);
app.use('/ricofilm/films', filmsRouter);
app.use('/ricofilm/request', resquestRouter);
app.use('/ricofilm/image', imageRouter);




// routes Authentification
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/request.routes")(app);
require("./app/routes/mail.routes")(app);


// =========== Option Cors ==========
/*
const cors = require('cors');
var corsOptions = {
    origin: '*',//http://localhost:4200',
    optionsSuccessStatus: 200, // For legacy browser support
    methods: "GET, PUT"
}
app.use(cors(corsOptions));
*/



// catch 404 and forward to error handler
app.use(function(req, res, next) {
	//res.header("Access-Control-Allow-Origin", "*");
	//res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;




//EF 20231028 authent =========>
function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "moderator"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'moderator' to roles collection");
      });

      new Role({
        name: "admin"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
}