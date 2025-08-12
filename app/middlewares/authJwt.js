const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;
const Role = db.role;

//cette fct utilise session : stadefull,
verifyToken_old = (req, res, next) => {
  console.log('verifyToken:');
  let token = req.session.token;

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token,
            config.secret,
            (err, decoded) => {
              if (err) {
                return res.status(401).send({
                  message: "Unauthorized!",
                });
              }
              req.userId = decoded.id;
              next();
            });
};

//cette fct utilise session : stadeless
verifyToken = (req, res, next) => {
  console.log('Middleware verifyToken activé.');

  // 1. On cherche le token dans l'en-tête "authorization"
  let authHeader = req.headers["authorization"];

  if (!authHeader) {
    console.error("Aucun en-tête d'autorisation trouvé.");
    return res.status(403).send({ message: "No token provided!" });
  }

  // L'en-tête est au format "Bearer VOTRE_TOKEN", on ne récupère que le token
  let token = authHeader.split(' ')[1];

  if (!token) {
    console.error("Le format de l'en-tête est incorrect ou le token est manquant.");
    return res.status(403).send({ message: "Malformed token!" });
  }
  
  console.log("Token reçu, en cours de vérification...");

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      console.error("Erreur de vérification JWT:", err.message);
      return res.status(401).send({ message: "Unauthorized! Token is not valid." });
    }
    
    // Le token est valide, on attache l'ID de l'utilisateur à la requête
    req.userId = decoded.id;
    console.log("Token valide. Utilisateur ID:", req.userId);
    next(); // On passe à la suite
  });
};

isAdmin = (req, res, next) => {
  User.findById(req.userId).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    Role.find(
      {
        _id: { $in: user.roles },
      },
      (err, roles) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "admin") {
            next();
            return;
          }
        }

        res.status(403).send({ message: "Require Admin Role!" });
        return;
      }
    );
  });
};

isModerator = (req, res, next) => {
  User.findById(req.userId).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    Role.find(
      {
        _id: { $in: user.roles },
      },
      (err, roles) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "moderator") {
            next();
            return;
          }
        }

        res.status(403).send({ message: "Require Moderator Role!" });
        return;
      }
    );
  });
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
};
module.exports = authJwt;
