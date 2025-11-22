const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");

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
   * /api/auth/signup:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               roles:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: User registered successfully
   *       400:
   *         description: Bad request
   */
  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

  /**
   * @swagger
   * /api/auth/signin:
   *   post:
   *     summary: User login
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: User logged in successfully
   *       401:
   *         description: Unauthorized
   */
  app.post("/api/auth/signin", controller.signin);
  //app.post("/api/auth/signout", controller.signout);
  /**
   * @swagger
   * /api/auth/dcnx:
   *   get:
   *     summary: User logout
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: User logged out successfully
   */
  app.get("/api/auth/dcnx", controller.signout);
};