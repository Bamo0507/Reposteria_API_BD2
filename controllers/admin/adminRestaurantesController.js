const { ObjectId } = require("mongodb");
const { getDB } = require("../../db/connection");

// GET /admin/restaurantes
const getRestaurants = async (req, res) => {
  try {
    const db = getDB();
    const data = await db.collection("restaurantes").find(
      {},
      { projection: { nombre_restaurante: 1, ubicacion: 1, telefono: 1 } }
    ).sort({ nombre_restaurante: 1 }).toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /admin/restaurantes/:id
const getRestaurantById = async (req, res) => {
  try {
    const db = getDB();
    const restaurante = await db.collection("restaurantes").findOne(
      { _id: new ObjectId(req.params.id) }
    );

    if (!restaurante) return res.status(404).json({ error: "Restaurante no encontrado" });
    res.json(restaurante);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /admin/restaurantes
const createRestaurant = async (req, res) => {
  try {
    const db = getDB();
    const { nombre_restaurante, ubicacion, telefono, horarios_de_atencion } = req.body;

    const doc = {
      nombre_restaurante,
      ubicacion,
      telefono,
      horarios_de_atencion,
      esActivo: true,
    };

    const result = await db.collection("restaurantes").insertOne(doc);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /admin/restaurantes/:id
const updateRestaurant = async (req, res) => {
  try {
    const db = getDB();
    const updateFields = {};

    if (req.body.nombre_restaurante) updateFields.nombre_restaurante = req.body.nombre_restaurante;
    if (req.body.telefono) updateFields.telefono = req.body.telefono;

    // Ubicacion actualizar campos individuales para no sobreescribir todo el objeto
    if (req.body.ubicacion) {
      for (const [key, value] of Object.entries(req.body.ubicacion)) {
        updateFields[`ubicacion.${key}`] = value;
      }
    }

    if (req.body.horarios_de_atencion) {
      for (const [key, value] of Object.entries(req.body.horarios_de_atencion)) {
        updateFields[`horarios_de_atencion.${key}`] = value;
      }
    }

    if (req.body.esActivo !== undefined) updateFields.esActivo = req.body.esActivo;

    const result = await db.collection("restaurantes").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Restaurante no encontrado" });
    res.json({ message: "Restaurante actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getRestaurants, getRestaurantById, createRestaurant, updateRestaurant };