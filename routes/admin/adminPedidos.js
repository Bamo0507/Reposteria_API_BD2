const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/adminPedidosController");

router.get("/", controller.getOrders);
router.get("/:id", controller.getOrderById);
router.put("/:id/estado", controller.updateOrderStatus);

module.exports = router;