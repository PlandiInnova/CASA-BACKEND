const jwt = require('jsonwebtoken');

/**
 * Login para CASA-LAUNCHER.
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

        const secret = process.env.CASA_LAUNCHER_JWT_SECRET || process.env.CALA_JWT_SECRET;

        if (!secret) {
            console.error('[CASA-LAUNCHER AUTH] Falta la variable de entorno CASA_LAUNCHER_JWT_SECRET');
            return res.status(500).json({
                success: false,
                message: 'Configuración de autenticación no disponible'
            });
        }

        const query = `
            SELECT 
                USU_ID,
                USU_NOMBRE,
                USU_APELLIDOP,
                USU_APELLIDOM,
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

            const payload = {
                id: user.USU_ID,
                usuario: user.USU_USUARIO,
                nombre: user.USU_NOMBRE,
                apellidoPaterno: user.USU_APELLIDOP,
                apellidoMaterno: user.USU_APELLIDOM
            };

            const token = jwt.sign(payload, secret, {
                expiresIn: process.env.CASA_LAUNCHER_JWT_EXPIRES_IN || process.env.CALA_JWT_EXPIRES_IN || '8h'
            });

            return res.json({
                success: true,
                token,
                user: payload
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

/**
 * Devuelve la información del usuario autenticado a partir del JWT.
 * Requiere que el middleware de autenticación haya poblado req.casaLauncherUser.
 */
exports.casaLauncherMe = (req, res) => {
    try {
        if (!req.casaLauncherUser) {
            return res.status(401).json({
                success: false,
                message: 'No hay usuario autenticado'
            });
        }

        return res.json({
            success: true,
            user: req.casaLauncherUser
        });
    } catch (error) {
        console.error('[CASA-LAUNCHER AUTH] Error inesperado en casaLauncherMe:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};