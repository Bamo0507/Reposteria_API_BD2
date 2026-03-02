const { ObjectId } = require("mongodb");
const { getDB } = require("../../db/connection");

// GET /cliente/pedidos
const getClientOrders = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, pageSize = 10, fechaInicio, fechaFin, userId } = req.query;
    const skip = (page - 1) * pageSize;

    const filtro = { id_usuario: new ObjectId(userId) };
    if (fechaInicio && fechaFin) {
      filtro.fecha_pedido = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin),
      };
    }

    const [data, total] = await Promise.all([
      db.collection("pedidos").aggregate([
        { $match: filtro },
        { $lookup: { from: "restaurantes", localField: "id_restaurante", foreignField: "_id", as: "restaurante" } },
        { $unwind: "$restaurante" },
        {
          $project: {
            fecha_pedido: 1,
            nombre_restaurante: "$restaurante.nombre_restaurante",
            total: 1,
            estado: 1,
          },
        },
        { $sort: { fecha_pedido: -1 } },
        { $skip: skip },
        { $limit: Number(pageSize) },
      ]).toArray(),
      db.collection("pedidos").countDocuments(filtro),
    ]);

    res.json({ data, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /cliente/pedidos/recientes
const getClientRecentOrders = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.query;

    const data = await db.collection("pedidos").aggregate([
      { $match: { id_usuario: new ObjectId(userId), estado: "Recibido" } },
      { $sort: { fecha_pedido: -1 } },
      { $limit: 5 },
      { $lookup: { from: "restaurantes", localField: "id_restaurante", foreignField: "_id", as: "restaurante" } },
      { $unwind: "$restaurante" },
      {
        $project: {
          nombre_restaurante: "$restaurante.nombre_restaurante",
          fecha_pedido: 1,
        },
      },
    ]).toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /cliente/pedidos/:id
const getClientOrderById = async (req, res) => {
  try {
    const db = getDB();
    const [pedido] = await db.collection("pedidos").aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      { $lookup: { from: "restaurantes", localField: "id_restaurante", foreignField: "_id", as: "restaurante" } },
      { $unwind: "$restaurante" },
      { $unwind: "$productos" },
      { $lookup: { from: "productos", localField: "productos.producto_id", foreignField: "_id", as: "producto_info" } },
      { $unwind: "$producto_info" },
      {
        $group: {
          _id: "$_id",
          fecha_pedido: { $first: "$fecha_pedido" },
          nombre_restaurante: { $first: "$restaurante.nombre_restaurante" },
          total: { $first: "$total" },
          estado: { $first: "$estado" },
          productos: {
            $push: {
              nombre: "$producto_info.nombre",
              cantidad: "$productos.cantidad",
              precio_unitario: "$productos.precio_unitario",
            },
          },
        },
      },
    ]).toArray();

    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /cliente/pedidos
const createOrder = async (req, res) => {
  try {
    const db = getDB();
    const { id_usuario, id_restaurante, productos } = req.body;

    // Calcular total
    const total = productos.reduce(
      (sum, p) => sum + p.cantidad * p.precio_unitario, 0
    );

    const doc = {
      fecha_pedido: new Date(),
      id_usuario: new ObjectId(id_usuario),
      id_restaurante: new ObjectId(id_restaurante),
      productos: productos.map((p) => ({
        producto_id: new ObjectId(p.producto_id),
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
      })),
      estado: "En cocina",
      total,
    };

    const result = await db.collection("pedidos").insertOne(doc);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /cliente/pedidos/restaurantes - nombres para dropdown
const getRestaurantNames = async (req, res) => {
  try {
    const db = getDB();
    const data = await db.collection("restaurantes").find(
      { esActivo: true },
      { projection: { nombre_restaurante: 1 } }
    ).sort({ nombre_restaurante: 1 }).toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /cliente/pedidos/productos - productos disponibles para dropdown
const getAvailableProducts = async (req, res) => {
  try {
    const db = getDB();
    const data = await db.collection("productos").find(
      { esActivo: true },
      { projection: { nombre: 1, precio: 1 } }
    ).sort({ nombre: 1 }).toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getClientOrders,
  getClientRecentOrders,
  getClientOrderById,
  createOrder,
  getRestaurantNames,
  getAvailableProducts,
};