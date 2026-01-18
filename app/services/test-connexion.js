const monk = require('monk');
const mongoose = require('mongoose');
const mongoURL = 'mongodb+srv://ricohoho:aBgU4K9OvjZlxbJ4@ricofilm.qvkgeo4.mongodb.net/?retryWrites=true&w=majority&appName=ricofilm';
//const localDb = monk('mongodb://localhost:27017/ricofilm');
mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ Connexion OK");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion :", err);
    process.exit(1);
  });