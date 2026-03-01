const bcrypt = require("bcrypt");
const { getDB } = require("../db/connection");

const login = async (req, res) => {
  try {
    const db = getDB();
    const { nombre_usuario, contrasenia } = req.body;

    const usuario = await db.collection("usuarios").findOne(
      { nombre_usuario },
      { projection: { nombre_usuario: 1, contrasenia: 1, tipo_usuario: 1 } }
    );

    if (!usuario) return res.status(401).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(contrasenia, usuario.contrasenia);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    res.json({
      _id: usuario._id,
      nombre_usuario: usuario.nombre_usuario,
      tipo_usuario: usuario.tipo_usuario,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { login };