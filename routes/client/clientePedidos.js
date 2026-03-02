const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/clientePedidosController");

router.get("/", controller.getClientOrders);
router.get("/recientes", controller.getClientRecentOrders);
router.get("/restaurantes", controller.getRestaurantNames);
router.get("/productos", controller.getAvailableProducts);
router.get("/:id", controller.getClientOrderById);
router.post("/", controller.createOrder);

module.exports = router;