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

    console.log("Utilisation de la base de données locale  :", remoteDbUrl);
    const localFilms = localDb.get('films');
    console.log("Utilisation de la base de données distante");
    const remoteFilms = remoteDb.get('films');

    // VÉRIFICATION DE SÉCURITÉ : Empêcher la suppression de masse si la source distante est vide
    const remoteCount = await remoteFilms.count();
    console.log("Nombre de films distants :", remoteCount);
    const localCount = await localFilms.count();
    console.log("Nombre de films locaux :", localCount);

    if (remoteCount === 0 && localCount > 0) {
        console.log("Synchronisation annulée : la collection distante est vide alors que la collection locale contient des données. Cela pourrait indiquer un problème avec la source de données distante.");
        const errorMessage = "Synchronisation annulée : la collection distante est vide alors que la collection locale contient des données. Cela pourrait indiquer un problème avec la source de données distante.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    console.log("Début de la synchronisation des films...");

    // =================================================================================
    // PASSE 1 : Synchronisation rapide basée sur les dates
    // Récupère les films nouveaux ou modifiés (selon les dates)
    // =================================================================================
    console.log("--- Passe 1 : Synchronisation rapide des ajouts/modifications ---");

    const lastUpdateResult = await localFilms.aggregate([
        { $project: { latestDate: { $max: ["$UPDATE_DB_DATE", { $max: "$RICO_FICHIER.insertDate" }] } } },
        { $sort: { latestDate: -1 } },
        { $limit: 1 }
    ]);
    const lastUpdateDate = lastUpdateResult.length > 0 && lastUpdateResult[0].latestDate ? lastUpdateResult[0].latestDate : new Date(0);
    console.log(`Dernière date de mise à jour locale trouvée : ${lastUpdateDate}`);

    const filmsToSync = await remoteFilms.find({
        $or: [
            { UPDATE_DB_DATE: { $gt: lastUpdateDate } },
            { "RICO_FICHIER.insertDate": { $gt: lastUpdateDate } }
        ]
    });
    console.log(`${filmsToSync.length} film(s) à créer ou mettre à jour trouvés par la passe rapide.`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const film of filmsToSync) {
        console.log("film.id" + film.id + "/" + film.title);
        const existingFilm = await localFilms.findOne({ _id: film._id });
        if (existingFilm) {
            await localFilms.update({ _id: film._id }, { $set: film });
            updatedCount++;
        } else {
            await localFilms.insert(film);
            createdCount++;
        }
    }
    console.log(`Passe 1 terminée : ${createdCount} créé(s), ${updatedCount} mis à jour.`);

    // =================================================================================
    // PASSE 2 : Vérification complète pour les suppressions et les modifications silencieuses
    // Cette passe est plus lente mais garantit une synchronisation parfaite.
    // =================================================================================
    console.log("\n--- Passe 2 : Vérification complète des suppressions et modifications silencieuses ---");

    // --- 2a. Gestion des suppressions de documents ---
    const remoteIdDocs = (await remoteFilms.find({}, { projection: { _id: 1 } }));
    const remoteIds = remoteIdDocs.map(doc => doc._id.toString());
    console.log(`Récupération des IDs des films distants : ${remoteIds.length} film(s) trouvés.`);
    const localIdDocs = (await localFilms.find({}, { projection: { _id: 1 } }));
    const localIds = localIdDocs.map(doc => doc._id.toString());
    console.log(`Récupération des IDs des films locaux : ${localIds.length} film(s) trouvés.`);
    const remoteIdsSet = new Set(remoteIds);
    const idsToDelete = localIdDocs
        .filter(doc => !remoteIdsSet.has(doc._id.toString()))
        .map(doc => doc._id);
    console.log(`Films locaux à vérifier pour suppression : ${idsToDelete.length} film(s) détecté(s).`);

    let deletedCount = 0;
    if (idsToDelete.length > 0) {
        console.log(`Détection de ${idsToDelete.length} film(s) à supprimer...`);
        const result = await localFilms.remove({ _id: { $in: idsToDelete } });
        deletedCount = result.deletedCount || idsToDelete.length; // Fallback pour compatibilité
        console.log(`${deletedCount} film(s) supprimé(s) de la base locale.`);
    } else {
        console.log("Aucun film à supprimer.");
    }

    // --- 2b. Gestion des modifications silencieuses dans RICO_FICHIER ---
    const idsToCheck = localIds.filter(id => remoteIdsSet.has(id));
    const idsToCheckAsObjectIds = idsToCheck.map(id => monk.id(id));

    const remoteCounts = await remoteFilms.aggregate([
        { $match: { _id: { $in: idsToCheckAsObjectIds } } },
        { $project: { _id: 1, count: { $size: { "$ifNull": ["$RICO_FICHIER", []] } } } }
    ]);
    const localCounts = await localFilms.aggregate([
        { $match: { _id: { $in: idsToCheckAsObjectIds } } },
        { $project: { _id: 1, count: { $size: { "$ifNull": ["$RICO_FICHIER", []] } } } }
    ]);

    const remoteCountsMap = new Map(remoteCounts.map(item => [item._id.toString(), item.count]));
    const localCountsMap = new Map(localCounts.map(item => [item._id.toString(), item.count]));
    const idsToUpdateSilently = [];

    for (const _id of idsToCheck) {
        if (remoteCountsMap.get(_id) !== localCountsMap.get(_id)) {
            idsToUpdateSilently.push(_id);
        }
    }

    let silentUpdateCount = 0;
    if (idsToUpdateSilently.length > 0) {
        console.log(`Détection de ${idsToUpdateSilently.length} film(s) avec des modifications silencieuses dans RICO_FICHIER...`);
        const idsToUpdateAsObjectIds = idsToUpdateSilently.map(id => monk.id(id));
        const filmsToUpdate = await remoteFilms.find({ _id: { $in: idsToUpdateAsObjectIds } });
        for (const film of filmsToUpdate) {
            await localFilms.update({ _id: film._id }, { $set: film });
            silentUpdateCount++;
        }
        console.log(`${silentUpdateCount} film(s) mis à jour silencieusement.`);
    } else {
        console.log("Aucune modification silencieuse détectée.");
    }

    console.log("\n--- Résumé de la synchronisation ---");
    console.log(`Créations (Passe 1) : ${createdCount}`);
    console.log(`Mises à jour (Passe 1) : ${updatedCount}`);
    console.log(`Suppressions (Passe 2) : ${deletedCount}`);
    console.log(`Mises à jour silencieuses (Passe 2) : ${silentUpdateCount}`);

    return {
        created: createdCount,
        updated: updatedCount,
        deleted: deletedCount,
        silent_updated: silentUpdateCount
    };
};

const syncRequests = async (localDb) => {
    console.log("Démarrage de la synchronisation des requests...");
    if (!remoteDb) {
        throw new Error("La connexion à la base de données distante n'est pas disponible.");
    }

    const localRequests = localDb.get('request');
    const remoteRequests = remoteDb.get('request');

    console.log("Récupération des données locales et distantes...");
    const localDocs = await localRequests.find({});
    const remoteIdDocs = await remoteRequests.find({}, { projection: { _id: 1 } });
    const remoteIdsSet = new Set(remoteIdDocs.map(doc => doc._id.toString()));

    console.log(`${localDocs.length} request(s) locale(s) trouvée(s).`);
    console.log(`${remoteIdsSet.size} request(s) distante(s) trouvée(s).`);

    let syncedCount = 0;
    for (const doc of localDocs) {
        if (!remoteIdsSet.has(doc._id.toString())) {
            try {
                await remoteRequests.insert(doc);
                syncedCount++;
            } catch (e) {
                console.error(`Erreur lors de l'insertion de la request ${doc._id} :`, e);
            }
        }
    }

    console.log(`Synchronisation des requests terminée : ${syncedCount} document(s) ajouté(s) à la base distante.`);
    return { synced: syncedCount };
};

module.exports = {
    syncFilms,
    syncRequests
};
