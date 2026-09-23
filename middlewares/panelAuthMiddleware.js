const jwt = require('jsonwebtoken');

/**
 * Autenticación de los paneles internos: administrador y ventas.
 *
 * Protege /casa/admin/*, que hasta ahora estaba abierto: cualquiera que
 * conociera la URL podía leer licencias y borrar materias sin credencial.
 *
 * No aplica al portal docente (/casa/licencias, /casa/multimedia) ni al
 * launcher, que se autentican por su cuenta y tienen su propio middleware.
 *
 * El token lo emite LOGIN_USUARIO_ADMIN a través de login.controller.js, con
 * este contenido: { userId, username, userType }.
 */

/** Únicos valores de UAD_TIPO que pueden entrar a los paneles. */
const ROLES_PANEL = ['admin', 'ventas'];

/**
 * Secreto de firma. Devuelve null si no está configurado.
 *
 * Antes se usaba `process.env.JWT_SECRET || 'tu-secret-key-...'`. Ese valor por
 * omisión está en el repositorio, así que cualquiera podía firmar un token
 * válido. Sin secreto configurado no se firma ni se valida nada: es preferible
 * que el login falle de forma visible a que acepte tokens falsificables.
 */
function obtenerSecreto() {
    const secreto = process.env.JWT_SECRET;
    return secreto && secreto.trim() !== '' ? secreto : null;
}

/**
 * Saca el token de la petición.
 *
 * Lo normal es la cabecera `Authorization: Bearer <token>`. El parámetro
 * `?token=` existe solo para las descargas: la exportación de licencias apunta
 * el navegador al endpoint con un <a href>, y una navegación no puede llevar
 * cabeceras propias.
 *
 * Un token en la URL puede quedar registrado en los logs del proxy, así que se
 * acepta únicamente como último recurso.
 */
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

/**
 * Middleware de acceso a los paneles.
 *
 *   verificarPanel()          -> admin y ventas
 *   verificarPanel('admin')   -> solo administrador
 *   verificarPanel('ventas')  -> solo ventas
 *
 * Deja el usuario del token en req.usuarioPanel para que los controladores
 * puedan saber quién hizo la petición sin volver a leerlo.
 */
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
