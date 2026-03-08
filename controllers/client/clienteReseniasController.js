const { ObjectId } = require("mongodb");
const { getDB } = require("../../db/connection");

// GET /cliente/resenias
const getClientReviews = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, pageSize = 10, userId, q } = req.query;
    const skip = (page - 1) * pageSize;

    const filtroBase = { id_usuario: new ObjectId(userId) };

    // Si hay búsqueda de texto
    if (q) {
      const filtro = { ...filtroBase, $text: { $search: q } };
      const [data, total] = await Promise.all([
        db.collection("resenias").aggregate([
          { $match: filtro },
          { $lookup: { from: "restaurantes", localField: "id_restaurante", foreignField: "_id", as: "restaurante" } },
          { $unwind: "$restaurante" },
          { $lookup: { from: "pedidos", localField: "id_pedido", foreignField: "_id", as: "pedido" } },
          { $unwind: "$pedido" },
          {
            $project: {
              nombre_restaurante: "$restaurante.nombre_restaurante",
              titulo: 1,
              descripcion: 1,
              fecha_pedido: "$pedido.fecha_pedido",
              puntuacion: 1,
              fecha: 1,
              score: { $meta: "textScore" },
            },
          },
          { $sort: { score: { $meta: "textScore" } } },
          { $skip: skip },
          { $limit: Number(pageSize) },
        ]).toArray(),
        db.collection("resenias").countDocuments(filtro),
      ]);
      return res.json({ data, total });
    }

    const [data, total] = await Promise.all([
      db.collection("resenias").aggregate([
        { $match: filtroBase },
        { $lookup: { from: "restaurantes", localField: "id_restaurante", foreignField: "_id", as: "restaurante" } },
        { $unwind: "$restaurante" },
        { $lookup: { from: "pedidos", localField: "id_pedido", foreignField: "_id", as: "pedido" } },
        { $unwind: "$pedido" },
        {
          $project: {
            nombre_restaurante: "$restaurante.nombre_restaurante",
            titulo: 1,
            descripcion: 1,
            fecha_pedido: "$pedido.fecha_pedido",
            puntuacion: 1,
            fecha: 1,
          },
        },
        { $sort: { fecha: -1 } },
        { $skip: skip },
        { $limit: Number(pageSize) },
      ]).toArray(),
      db.collection("resenias").countDocuments(filtroBase),
    ]);

    res.json({ data, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /cliente/resenias
const createReview = async (req, res) => {
  try {
    const db = getDB();
    const { titulo, id_usuario, id_restaurante, id_pedido, descripcion, puntuacion } = req.body;

    const doc = {
      titulo,
      id_usuario: new ObjectId(id_usuario),
      id_restaurante: new ObjectId(id_restaurante),
      id_pedido: new ObjectId(id_pedido),
      descripcion,
      puntuacion: Number(puntuacion),
      fecha: new Date(),
    };

    const result = await db.collection("resenias").insertOne(doc);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /cliente/resenias/:id
const updateReview = async (req, res) => {
  try {
    const db = getDB();
    const updateFields = {};

    if (req.body.titulo) updateFields.titulo = req.body.titulo;
    if (req.body.descripcion) updateFields.descripcion = req.body.descripcion;
    if (req.body.puntuacion !== undefined) updateFields.puntuacion = Number(req.body.puntuacion);

    const result = await db.collection("resenias").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Reseña no encontrada" });
    res.json({ message: "Reseña actualizada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /cliente/resenias/:id
const deleteReview = async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("resenias").deleteOne(
      { _id: new ObjectId(req.params.id) }
    );

    if (result.deletedCount === 0) return res.status(404).json({ error: "Reseña no encontrada" });
    res.json({ message: "Reseña eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /cliente/resenias - eliminar varias
const deleteReviews = async (req, res) => {
  try {
    const db = getDB();
    const { ids } = req.body;
    const objectIds = ids.map((id) => new ObjectId(id));

    const result = await db.collection("resenias").deleteMany(
      { _id: { $in: objectIds } }
    );

    res.json({ message: `${result.deletedCount} reseñas eliminadas` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReviewById = async (req, res) => {
  try {
    const db = getDB();
    const [resenia] = await db.collection("resenias").aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      { $lookup: { from: "usuarios", localField: "id_usuario", foreignField: "_id", as: "usuario" } },
      { $unwind: "$usuario" },
      { $lookup: { from: "restaurantes", localField: "id_restaurante", foreignField: "_id", as: "restaurante" } },
      { $unwind: "$restaurante" },
      { $lookup: { from: "pedidos", localField: "id_pedido", foreignField: "_id", as: "pedido" } },
      { $unwind: "$pedido" },
      { $unwind: "$pedido.productos" },
      { $lookup: { from: "productos", localField: "pedido.productos.producto_id", foreignField: "_id", as: "producto_info" } },
      { $unwind: "$producto_info" },
      {
        $group: {
          _id: "$_id",
          titulo: { $first: "$titulo" },
          descripcion: { $first: "$descripcion" },
          puntuacion: { $first: "$puntuacion" },
          fecha: { $first: "$fecha" },
          fecha_pedido: { $first: "$pedido.fecha_pedido" },
          nombre_usuario: { $first: "$usuario.nombre_usuario" },
          nombre_restaurante: { $first: "$restaurante.nombre_restaurante" },
          total: { $first: "$pedido.total" },
          productos: {
            $push: {
              nombre: "$producto_info.nombre",
              cantidad: "$pedido.productos.cantidad",
              precio_unitario: "$pedido.productos.precio_unitario",
            },
          },
        },
      },
    ]).toArray();

    if (!resenia) return res.status(404).json({ error: "Reseña no encontrada" });
    res.json(resenia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getClientReviews,
  createReview,
  updateReview,
  deleteReview,
  deleteReviews,
  getReviewById,
};