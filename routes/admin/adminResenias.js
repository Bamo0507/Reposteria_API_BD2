const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/adminReseniasController");

router.get("/", controller.getReviewsAdmin);
router.get("/:id", controller.getReviewById)

module.exports = router;