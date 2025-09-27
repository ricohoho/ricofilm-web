// services/externalService.js
const axios = require('axios');
//const iaConfig = require("../../app/config/ia.config");
const dotenv = require('dotenv');
var path = require('path');

// Function to call the external service
const  callExternalServiceMistral = async (iaChoice,requestData) => {
  try {
    console.log('requestData='+requestData)

    // Détermine l'environnement actif (par défaut : 'local')
    const env = process.env.NODE_ENV || 'local';
    // Charge le fichier .env correspondant
    dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });
    console.log(`✅ Loaded configuration for environment: ${env}`);

    //A mettre en var d'env.
    var RECHERCHE_IA='ia:';
    var RECHERCHE_IA2='ia2:';

    const IA_HOST = process.env.IA_HOST;
    const IA_PORT = process.env.IA_PORT;
    var IA_URL = process.env.IA_URL;
    var IA_PROTOCOL = process.env.IA_PROTOCOL || 'http';
    if (iaChoice===RECHERCHE_IA2){
      IA_URL = process.env.IA2_URL;
    } 
    console.log(`IA_PROTOCOL=${IA_PROTOCOL}`);
    console.log(`IA_HOST=${IA_HOST}`);
    console.log(`IA_PORT=${IA_PORT}`);
    console.log(`IA_URL=${IA_URL}`);
    
    IA_URL_COMLETE=IA_PROTOCOL+`://${IA_HOST}:${IA_PORT}/${IA_URL}`;
    console.log(`IA_URL_COMLETE=${IA_URL_COMLETE}`);
    // Effectue la requête POST vers le service externe

    const response = await axios.post(IA_URL_COMLETE,requestData); //172.17.0.3
    
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
    //throw error;
    return null;
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