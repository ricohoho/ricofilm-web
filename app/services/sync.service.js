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
    if (!remoteDb) {
        throw new Error("La connexion à la base de données distante n'est pas disponible.");
    }

    const localFilms = localDb.get('films');
    const remoteFilms = remoteDb.get('films');

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
        const existingFilm = await localFilms.findOne({ id: film.id });
        if (existingFilm) {
            await localFilms.update({ id: film.id }, { $set: film });
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
    const remoteIds = (await remoteFilms.find({}, { projection: { id: 1 } })).map(f => f.id);
    const localIds = (await localFilms.find({}, { projection: { id: 1 } })).map(f => f.id);
    const remoteIdsSet = new Set(remoteIds);
    const idsToDelete = localIds.filter(id => !remoteIdsSet.has(id));

    let deletedCount = 0;
    if (idsToDelete.length > 0) {
        console.log(`Détection de ${idsToDelete.length} film(s) à supprimer...`);
        const result = await localFilms.remove({ id: { $in: idsToDelete } });
        deletedCount = result.deletedCount || idsToDelete.length; // Fallback pour compatibilité
        console.log(`${deletedCount} film(s) supprimé(s) de la base locale.`);
    } else {
        console.log("Aucun film à supprimer.");
    }

    // --- 2b. Gestion des modifications silencieuses dans RICO_FICHIER ---
    const idsToCheck = localIds.filter(id => remoteIdsSet.has(id));
    const remoteCounts = await remoteFilms.aggregate([
        { $match: { id: { $in: idsToCheck } } },
        { $project: { id: 1, count: { $size: { "$ifNull": ["$RICO_FICHIER", []] } } } }
    ]);
    const localCounts = await localFilms.aggregate([
        { $match: { id: { $in: idsToCheck } } },
        { $project: { id: 1, count: { $size: { "$ifNull": ["$RICO_FICHIER", []] } } } }
    ]);

    const remoteCountsMap = new Map(remoteCounts.map(item => [item.id, item.count]));
    const localCountsMap = new Map(localCounts.map(item => [item.id, item.count]));
    const idsToUpdateSilently = [];

    for (const id of idsToCheck) {
        if (remoteCountsMap.get(id) !== localCountsMap.get(id)) {
            idsToUpdateSilently.push(id);
        }
    }

    let silentUpdateCount = 0;
    if (idsToUpdateSilently.length > 0) {
        console.log(`Détection de ${idsToUpdateSilently.length} film(s) avec des modifications silencieuses dans RICO_FICHIER...`);
        const filmsToUpdate = await remoteFilms.find({ id: { $in: idsToUpdateSilently } });
        for (const film of filmsToUpdate) {
            await localFilms.update({ id: film.id }, { $set: film });
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

module.exports = {
    syncFilms
};
