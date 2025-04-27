// controllers/userController.js
const { callExternalServiceMistral } = require('../services/externalService');

const getSQLMongo = async (req, res) => {
  try {
    const requetIA = req.body;
    const requestData = { requete: 'xxx' };
    const data = await callExternalServiceMistral( requestData);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { getSQLMongo };
