const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    active: false
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      //Si un ou des roles sont transmis, alors on recerche les id de la collection ROLE et on l'afecte à l'utilisateur créé
      Role.find(
        {
          name: { $in: req.body.roles },
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map((role) => role._id);
          user.save((err) => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      //Si pas de role d'indiqué, on cherche l'id correspondnat au role  "user" et on l'affecte au user créé
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save((err) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).send({ message: "Username and password are required!" });
  }
  console.log(`signin username=${req.body.username} password=${req.body.password}`);

  User.findOne({
    username: req.body.username,
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({ message: "Invalid Password!" });
      }

      const token = jwt.sign({ id: user.id },
                              config.secret,
                              {
                                algorithm: 'HS256',
                                allowInsecureKeySizes: true,
                                expiresIn: 86400, // 24 hours
                              });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }

      req.session.token = token;

      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        token: token,
      });
    });
};

exports.googleSignIn = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).send({ message: "idToken requis" });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // Chercher l'user par googleId puis par email
    let user = await User.findOne({ googleId }).populate("roles", "-__v");
    if (!user) user = await User.findOne({ email }).populate("roles", "-__v");

    if (!user) {
      // Nouvel utilisateur → créer avec active=false (approbation admin requise)
      const defaultRole = await Role.findOne({ name: "user" });
      const newUser = new User({
        username: name || email.split("@")[0],
        email,
        googleId,
        roles: [defaultRole._id],
        active: false,
      });
      await newUser.save();
      return res.status(200).send({
        message: "Votre demande est en attente d'approbation.",
        pendingApproval: true,
      });
    }

    // Lier googleId si l'user existait déjà sans lui
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    if (!user.active) {
      return res.status(403).send({ message: "Compte en attente d'approbation." });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      algorithm: "HS256",
      allowInsecureKeySizes: true,
      expiresIn: 86400,
    });

    const authorities = user.roles.map(r => "ROLE_" + r.name.toUpperCase());
    req.session.token = token;

    return res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: authorities,
      token,
    });
  } catch (err) {
    return res.status(500).send({ message: err.toString() });
  }
};

exports.signout = async (req, res) => {
  try {
    console.log('signout debut');
    req.session = null;
    return res.status(200).send({ message: "You've been signed out!" });
  } catch (err) {
    console.log('signout err');
    console.log(err);
    this.next(err);
  }
};
