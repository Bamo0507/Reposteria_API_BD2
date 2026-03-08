const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/clienteReseniasController");

router.get("/", controller.getClientReviews);
router.get("/:id", controller.getReviewById);
router.post("/", controller.createReview);
router.put("/:id", controller.updateReview);
router.delete("/bulk", controller.deleteReviews);
router.delete("/:id", controller.deleteReview);

module.exports = router;