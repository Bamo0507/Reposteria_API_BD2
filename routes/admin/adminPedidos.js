const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/adminPedidosController");

router.get("/pedidos", controller.getOrders);
router.get("/pedidos/:id", controller.getOrderById);
router.put("/pedidos/:id/estado", controller.updateOrderStatus);

module.exports = router;