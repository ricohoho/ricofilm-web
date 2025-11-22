const { authJwt } = require("../middlewares");
const controller = require("../controllers/mail.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });


  //liste des utilsiateutrs
  /**
   * @swagger
   * /api/mail/test:
   *   get:
   *     summary: Test email functionality
   *     tags: [Mail]
   *     responses:
   *       200:
   *         description: Email sent successfully
   */
  app.get("/api/mail/test",
    //acces moderateur obligatoire
    //[authJwt.verifyToken, authJwt.isModerator],
    controller.testMail
  );

  /**
   * @swagger
   * /api/mail/send:
   *   post:
   *     summary: Send an email
   *     tags: [Mail]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               to:
   *                 type: string
   *                 description: Recipient email address
   *               subject:
   *                 type: string
   *                 description: Email subject
   *               text:
   *                 type: string
   *                 description: Plain text content
   *               html:
   *                 type: string
   *                 description: HTML content (optional)
   *     responses:
   *       200:
   *         description: Email sent successfully
   *       400:
   *         description: Bad request
   */
  app.post("/api/mail/send", controller.sendMail);
};
