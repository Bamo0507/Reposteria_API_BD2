const { getDB } = require("../../db/connection")
const { ObjectId } = require("mongodb");

// GET /admin/pedidos
const getOrders = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, pageSize = 10, fechaInicio, fechaFin } = req.query;
    const skip = (page - 1) * pageSize;

    const filtro = {};
    if (fechaInicio && fechaFin) {
      filtro.fecha_pedido = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin),
      };
    }

    const [data, total] = await Promise.all([
      db.collection("pedidos").aggregate([
        { $match: filtro },
        { $lookup: { from: "usuarios", localField: "id_usuario", foreignField: "_id", as: "usuario" } },
        { $unwind: "$usuario" },
        { $lookup: { from: "restaurantes", localField: "id_restaurante", foreignField: "_id", as: "restaurante" } },
        { $unwind: "$restaurante" },
        {
          $project: {
            fecha_pedido: 1,
            nombre_usuario: "$usuario.nombre_usuario",
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

// GET /admin/pedidos/:id
const getOrderById = async (req, res) => {
  try {
    const db = getDB();
    const [pedido] = await db.collection("pedidos").aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      { $lookup: { from: "usuarios", localField: "id_usuario", foreignField: "_id", as: "usuario" } },
      { $unwind: "$usuario" },
      { $lookup: { from: "restaurantes", localField: "id_restaurante", foreignField: "_id", as: "restaurante" } },
      { $unwind: "$restaurante" },
      { $unwind: "$productos" },
      { $lookup: { from: "productos", localField: "productos.producto_id", foreignField: "_id", as: "producto_info" } },
      { $unwind: "$producto_info" },
      {
        $group: {
          _id: "$_id",
          fecha_pedido: { $first: "$fecha_pedido" },
          nombre_usuario: { $first: "$usuario.nombre_usuario" },
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

// PUT /admin/pedidos/:id/estado
const updateOrderStatus = async (req, res) => {
  try {
    const db = getDB();
    const { estado } = req.body;
    const result = await db.collection("pedidos").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { estado } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json({ message: "Estado actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getOrders, getOrderById, updateOrderStatus };