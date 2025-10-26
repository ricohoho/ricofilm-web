"# ricofilm-web" 

# Base de donnée 
## Instalation de la base de donnée en docker 
<pre>docker compose -f docker-compose.db.yml up</pre>

Initialisaiton de la structure de la base de données
<pre>docker start ricofilm-mongoc
mongosh -u admin  -p password --authenticationDatabase admin
	use ricofilm
	db.createUser({
  		user: "ricohoho",
  		pwd: "xxxxx",
  		roles: [{ role: "readWrite", db: "ricofilm" }]
	})
  exit
  exit
</pre>

Initialisaiton des données de la base de données
Commenter ou decommenter les lignes de BD et de collections
<pre>
  node app/services/copie-collection.js
</pre>

# Back-end
## Lancement du backend

<pre>npm run start</pre>

ou 

<pre>npm run start:cloud</pre>

test 
<pre>http://localhost:3000/</pre>


configuratiion dans package.json
<pre>javascript
"scripts": {
    "start": "node ./bin/www",
    "start:cloud": "dotenv -e .env.cloudmongo -- node ./bin/www",
    "start:local": "dotenv -e .env.local -- node ./bin/www"
  },
  </pre>
  Exemple de env.cloudmongo : 
  <pre>
      #Conffiguration local
# verison MongoDb Cloud : "mongodb+srv" sinon "mongodb"
DB_PREFIX=mongodb+srv
DB_USER=ricohoho
DB_PASSWORD=xxxxx
DB_HOST=ricofilm.qvkgeo4.mongodb.net
DB_PORT=
DB_NAME=ricofilm
DB_POSTFIX='?retryWrites=true&w=majority&appName=ricofilm'

URL_CORS_ACCEPT=https://angularricofilm.onrender.com

IA_HOST=localhost
IA_PORT=5000
IA_URL=search_movies_sql
IA2_URL=search_movies_web
IA2b_URL=search_movies_web_sql
  </pre>
