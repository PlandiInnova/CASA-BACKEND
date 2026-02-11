/**
 * Lista todas las ventas desde CAS_VENTA con el nombre del usuario (JOIN con CAS_USUARIO_ADMIN).
 * GET /ventas -> [{ id, nombre, tipo, fechaRegistro, usuarioNombre, uadId }, ...]
 */
exports.getVentas = (req, res) => {
    req.db.query(
        `SELECT 
            v.VEN_ID AS id,
            v.VEN_NOMBRE AS nombre,
            v.VEN_TIPO AS tipo,
            v.VEN_FECHA_REGISTRO AS fechaRegistro,
            COALESCE(u.UAD_NOMBRE, 'Sin usuario') AS usuarioNombre,
            v.VEN_UAD_ID AS uadId
        FROM CAS_VENTA v
        LEFT JOIN CAS_USUARIO_ADMIN u ON v.VEN_UAD_ID = u.UAD_ID
        ORDER BY v.VEN_ID DESC`,
        [],
        (error, rows) => {
            if (error) {
                console.error('Error al obtener ventas:', error);
                return res.status(500).json({
                    success: false,
                    status: 'ERROR',
                    message: 'Error al obtener ventas'
                });
            }
            res.status(200).json(Array.isArray(rows) ? rows : []);
        }
    );
};
