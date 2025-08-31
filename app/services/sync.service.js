const monk = require('monk');

// Configuration de la base de données distante à partir des variables d'environnement
const remoteDbPrefix = process.env.REMOTE_DB_PREFIX || 'mongodb';
const remoteDbPostfix = process.env.REMOTE_DB_POSTFIX || '';
const remoteDbUser = process.env.REMOTE_DB_USER;
const remoteDbPassword = process.env.REMOTE_DB_PASSWORD;
const remoteAuthPart = remoteDbUser && remoteDbPassword ? `${remoteDbUser}:${remoteDbPassword}@` : '';
const remoteDbHost = process.env.REMOTE_DB_HOST;
const remoteDbPort = process.env.REMOTE_DB_PORT ? `:${process.env.REMOTE_DB_PORT}` : '';
const remoteDbName = process.env.REMOTE_DB_NAME;

const remoteDbUrl = `${remoteDbPrefix}://${remoteAuthPart}${remoteDbHost}${remoteDbPort}/${remoteDbName}${remoteDbPostfix}`;

let remoteDb;
try {
    if (!remoteDbHost || !remoteDbName) {
        throw new Error("Les variables d'environnement de la base de données distante ne sont pas définies.");
    }
    console.log("Tentative de connexion à la base de données distante :", remoteDbUrl);
    remoteDb = monk(remoteDbUrl);
    console.log("Connexion à la base de données distante établie avec succès.");
} catch (error) {
    console.error("Erreur lors de la connexion à la base de données distante :", error);
    remoteDb = null;
}


const syncFilms = async (localDb) => {
    console.log("Démarrage de la synchronisation des films...");
    if (!remoteDb) {
        throw new Error("La connexion à la base de données distante n'est pas disponible.");
    }

    console.log("Utilisation de la base de données distante :", remoteDbUrl);
    const localFilms = localDb.get('films');
    console.log("Utilisation de la base de données locale.");
    const remoteFilms = remoteDb.get('films');

    // 1. Trouver la date de mise à jour la plus récente dans la base de données locale,
    // en considérant UPDATE_DB_DATE et RICO_FICHIER.insertDate
    console.log("Recherche de la dernière date de mise à jour locale...");
    const lastUpdateResult = await localFilms.aggregate([
        {
            $project: {
                latestDate: {
                    $max: [
                        "$UPDATE_DB_DATE",
                        { $max: "$RICO_FICHIER.insertDate" }
                    ]
                }
            }
        },
        { $sort: { latestDate: -1 } },
        { $limit: 1 }
    ]);

    const lastUpdateDate = lastUpdateResult.length > 0 ? lastUpdateResult[0].latestDate : new Date(0);
    console.log(`Dernière date de mise à jour locale (max de UPDATE_DB_DATE et RICO_FICHIER.insertDate) : ${lastUpdateDate}`);


    // 2. Récupérer les films de la base de données distante mis à jour après cette date
    console.log("Récupération des films mis à jour depuis la base de données distante...");
    const filmsToSync = await remoteFilms.find({
        $or: [
            { UPDATE_DB_DATE: { $gt: lastUpdateDate } },
            { "RICO_FICHIER.insertDate": { $gt: lastUpdateDate } }
        ]
    });
    console.log(`${filmsToSync.length} film(s) à synchroniser.`);

    let createdCount = 0;
    let updatedCount = 0;

    // 3. Mettre à jour ou insérer les films dans la base de données locale
    console.log("Mise à jour ou insertion des films dans la base de données locale...");
    for (const film of filmsToSync) {
        const existingFilm = await localFilms.findOne({ id: film.id });
        if (existingFilm) {
            await localFilms.update({ id: film.id }, { $set: film });
            updatedCount++;
        } else {
            await localFilms.insert(film);
            createdCount++;
        }
    }

    console.log(`Synchronisation terminée : ${createdCount} film(s) créé(s), ${updatedCount} film(s) mis à jour.`);

    return {
        created: createdCount,
        updated: updatedCount,
        total: filmsToSync.length
    };
};

module.exports = {
    syncFilms
};
