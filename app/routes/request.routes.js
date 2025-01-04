const { authJwt } = require("../middlewares");
const controller = require("../controllers/request.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });


//liste des utilsiateutrs
app.get("/api/request/list",
    //acces moderateur obligatoire
    //[authJwt.verifyToken, authJwt.isModerator],
    controller.requestList
  );

};
