"# ricofilm-web" 
Lancement
npm run start:local
ou 
npm run start:cloud

configuratiion dans package?json
"scripts": {
    "start": "node ./bin/www",
    "start:cloud": "dotenv -e .env.cloudmongo -- node ./bin/www",
    "start:local": "dotenv -e .env.local -- node ./bin/www"
  },