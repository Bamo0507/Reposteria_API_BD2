const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/adminProductosController");

router.get("/", controller.getProducts);
router.get("/ingredientes", controller.getIngredients);
router.get("/:id", controller.getProductById);
router.post("/", controller.upload.single("imagen"), controller.createProducts);
router.put("/estado", controller.updateProductsStatus);
router.put("/:id", controller.upload.single("imagen"), controller.updateProduct);

module.exports = router;