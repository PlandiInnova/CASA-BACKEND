/**
 * Controlador de productos para CASA-LAUNCHER.
 * Query: usuario (USU_USUARIO). Obtiene productos vía licencias del usuario.
 */
exports.getProductos = (req, res) => {
    const usuario = req.query.usuario;
    if (!usuario) {
        return res.status(400).json({
            success: false,
            message: 'Parámetro usuario es requerido'
        });
    }

    const queryUser = `SELECT USU_ID FROM CAS_USUARIO WHERE USU_USUARIO = ? AND USU_STATUS = 1 LIMIT 1`;
    req.db.query(queryUser, [usuario], (errUser, userRows) => {
        if (errUser || !userRows || userRows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no válido'
            });
        }
        const userId = userRows[0].USU_ID;

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
                    PRO_ID AS PRO_ID,
                    PRO_NOMBRE AS PRO_NOMBRE,
                    PRO_NOMBRE_DETALLADO AS PRO_NOMBRE_DETALLADO,
                    PRO_DESCRIPCION AS PRO_DESCRIPCION,
                    PRO_GRA_ID AS PRO_GRA_ID,
                    PRO_EXE AS PRO_EXE,
                    PRO_IMAGEN AS PRO_IMAGEN,
                    PRO_TIPO AS PRO_TIPO,
                    PRO_FILES AS PRO_FILES,
                    PRO_VERSION AS PRO_VERSION
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
    });
};
