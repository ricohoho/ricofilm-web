const monk = require('monk');
const sourceDb = monk('mongodb://ricoAdmin:rineka5993@davic.mkdh.fr:27017/ricofilm');
//const targetDb = monk('mongodb://172.21.82.150:27017/ricofilm');
//const targetDb = monk('mongodb://root:example@34.155.114.90:27017/ricofilm');
//const targetDb = monk('mongodb://ricohoho:rico$2025@localhost:27017/ricofilm');
//Version cloud mongo
//const targetDb = monk('mongodb+srv://ricohoho:aBgU4K9OvjZlxbJ4@ricofilm.qvkgeo4.mongodb.net/?retryWrites=true&w=majority&appName=ricofilm');
// ...existing code...
const targetDb = monk('mongodb+srv://ricohoho:aBgU4K9OvjZlxbJ4@ricofilm.qvkgeo4.mongodb.net/ricofilm?retryWrites=true&w=majority&appName=ricofilm');
// ...existing code...


//const sourceCollection = sourceDb.get('films');
//const targetCollection = targetDb.get('films');

//const sourceCollection = sourceDb.get('request');
//const targetCollection = targetDb.get('request');

//const sourceCollection = sourceDb.get('roles');
//const targetCollection = targetDb.get('roles');

const sourceCollection = sourceDb.get('users');
const targetCollection = targetDb.get('users');

(async () => {
    //const docs = await sourceCollection.find({});

    // Récupérer les 100 premiers documents (selon l'ordre d'insertion par défaut)
    console.log("Devut de la copie");
    const docs = await sourceCollection.find({}, { limit: 6393 });
    console.log("apres find");
    try {
        if (docs.length > 0) {
            console.log(">0");
            await targetCollection.insert(docs);
            console.log('✅ Copie des 100 premiers documents terminée !');
      } else {
        console.log('⚠️ Aucun document à copier.');
      }
      console.log("avant exit");

      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur pendant la copie :', err);
      process.exit(1);
    }
    
})();