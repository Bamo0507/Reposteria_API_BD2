const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./db/connection");

// Declare all routes
const authRoutes = require("./routes/auth/auth");

//admin
const adminReviewsRoutes = require("./routes/admin/adminResenias")
const adminOrdersRoutes = require("./routes/admin/adminPedidos")
const adminProductsRoutes = require("./routes/admin/adminProductos")
const adminRestaurantsRoutes = require("./routes/admin/adminRestaurantes")

// Cliente
const clientOrdersRoutes = require("./routes/client/clientePedidos");
const clientReviewsRoutes = require("./routes/client/clienteResenias");

const app = express();
app.use(cors());
app.use(express.json());

// Declare routes for a module
app.use("/auth", authRoutes);
app.use("/admin/resenias", adminReviewsRoutes);
app.use("/admin/pedidos", adminOrdersRoutes);
app.use("/admin/productos", adminProductsRoutes)
app.use("/admin/restaurantes", adminRestaurantsRoutes)

// Cliente
app.use("/cliente/pedidos", clientOrdersRoutes);
app.use("/cliente/resenias", clientReviewsRoutes);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});