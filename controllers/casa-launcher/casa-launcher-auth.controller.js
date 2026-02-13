/**
 * Login para CASA-LAUNCHER. Sin token ni JWT.
 * Espera en el body: { usuario, password }
 */
exports.casaLauncherLogin = (req, res) => {
    try {
        const { usuario, password } = req.body || {};

        if (!usuario || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        const query = `
            SELECT 
                USU_ID,
                USU_NOMBRE,
                USU_APELLIDOP,
                USU_APELLIDOM,
                USU_CORREO,
                USU_USUARIO,
                USU_PASSWORD,
                USU_STATUS
            FROM CAS_USUARIO
            WHERE USU_USUARIO = ? AND USU_STATUS = 1
            LIMIT 1
        `;

        req.db.query(query, [usuario], (error, results) => {
            if (error) {
                console.error('[CASA-LAUNCHER AUTH] Error en la consulta de usuario:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al validar las credenciales',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            if (!results || results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario o contraseña incorrectos'
                });
            }

            const user = results[0];

            // Comparación simple de contraseña (asumiendo texto plano).
            if (user.USU_PASSWORD !== password) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario o contraseña incorrectos'
                });
            }

            // Obtener la fecha de expiración máxima de todas las licencias activas del usuario
            const licQuery = `
                SELECT 
                    MAX(cl.LIC_FECHA_FIN) AS maxFechaFin
                FROM CAS_LICENCIAS_USUARIOS AS clu
                INNER JOIN CAS_LICENCIA AS cl ON cl.LIC_ID = clu.LUS_LIC_ID
                WHERE clu.LUS_USU_ID = ? AND cl.LIC_STATUS = 1
            `;

            req.db.query(licQuery, [user.USU_ID], (licError, licResults) => {
                if (licError) {
                    console.error('[CASA-LAUNCHER AUTH] Error obteniendo licencias de usuario:', licError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al obtener la información de licencias del usuario',
                        details: process.env.NODE_ENV === 'development' ? licError.message : undefined
                    });
                }

                const maxFechaFin = licResults && licResults[0] ? licResults[0].maxFechaFin : null;

                const payload = {
                    id: user.USU_ID,
                    usuario: user.USU_USUARIO,
                    nombre: user.USU_NOMBRE,
                    apellidoPaterno: user.USU_APELLIDOP,
                    apellidoMaterno: user.USU_APELLIDOM,
                    correo: user.USU_CORREO || null,
                    expirationDate: maxFechaFin ? maxFechaFin : null,
                    password: user.USU_PASSWORD
                };

                return res.json({
                    success: true,
                    user: payload
                });
            });
        });
    } catch (error) {
        console.error('[CASA-LAUNCHER AUTH] Error inesperado en casaLauncherLogin:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
