const { syncFilms } = require('../services/sync.service');
const { syncRequests } = require('../services/sync.service');

const syncFilmsController = async (req, res) => {
    try {
        const result = await syncFilms(req.db);
        res.status(200).json({
            message: 'Synchronisation films terminée avec succès.',
            ...result
        });
    } catch (error) {
        console.error('Erreur lors de la synchronisation films :', error);
        res.status(500).json({
            message: 'Une erreur est survenue lors de la synchronisation films.',
            error: error.message
        });
    }
};

const syncRequestsController = async (req, res) => {
    try {
        const result = await syncRequests(req.db);
        res.status(200).json({
            message: 'Synchronisation requests terminée avec succès.',
            ...result
        });
    } catch (error) {
        console.error('Erreur lors de la synchronisation requests:', error);
        res.status(500).json({
            message: 'Une erreur est survenue lors de la synchronisation requests.',
            error: error.message
        });
    }
};

module.exports = {
    syncFilmsController,
    syncRequestsController
};
