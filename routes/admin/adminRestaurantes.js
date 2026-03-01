const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/adminRestaurantesController");

router.get("/", controller.getRestaurants);
router.get("/:id", controller.getRestaurantById);
router.post("/", controller.createRestaurant);
router.put("/:id", controller.updateRestaurant);

module.exports = router;