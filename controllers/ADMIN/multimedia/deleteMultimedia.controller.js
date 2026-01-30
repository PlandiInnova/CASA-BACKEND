const path = require('path');
const fs = require('fs');

const BASE_DIR =
  process.env.NODE_ENV === 'production'
    ? (process.env.UPLOAD_BASE_PATH || '/var/www/html')
    : path.resolve(__dirname, '../../../../var/www/html');

function normalizeRelativeMultimediaPath(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith('http://') || v.startsWith('https://')) return null;

  const idx = v.indexOf('/multimedia/');
  if (idx >= 0) return v.slice(idx);
  if (v.startsWith('multimedia/')) return '/' + v;
  if (v.startsWith('/multimedia/')) return v;
  return null;
}

function safeUnlinkFromBaseDir(relativePath) {
  const rel = normalizeRelativeMultimediaPath(relativePath);
  if (!rel) return false;

  const baseResolved = path.resolve(BASE_DIR);
  const abs = path.resolve(path.join(BASE_DIR, rel.replace(/^\//, '')));

  if (!abs.startsWith(baseResolved)) return false;

  try {
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
      return true;
    }
  } catch {
  }
  return false;
}

function deleteMultimedia(req, res) {
  const id = parseInt(req.query.id, 10);
  if (Number.isNaN(id) || id < 1) {
    return res.status(400).json({ detalle: 'ID inválido' });
  }

  req.db.query('SELECT * FROM CAS_MULTIMEDIA WHERE MUL_ID = ?', [id], (err, rows) => {
    if (err) {
      console.error('Error en deleteMultimedia (SELECT):', err);
      return res.status(500).json({ detalle: err.message });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ detalle: 'Multimedia no encontrado' });
    }

    const row = rows[0] || {};

    safeUnlinkFromBaseDir(row.MUL_RUTA);
    safeUnlinkFromBaseDir(row.MUL_ENLACE);
    safeUnlinkFromBaseDir(row.MUL_IMAGEN);
    safeUnlinkFromBaseDir(row.MUL_IMAGE);

    req.db.query('DELETE FROM CAS_MULTIMEDIA WHERE MUL_ID = ?', [id], (err2, result) => {
      if (err2) {
        console.error('Error en deleteMultimedia (DELETE):', err2);
        return res.status(500).json({ detalle: err2.message });
      }
      if (!result || result.affectedRows === 0) {
        return res.status(404).json({ detalle: 'Multimedia no encontrado' });
      }
      return res.status(200).json({ ok: true, id });
    });
  });
}

module.exports = { deleteMultimedia };

