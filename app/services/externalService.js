// services/externalService.js
const axios = require('axios');
const iaConfig = require("../../app/config/ia.config");

// Function to call the external service
const  callExternalServiceMistral = async (requestData) => {
  try {
    console.log('requestData='+requestData)
    const response = await axios.post(`http://${iaConfig.HOST}:${iaConfig.PORT}/${iaConfig.URL}`,requestData); //172.17.0.3
    
    if (response.status === 200 && response.data) {


          // Vérifie si la réponse est déjà un objet JSON, en effet sur les requetes simple 
          // on a directment un json par exmple : { 'credits.cast.name': 'Aaron Taylor-Johnson' }
        if (typeof response.data === 'object') {
          console.log('La réponse est un objet JSON:', response.data);
        } 
        // Si c'est une chaîne, tente de la parser en JSON
        else if (typeof response.data === 'string') {          
          console.log('Réponse valide Init :[', response.data+']');
          response.data = replaceAndInString(response.data);
          console.log('Réponse valide apres replaceAndInString :[', response.data+']');
          response.data = removeTrailingSemicolon(response.data);
          console.log('Réponse valide apres removeTrailingSemicolon :[', response.data+']');
        }
        return response.data;
    } else {
        console.error('Erreur HTTP:', response.status, response.statusText);
        throw new Error('Erreur HTTP');
    }    
  } catch (error) {
    console.error('Error calling external service:', error);
    throw error;
  }
};

// Function to replace $and with "$and" in a string
function replaceAndInString(inputString) {
    if (typeof inputString !== 'string') {
      throw new Error('Input must be a string');
    }
    var retour = inputString.replace(/\$and/g, '"$and"');
    retour=retour.replace(/\$or/g, '"$or"');
    retour=retour.replace(/\$options/g, '"$options"');
    retour=retour.replace(/\$regex/g, '"$regex"');
    retour=retour.replace(/\$gt/g, '"$gt"');
    retour=retour.replace(/\$elemMatch/g, '"$elemMatch"');
    retour=retour.replace(/\//g, '""');
    

    return retour;
  }



  // Fonction pour supprimer le caractère ; à la fin d'une chaîne
function removeTrailingSemicolon(inputString) {
  if (typeof inputString !== 'string') {
    throw new Error('Input must be a string');
  }
  return inputString.endsWith(';') ? inputString.slice(0, -1) : inputString;
}

module.exports = { callExternalServiceMistral };