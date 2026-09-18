/**
 * Lista todos los tipos/registros de venta desde CAS_VENTA.
 * GET /tipos-venta -> [{ id, nombre, tipo }, ...]
 */
exports.getTiposVenta = (req, res) => {
    req.db.query(
        // DESC: alimenta el select del modal de licencias y lo más reciente es
        // lo que se busca casi siempre, así que va arriba.
        'SELECT VEN_ID AS id, VEN_NOMBRE AS nombre, VEN_TIPO AS tipo FROM CAS_VENTA ORDER BY VEN_ID DESC',
        [],
        (error, rows) => {
            if (error) {
                console.error('Error al obtener tipos de venta:', error);
                return res.status(500).json({
                    success: false,
                    status: 'ERROR',
                    message: 'Error al obtener tipos de venta'
                });
            }
            res.status(200).json(Array.isArray(rows) ? rows : []);
        }
    );
};
