
function updateStatus(req, res) {
    const id = parseInt(req.query.id, 10);
    const status = parseInt(req.query.status, 10);
  
    if (Number.isNaN(id) || id < 1) {
      return res.status(400).json({ detalle: 'ID inválido' });
    }
    if (Number.isNaN(status) || (status !== 0 && status !== 1)) {
      return res.status(400).json({ detalle: 'Status inválido (0/1)' });
    }
  
    req.db.query(
      'UPDATE CAS_MULTIMEDIA SET MUL_STATUS = ? WHERE MUL_ID = ?',
      [status, id],
      (err, result) => {
        if (err) {
          console.error('Error en updateStatus:', err);
          return res.status(500).json({ detalle: err.message });
        }
        if (!result || result.affectedRows === 0) {
          return res.status(404).json({ detalle: 'Multimedia no encontrado' });
        }
        return res.status(200).json({ ok: true, id, status });
      }
    );
  }
  
  module.exports = { updateStatus };