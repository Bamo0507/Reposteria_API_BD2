const { ObjectId } = require("mongodb");
const { GridFSBucket } = require("mongodb");
const { getDB } = require("../../db/connection");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Helper para leer imagen de GridFs y convertirla a base64
async function getImageBase64(db, imagenId) {
  if (!imagenId) return null;

  try {
    const bucket = new GridFSBucket(db);
    const files = await db.collection("fs.files").findOne({ _id: imagenId });
    if (!files) return null;

    const chunks = [];
    const downloadStream = bucket.openDownloadStream(imagenId);

    return new Promise((resolve, reject) => {
      downloadStream.on("data", (chunk) => chunks.push(chunk));
      downloadStream.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const base64 = `data:${files.contentType || "image/png"};base64,${buffer.toString("base64")}`;
        resolve(base64);
      });
      downloadStream.on("error", () => resolve(null));
    });
  } catch {
    return null;
  }
}

// Helper para subir imagen a GridFS y retornar ObjectId (lo que guardamos en la coleccion)
async function uploadImageToGridFS(db, file) {
  const bucket = new GridFSBucket(db);

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
    });
    uploadStream.end(file.buffer);
    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", (err) => reject(err));
  });
}

// GET /admin/productos
const getProducts = async (req, res) => {
  try {
    const db = getDB();
    const productos = await db.collection("productos").find(
      {},
      { projection: { nombre: 1, imagen: 1, precio: 1, esActivo: 1 } }
    ).sort({ nombre: 1 }).toArray();

    // Agregar imagen en base64 a cada producto
    const data = await Promise.all(
      productos.map(async (p) => ({
        ...p,
        imagen: await getImageBase64(db, p.imagen),
      }))
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /admin/productos/:id
const getProductById = async (req, res) => {
  try {
    const db = getDB();
    const producto = await db.collection("productos").findOne(
      { _id: new ObjectId(req.params.id) },
      {
        projection: {
          nombre: 1,
          descripcion: 1,
          tiempo_preparacion: 1,
          ingredientes: 1,
          imagen: 1,
          precio: 1,
          esActivo: 1,
        },
      }
    );

    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    producto.imagen = await getImageBase64(db, producto.imagen);
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /admin/productos
const createProducts = async (req, res) => {
  try {
    const db = getDB();

    if (Array.isArray(req.body)) {
      const docs = req.body.map((p) => ({
        nombre: p.nombre,
        descripcion: p.descripcion,
        tiempo_preparacion: Number(p.tiempo_preparacion),
        ingredientes: p.ingredientes,
        imagen: null,
        esActivo: true,
        precio: Number(p.precio),
      }));
      const result = await db.collection("productos").insertMany(docs);
      return res.status(201).json(result);
    }

    let imagenId = null;
    if (req.file) {
      imagenId = await uploadImageToGridFS(db, req.file);
    }

    const ingredientes = typeof req.body.ingredientes === "string"
      ? JSON.parse(req.body.ingredientes)
      : req.body.ingredientes;

    const doc = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      tiempo_preparacion: Number(req.body.tiempo_preparacion),
      ingredientes,
      imagen: imagenId,
      esActivo: true,
      precio: Number(req.body.precio),
    };

    const result = await db.collection("productos").insertOne(doc);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /admin/productos/:id
const updateProduct = async (req, res) => {
  try {
    const db = getDB();
    const updateFields = {};

    if (req.body.nombre) updateFields.nombre = req.body.nombre;
    if (req.body.descripcion) updateFields.descripcion = req.body.descripcion;
    if (req.body.tiempo_preparacion) updateFields.tiempo_preparacion = Number(req.body.tiempo_preparacion);
    if (req.body.precio) updateFields.precio = Number(req.body.precio);
    if (req.body.ingredientes) {
      updateFields.ingredientes = typeof req.body.ingredientes === "string"
        ? JSON.parse(req.body.ingredientes)
        : req.body.ingredientes;
    }

    // Si viene imagen nueva, subirla y eliminar la anterior
    if (req.file) {
      const producto = await db.collection("productos").findOne({ _id: new ObjectId(req.params.id) });
      if (producto && producto.imagen) {
        const bucket = new GridFSBucket(db);
        await bucket.delete(producto.imagen);
      }
      updateFields.imagen = await uploadImageToGridFS(db, req.file);
    }

    const result = await db.collection("productos").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ message: "Producto actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /admin/productos/estado
const updateProductsStatus = async (req, res) => {
  try {
    const db = getDB();
    const { ids, esActivo } = req.body;
    const objectIds = ids.map((id) => new ObjectId(id));

    const result = await db.collection("productos").updateMany(
      { _id: { $in: objectIds } },
      { $set: { esActivo } }
    );

    res.json({ message: `${result.modifiedCount} productos actualizados` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /admin/productos/ingredientes
const getIngredients = async (req, res) => {
  try {
    const db = getDB();
    const ingredientes = await db.collection("productos").distinct("ingredientes");
    res.json(ingredientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProducts,
  updateProduct,
  updateProductsStatus,
  getIngredients,
  upload,
};