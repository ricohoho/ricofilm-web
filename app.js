var createError = require('http-errors');
var express = require('express');
const dotenv = require('dotenv');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//== Ajour de l'authentificaiton avec JWT + Mango + Express
//https://www.bezkoder.com/node-js-express-login-mongodb/ 
//EF 20231028 authent
const cors = require("cors");
const cookieSession = require("cookie-session");


// Détermine l'environnement actif (par défaut : 'local')
const env = process.env.NODE_ENV || 'local';
// Charge le fichier .env correspondant
dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });
console.log(`✅ Loaded configuration for environment: ${env}`);



// Database
var monk = require('monk');
// Construire la chaîne de connexion en fonction de la présence de DB_USER et DB_PASSWORD

const dbPrefix = process.env.DB_PREFIX; // mongodb ou mongodb+srv
const dbPrefixURL = dbPrefix ? `${dbPrefix}://` : 'mongodb://';
console.log(`dbPrefixURL=${dbPrefixURL}`);

const dbPostfix = process.env.DB_POSTFIX;
const dbPostfixURL = dbPostfix ? `${dbPostfix}` : '';
console.log(`dbPostfix=${dbPostfixURL}`);


const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
console.log(`dbUser=${dbUser}`);
console.log(`dbPassword=${dbPassword}`);
const authPart = dbUser && dbPassword ? `${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@` : '';
console.log(`authPart=${authPart}`);
const dbPortURL = process.env.DB_PORT ? `:${process.env.DB_PORT}` : '';
console.log(`dbPortURL=${dbPortURL}`);
//Version Local
//var db = monk('localhost:27017/ricofilm');
//var db = monk('mongo-container:27017/ricofilm');
//===> avec fichier de conf <===============================
//const dbConfig = require("./app/config/db.config");
//var db = monk(`${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`);
//============================================================
//var db = monk(`172.21.82.150:27017/ricofilm`);
//var db = monk('mongodb://ricoAdmin:rineka5993@davic.mkdh.fr:27017/ricofilm');
//===> Utilisation des variables d'environnement pour la connexion <===============================
//const db = monk(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

//Version cnx Mongo OK
// const db = monk(`mongodb://${authPart}${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
//Version cnx Mongo extnsion cnx Cloud Atlas
//monk('mongodb+srv://ricohoho:aBgU4K9OvjZlxbJ4@ricofilm.qvkgeo4.mongodb.net/ricofilm?retryWrites=true&w=majority&appName=ricofilm');
const dbURL = `${dbPrefixURL}${authPart}${process.env.DB_HOST}${dbPortURL}/${process.env.DB_NAME}${dbPostfixURL}`

const db = monk(dbURL);
console.log(`dbURL=${dbURL}`);


//============================================================

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var filmsRouter = require('./routes/films');
var resquestRouter = require('./routes/request');
var imageRouter = require('./routes/image');
var embyRouter = require('./routes/emby');


var app = express();

//Nouvelle version avec plusieurs URL possibles
const URL_CORS_ACCEPT = process.env.URL_CORS_ACCEPT?.split(",") || [];

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      // Si pas d'origine (ex: Postman) => autoriser
      if (!origin) return callback(null, true);

      const allowedOrigins = [...URL_CORS_ACCEPT, "http://localhost:3000", "http://127.0.0.1:3000"];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    optionsSuccessStatus: 200
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

// Swagger Configuration
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ricofilm API',
      version: '1.0.0',
      description: 'API documentation for Ricofilm application',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server',
      },
    ],
  },
  apis: ['./routes/*.js', './app/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



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

console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_PORT =", process.env.DB_PORT);
console.log("DB_NAME =", process.env.DB_NAME);
console.log("IA_PORT =", process.env.IA_PORT);
console.log("IA_PROTOCOL=", process.env.IA_PROTOCOL);
console.log("IA_HOST =", process.env.IA_HOST);
console.log("authPart =", authPart);
console.log("EMBY_HOST =", process.env.EMBY_HOST);
console.log("EMBY_API_KEY =", process.env.EMBY_API_KEY);


//mongodb://user:pass@localhost:27017/ricofilm?retryWrites=true&w=majority&appName=ricofilm
dbm.mongoose
  //.connect(`mongodb://${authPart}${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, {
  .connect(`${dbURL}`, {
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
app.use(function (req, res, next) {
  req.db = db;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/films', filmsRouter);
app.use('/request', resquestRouter);
app.use('/image', imageRouter);
app.use('/emby', embyRouter);


app.use('/ricofilm/', indexRouter);
app.use('/ricofilm/users', usersRouter);
app.use('/ricofilm/films', filmsRouter);
app.use('/ricofilm/request', resquestRouter);
app.use('/ricofilm/image', imageRouter);
app.use('/ricofilm/emby', embyRouter);

// routes Authentification
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/request.routes")(app);
require("./app/routes/mail.routes")(app);
require("./app/routes/sync.routes")(app);

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
app.use(function (req, res, next) {
  //res.header("Access-Control-Allow-Origin", "*");
  //res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
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
