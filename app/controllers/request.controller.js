const mongoose = require('mongoose');
//const db = require("../models");
//const RequestModel = db.requestmodel;
const RequestModel = require('../models/request.model');
const RequestDto = require('../models/request.dto');


//Liste des requests 
exports.requestList  = (req, res) => {  
    console.log(RequestModel);
	//UserModel.find({}, (err, utilisateurs) => {

    RequestModel.find({},(err, requests) => {
	    if (err) {
	        res.status(500).send({ message: err });
	        return;
	    }                      
    	// Mapper les utilisateurs vers des DTO
	  	const requestDtos = requests.map(request => new RequestDto(request.file, request.path, request.size,request.username,request.title,request.serveur_name,request.status));  
    	res.status(200).send(requestDtos);
    	//res.status(200).send(requests);
        return ;      
    	}
    );
	

	
};