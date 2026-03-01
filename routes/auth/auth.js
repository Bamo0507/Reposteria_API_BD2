const express = require("express");
const router = express.Router();
const controller = require("../../controllers/auth/authController");

// Method corresponding to route (declared in controllers)
router.post("/login", controller.login);

module.exports = router;