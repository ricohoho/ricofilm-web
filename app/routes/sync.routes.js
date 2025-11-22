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
   * /api/sync:
   *   post:
   *     summary: Sync data
   *     tags: [Sync]
   *     responses:
   *       200:
   *         description: Data synced successfully
   *       401:
   *         description: Unauthorized
   */
  app.post(
    "/api/sync",
    [authJwt.verifyToken],
    controller.sync
  );
};
