const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./db/connection");

// Declare all routes
const authRoutes = require("./routes/auth/auth");
const adminReviewsRoutes = require("./routes/admin/adminResenias")

const app = express();
app.use(cors());
app.use(express.json());

// Declare routes for a module
app.use("/auth", authRoutes);
app.use("/admin", adminReviewsRoutes)

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});