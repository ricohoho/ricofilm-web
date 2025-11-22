const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  /**
   * @swagger
   * /api/test/all:
   *   get:
   *     summary: Public content
   *     tags: [Test]
   *     responses:
   *       200:
   *         description: Public content
   */
  app.get("/api/test/all", controller.allAccess);

  /**
   * @swagger
   * /api/test/user:
   *   get:
   *     summary: User content
   *     tags: [Test]
   *     responses:
   *       200:
   *         description: User content
   *       401:
   *         description: Unauthorized
   */
  app.get("/api/test/user", [authJwt.verifyToken], controller.userBoard);

  /**
   * @swagger
   * /api/test/mod:
   *   get:
   *     summary: Moderator content
   *     tags: [Test]
   *     responses:
   *       200:
   *         description: Moderator content
   *       403:
   *         description: Forbidden
   */
  app.get("/api/test/mod",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );

  /**
   * @swagger
   * /api/test/admin:
   *   get:
   *     summary: Admin content
   *     tags: [Test]
   *     responses:
   *       200:
   *         description: Admin content
   *       403:
   *         description: Forbidden
   */
  app.get("/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  /**
   * @swagger
   * /api/user/list:
   *   get:
   *     summary: Get a list of users
   *     tags: [User]
   *     responses:
   *       200:
   *         description: List of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *       403:
   *         description: Forbidden
   */
  app.get("/api/user/list",
    //acces moderateur ou admin :  obligatoire
    [authJwt.verifyToken, authJwt.isAdminOrModerator],
    controller.userList
  );

  //update USER
  /**
   * @swagger
   * /api/user/{id}:
   *   put:
   *     summary: Update a user
   *     tags: [User]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: User updated successfully
   */
  app.put("/api/user/:id",
    controller.update
  );

  /**
 * @swagger
 * /api/roles/list:
 *   get:
 *     summary: Get a list of roles
 *     tags: [User]
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
  app.get("/api/roles/list",
    controller.rolesList
  );

};


