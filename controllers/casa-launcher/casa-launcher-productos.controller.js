/**
 * Controlador de productos para CASA-LAUNCHER.
 * Obtiene los productos a los que el usuario tiene acceso vía:
 * CAS_USUARIO → CAS_LICENCIAS_USUARIOS → CAS_LICENCIA → CAS_PAQUETE (PAQ_PRODUCTOS) → CAS_PRODUCTOS
 * Usa DISTINCT para no duplicar productos cuando el usuario tiene varias licencias.
 */
exports.getProductos = (req, res) => {
    console.log('Obteniendo productos para usuario:', req.casaLauncherUser?.id);
    try {
        const userId = req.casaLauncherUser?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const queryPaquetes = `
            SELECT p.PAQ_PRODUCTOS
            FROM CAS_LICENCIAS_USUARIOS lu
            INNER JOIN CAS_LICENCIA l ON l.LIC_ID = lu.LUS_LIC_ID AND l.LIC_STATUS = 1
            INNER JOIN CAS_PAQUETE p ON p.PAQ_ID = l.LIC_PAQ_ID
            WHERE lu.LUS_USU_ID = ?
        `;

        req.db.query(queryPaquetes, [userId], (error, rows) => {
            if (error) {
                console.error('[CASA-LAUNCHER PRODUCTOS] Error al obtener paquetes del usuario:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener productos',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            const productIds = new Set();
            for (const row of rows || []) {
                const raw = row.PAQ_PRODUCTOS;
                if (!raw) continue;
                try {
                    const ids = JSON.parse(raw);
                    if (Array.isArray(ids)) {
                        ids.forEach(id => productIds.add(Number(id)));
                    }
                } catch (e) {
                    console.warn('[CASA-LAUNCHER PRODUCTOS] PAQ_PRODUCTOS no es JSON válido:', raw);
                }
            }

            const idsArray = [...productIds];
            if (idsArray.length === 0) {
                return res.json({
                    success: true,
                    productos: []
                });
            }

            const placeholders = idsArray.map(() => '?').join(',');
            const queryProductos = `
                SELECT 
                    PRO_ID AS id,
                    PRO_NOMBRE AS nombre,
                    PRO_GRA_ID AS graId,
                    PRO_EXE AS exe,
                    PRO_IMAGEN AS imagen,
                    PRO_TIPO AS tipo,
                    PRO_FILES AS files,
                    PRO_VERSION AS version
                FROM CAS_PRODUCTOS
                WHERE PRO_ID IN (${placeholders})
                ORDER BY PRO_NOMBRE
            `;

            req.db.query(queryProductos, idsArray, (err, products) => {
                if (err) {
                    console.error('[CASA-LAUNCHER PRODUCTOS] Error al obtener CAS_PRODUCTOS:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al obtener productos',
                        details: process.env.NODE_ENV === 'development' ? err.message : undefined
                    });
                }

                return res.json({
                    success: true,
                    productos: products || []
                });
            });
        });
    } catch (error) {
        console.error('[CASA-LAUNCHER PRODUCTOS] Error inesperado en getProductos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
