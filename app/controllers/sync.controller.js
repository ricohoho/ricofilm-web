const { syncFilms } = require('../services/sync.service');

const sync = async (req, res) => {
    try {
        const result = await syncFilms(req.db);
        res.status(200).json({
            message: 'Synchronisation terminée avec succès.',
            ...result
        });
    } catch (error) {
        console.error('Erreur lors de la synchronisation :', error);
        res.status(500).json({
            message: 'Une erreur est survenue lors de la synchronisation.',
            error: error.message
        });
    }
};

module.exports = {
    sync
};
