const { authJwt } = require("../middlewares");
const controller = require("../controllers/sync.controller");
var express = require('express');
var router = express.Router();

router.post(
    "/",
    [authJwt.verifyToken],
    controller.sync
);

module.exports = router;
