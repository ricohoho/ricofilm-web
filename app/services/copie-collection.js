const monk = require('monk');
const sourceDb = monk('mongodb://ricoAdmin:rineka5993@davic.mkdh.fr:27017/ricofilm');
//const targetDb = monk('mongodb://172.21.82.150:27017/ricofilm');
const targetDb = monk('mongodb://root:example@34.155.114.90:27017/ricofilm');

const sourceCollection = sourceDb.get('films');
const targetCollection = targetDb.get('films');

(async () => {
    //const docs = await sourceCollection.find({});

    // Récupérer les 100 premiers documents (selon l'ordre d'insertion par défaut)
    console.log("Devut de la copie");
    const docs = await sourceCollection.find({}, { limit: 6416 });
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