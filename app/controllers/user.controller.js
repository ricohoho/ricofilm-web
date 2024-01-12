const db = require("../models");
const User = db.user;
const UserDto = require('../models/user.dto');

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

//Liste des utilisateurs 
exports.userList  = (req, res) => {  
    /*
    User.find({},
       (err, users) => {
	       if (err) {
	          res.status(500).send({ message: err });
	          return;
	       }                      
    	// Mapper les utilisateurs vers des DTO
	  	const userDtos = users.map(user => new UserDto(user.username, user.email,roleList(user)));  
    	res.status(200).send(userDtos);
        return ;      
    	}
    );
	*/
	User.find()
	.populate("roles", "-__v")
    .exec((err, users) => {
	    if (err) {
	      res.status(500).send({ message: err });
	      return;
	    }

		console.log(users);
		console.log('---');

  		const userDto = users.map(user => new UserDto(user.username, user.email,roleList(user),user.roles));  
  		res.status(200).send(userDto);
		return;

	});

};

roleList = (user) => {
	console.log('---roleList');
	console.log(user);	
	
	var authorities = [];
	for (let i = 0; i < user.roles.length; i++) {
		console.log('i:'+i);	
        authorities.push("ROLE_" + user.roles[i].name);
      }
     return authorities;
     
     //return "X";
}

