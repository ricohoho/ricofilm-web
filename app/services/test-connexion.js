const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ricofilm', {
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