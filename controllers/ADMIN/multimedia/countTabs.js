/**
 * Conteo de pestañas para admin: multimedia (tipos 1-5) y productos.
 * GET /casa/admin/countabs y evento socket tab-counts-updated.
 */

const TIPO_LABELS = {
  1: 'Videos',
  2: 'Audios',
  3: 'Word',
  4: 'Excel',
  5: 'PDF',
};

const TIPOS_ORDER = [1, 2, 3, 4, 5];

/**
 * Obtiene el array de conteos: [{ TIPO, Total }, ...] para Videos, Audios, Word, Excel, PDF, Productos.
 * @param {object} db - Conexión mysql (req.db)
 * @param {function} callback - (err, counts)
 */
function getTabCounts(db, callback) {
  const countsMap = {
    Videos: 0,
    Audios: 0,
    Word: 0,
    Excel: 0,
    PDF: 0,
    Productos: 0,
  };

  const sqlMultimedia =
    'SELECT MUL_TIPO AS tipo, COUNT(*) AS Total FROM CAS_MULTIMEDIA WHERE MUL_TIPO IN (1, 2, 3, 4, 5) GROUP BY MUL_TIPO';
  const sqlProductos = 'SELECT COUNT(*) AS Total FROM CAS_PRODUCTOS';

  db.query(sqlMultimedia, (err, rows) => {
    if (err) return callback(err, null);
    (rows || []).forEach((row) => {
      const label = TIPO_LABELS[row.tipo];
      if (label != null) countsMap[label] = Number(row.Total) || 0;
    });

    db.query(sqlProductos, (err2, rowsProd) => {
      if (err2) return callback(err2, null);
      countsMap.Productos = (rowsProd && rowsProd[0]) ? (Number(rowsProd[0].Total) || 0) : 0;

      const counts = [
        ...TIPOS_ORDER.map((t) => ({ TIPO: TIPO_LABELS[t], Total: countsMap[TIPO_LABELS[t]] })),
        { TIPO: 'Productos', Total: countsMap.Productos },
      ];
      callback(null, counts);
    });
  });
}

/**
 * Emite el evento tab-counts-updated a global-room. Usar después de upload/delete multimedia o cambios en productos.
 * @param {object} req - req.db y req.io deben existir
 */
function emitTabCountsUpdated(req) {
  if (!req || !req.db || !req.io) return;
  getTabCounts(req.db, (err, counts) => {
    if (err) {
      console.error('Error al obtener conteos para tab-counts-updated:', err);
      return;
    }
    req.io.to('global-room').emit('tab-counts-updated', { counts });
  });
}

/**
 * GET /casa/admin/countabs
 */
function getCountabs(req, res) {
  getTabCounts(req.db, (err, counts) => {
    if (err) {
      console.error('Error en getCountabs:', err);
      return res.status(500).json({ error: 'Error en la base de datos', detalle: err.message });
    }
    res.json(counts);
  });
}

module.exports = {
  getTabCounts,
  emitTabCountsUpdated,
  getCountabs,
};
