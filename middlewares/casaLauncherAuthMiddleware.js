const jwt = require('jsonwebtoken');

/**
 * Middleware de verificación de JWT específico para CASA-LAUNCHER.
 * Espera el header Authorization: Bearer <token>
 */
function casaLauncherVerifyToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticación no proporcionado'
            });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.CASA_LAUNCHER_JWT_SECRET || process.env.CALA_JWT_SECRET;

        if (!secret) {
            console.error('[CASA-LAUNCHER AUTH] Falta la variable de entorno CASA_LAUNCHER_JWT_SECRET');
            return res.status(500).json({
                success: false,
                message: 'Configuración de autenticación no disponible'
            });
        }

        jwt.verify(token, secret, (error, decoded) => {
            if (error) {
                console.error('[CASA-LAUNCHER AUTH] Error al verificar token:', error.message);
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido o expirado'
                });
            }

            req.casaLauncherUser = decoded;
            next();
        });
    } catch (error) {
        console.error('[CASA-LAUNCHER AUTH] Error inesperado en casaLauncherVerifyToken:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}

module.exports = casaLauncherVerifyToken;