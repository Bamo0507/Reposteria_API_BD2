const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/adminReseniasController");

router.get("/resenias", controller.getReviewsAdmin);
router.get("/resenias/:id", controller.getReviewById)

module.exports = router;