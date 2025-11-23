const { authJwt } = require("../middlewares");
const controller = require("../controllers/sync.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  /**
   * @swagger
   * /api/syncFilms:
   *   post:
   *     summary: Sync films
   *     tags: [Sync]
   *     responses:
   *       200:
   *         description: Films synced successfully
   *       401:
   *         description: Unauthorized
   */
  app.post(
    "/api/syncFilms",
    [authJwt.verifyToken],
    controller.syncFilmsController
  );

  /**
  * @swagger
  * /api/syncRequests:
  *   post:
  *     summary: Sync requests
  *     tags: [Sync]
  *     responses:
  *       200:
  *         description: Requests synced successfully
  *       401:
  *         description: Unauthorized
  */
  app.post(
    "/api/syncRequests",
    [authJwt.verifyToken],
    controller.syncRequestsController
  );
};
