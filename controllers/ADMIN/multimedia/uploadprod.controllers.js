const path = require('path');
const fs = require('fs');
const multer = require('multer');

const BASE_DIR = process.env.NODE_ENV === 'production' 
    ? (process.env.UPLOAD_BASE_PATH || '/var/www/html')
    : path.resolve(__dirname, '../../../../var/www/html/productos');

function slugify(str) {
  if (!str || typeof str !== 'string') return 'producto';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'producto';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.productoSlug) {
      const dir = path.join(BASE_DIR, req.productoSlug);
      return cb(null, dir);
    }
    const nombre = slugify(req.body.pro_titulo);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    let dir = path.join(BASE_DIR, nombre);
    if (fs.existsSync(dir)) {
      dir = path.join(BASE_DIR, `${nombre}-${id}`);
      req.productoId = id;
      req.productoSlug = `${nombre}-${id}`;
    } else {
      req.productoId = id;
      req.productoSlug = nombre;
    }
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const raw = (file.originalname || 'archivo').trim();
    const name = path.basename(raw) || 'archivo';
    cb(null, name);
  },
});

const upload = multer({ storage });

const uploadMiddleware = upload.array('archivo');

function uploadProd(req, res) {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        detalle: err.message || 'Error al subir el archivo',
        message: err.message,
      });
    }
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({ detalle: 'No se recibió ningún archivo' });
    }

    const slug = req.productoSlug;
    const carpeta = `/productos/${slug}`;

    const primeraImagen = files.find((f) => (f.mimetype || '').startsWith('image/'));
    const proImagen = primeraImagen ? `${carpeta}/${primeraImagen.filename}` : null;

    const proNombre = req.body.pro_titulo || null;
    const proGrado = req.body.pro_grado || null;
    const proExe = req.body.pro_exe || null;
    const proTipo = req.body.pro_tipo || null;
    const proVersion = 1;

    const sql = `INSERT INTO CAS_PRODUCTOS (PRO_NOMBRE, PRO_GRA_ID, PRO_EXE, PRO_IMAGEN, PRO_TIPO, PRO_FILES, PRO_VERSION)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [proNombre, proGrado, proExe, proImagen, proTipo, carpeta, proVersion];

    req.db.query(sql, values, (error, result) => {
      if (error) {
        console.error('Error al insertar producto:', error);
        return res.status(500).json({
          detalle: 'Error al guardar el producto en la base de datos',
          message: error.message,
        });
      }

      const nombres = files.map((f) => f.filename);

      res.status(200).json({
        carpeta,
        id: req.productoId,
        slug,
        archivos: nombres,
        pro_imagen: proImagen,
        pro_titulo: proNombre,
        pro_grado: proGrado,
        pro_exe: proExe,
        pro_tipo: proTipo,
        pro_id: result.insertId,
      });
    });
  });
}

module.exports = { uploadProd };