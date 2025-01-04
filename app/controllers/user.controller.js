const db = require("../models");
const User = db.user;
const UserDto = require('../models/user.dto');
const mongoose = require("mongoose");

//========= Role ===================================//
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


//========= Utilisateurs ===================================//
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
		var rolesIds = [];
  		const usersDto = users.map(user => new UserDto(user._id,user.username, user.email,roleList(user),rolesIds,user.roles,user.active));  
  		//var rolesIds = [];
		//var rolesString = roleList(users);
  		//const usersDto = users.map(user => new UserDto(user._id,user.username, user.email,rolesString,user.roles,rolesIds,user.active));  

  		res.status(200).send(usersDto);
		return;

	});

};

exports.update = (req, res) => {
	console.log("Update DEBUT");
	if (!req.body) {
		return res.status(400).send({
		  message: "Data to update can not be empty!"
		});
	}

  	const _id = req.params.id;
  	console.log("_id="+_id);
  	const { username, email,active, roles } = req.body;

	console.log('rolesIds/username/email/active');
	console.log(roles+'/'+username+'/'+email+'/'+active);

	
  	// Vérifiez si roleIds est un tableau non vide
    if (!Array.isArray(roles) || roles.length === 0) {
    	console.log('tab vide');
        return res.status(400).json({ error: 'roles doit être un tableau non vide.' });
    } else {
		//Assurez-vous que les IDs de rôle sont des ObjectIds valides
		console.log('bien tableau :)');	
    }
    //contruciton d'un tableau de ObjectID
    const validRoleIds = roles.map(id => mongoose.Types.ObjectId(id));    

	console.log('validRoleIds:');
    console.log(validRoleIds);
	

  	User.findByIdAndUpdate(_id,   	
	  	req.body, 
	  	/*
	  	{ 
 			//$addToSet: { roles: { $each: validRoleIds } }, 
 			//$addToSet: { roles:  validRoleIds  }, 
 			$set: { username: username }, // Mise à jour de la propriété name, 
 			$set: { email: email }//, // Mise à jour de la propriété name, 
 			//$set: { active: active } // Mise à jour de la propriété name
 		},
 		*/
	  	{ new: true, useFindAndModify: false },
	  	).then(data => {
	      if (!data) {
	        res.status(404).send({
	          message: `Cannot update Tutorial with id=${_id}. Maybe Tutorial was not found!`
	        });
	      } else res.send({ message: "Tutorial was updated successfully." });
	    })
	    .catch(err => {
	    	console.log(err);
	      res.status(500).send({
	        message: "Error updating Tutorial with id=" + _id
	      });
	    }
    	)



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

