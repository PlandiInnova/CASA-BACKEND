const path = require('path');
const fs = require('fs');

const BASE_DIR =
  process.env.NODE_ENV === 'production'
    ? path.join(process.env.UPLOAD_BASE_PATH || '/var/www/html', 'productos')
    : path.resolve(__dirname, '../../../../var/www/html/productos');

function getDirFromProFiles(proFiles) {
  if (!proFiles || typeof proFiles !== 'string') return null;
  const slug = proFiles.replace(/^\/productos\/?/, '').trim();
  if (!slug) return null;
  return path.join(BASE_DIR, slug);
}

function rmDirRecursiveSafe(dirPath) {
  if (!dirPath) return false;
  const baseResolved = path.resolve(BASE_DIR);
  const targetResolved = path.resolve(dirPath);
  if (!targetResolved.startsWith(baseResolved)) return false;

  try {
    if (fs.rmSync) {
      fs.rmSync(targetResolved, { recursive: true, force: true });
      return true;
    }
    fs.rmdirSync(targetResolved, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

function deleteProducto(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id) || id < 1) {
    return res.status(400).json({ detalle: 'ID de producto inválido' });
  }

  req.db.query('SELECT PRO_FILES, PRO_NOMBRE FROM CAS_PRODUCTOS WHERE PRO_ID = ?', [id], (err, rows) => {
    if (err) {
      console.error('Error en deleteProducto (SELECT):', err);
      return res.status(500).json({ detalle: err.message });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ detalle: 'Producto no encontrado' });
    }

    const proFiles = rows[0].PRO_FILES || '';
    const dir = getDirFromProFiles(proFiles);

    req.db.query('DELETE FROM CAS_PRODUCTOS WHERE PRO_ID = ?', [id], (err2, result) => {
      if (err2) {
        console.error('Error en deleteProducto (DELETE):', err2);
        return res.status(500).json({ detalle: err2.message });
      }
      if (!result || result.affectedRows === 0) {
        return res.status(404).json({ detalle: 'Producto no encontrado' });
      }

      const removedFolder = dir ? rmDirRecursiveSafe(dir) : false;

      return res.status(200).json({
        ok: true,
        id,
        carpetaEliminada: removedFolder,
      });
    });
  });
}

module.exports = { deleteProducto };

