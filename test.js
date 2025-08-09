// testenv.js
require('dotenv').config({ path: '.env.local' });
console.log(process.env.DB_PASSWORD);