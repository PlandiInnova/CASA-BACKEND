const jwt = require('jsonwebtoken');

const ROLES_PANEL = ['admin', 'ventas'];

function obtenerSecreto() {
    const secreto = process.env.JWT_SECRET;
    return secreto && secreto.trim() !== '' ? secreto : null;
}

function extraerToken(req) {
    const cabecera = req.headers['authorization'] || req.headers['Authorization'];
    if (cabecera && cabecera.startsWith('Bearer ')) {
        const token = cabecera.slice(7).trim();
        if (token) return token;
    }

    if (req.query && typeof req.query.token === 'string' && req.query.token.trim()) {
        return req.query.token.trim();
    }

    return null;
}

function verificarPanel(...roles) {
    const permitidos = (roles.length ? roles : ROLES_PANEL).map((r) => String(r).toLowerCase());

    return (req, res, next) => {
        const secreto = obtenerSecreto();
        if (!secreto) {
            console.error('[PANEL AUTH] Falta la variable de entorno JWT_SECRET');
            return res.status(500).json({
                success: false,
                message: 'Configuración de autenticación no disponible'
            });
        }

        const token = extraerToken(req);
        if (!token) {
            return res.status(401).json({
                success: false,
                code: 'SIN_TOKEN',
                message: 'Se requiere iniciar sesión'
            });
        }

        jwt.verify(token, secreto, (error, datos) => {
            if (error) {
                // TokenExpiredError se distingue para que el front pueda avisar
                // "tu sesión caducó" en vez de un error genérico.
                const expirado = error.name === 'TokenExpiredError';
                return res.status(401).json({
                    success: false,
                    code: expirado ? 'TOKEN_EXPIRADO' : 'TOKEN_INVALIDO',
                    message: expirado ? 'La sesión expiró, vuelve a iniciar sesión' : 'Sesión no válida'
                });
            }

            const tipo = String(datos.userType || '').toLowerCase();
            if (!permitidos.includes(tipo)) {
                return res.status(403).json({
                    success: false,
                    code: 'SIN_PERMISO',
                    message: 'Tu usuario no tiene acceso a esta sección'
                });
            }

            req.usuarioPanel = {
                id: datos.userId,
                usuario: datos.username,
                tipo
            };
            next();
        });
    };
}

module.exports = verificarPanel;
module.exports.verificarPanel = verificarPanel;
module.exports.obtenerSecreto = obtenerSecreto;
module.exports.ROLES_PANEL = ROLES_PANEL;
