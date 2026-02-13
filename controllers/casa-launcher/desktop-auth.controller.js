const crypto = require('crypto');

exports.postGenerateToken = async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;

        if (!usuario || !contrasena) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        const loginQuery = 'CALL sp_login_usuario(?, ?)';

        req.db.query(loginQuery, [usuario, contrasena], (error, results) => {
            if (error) {
                console.error('[DESKTOP-AUTH] Error validando credenciales:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }

            const data = results[0][0];

            if (!data || data.RESPONSE !== 'OK') {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            const usuId = data.USU_ID;
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            const userData = {
                usuario: usuario,
                contrasena: contrasena
            };
            const insertQuery = `
                INSERT INTO desktop_auth_tokens 
                (token, usu_id, user_data, expires_at) 
                VALUES (?, ?, ?, ?)
            `;

            req.db.query(insertQuery, [token, usuId, JSON.stringify(userData), expiresAt], (insertErr) => {
                if (insertErr) {
                    console.error('[DESKTOP-AUTH] Error insertando token:', insertErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Error generando token'
                    });
                }

                res.json({
                    success: true,
                    token: token,
                    message: 'Token generado correctamente'
                });
            });
        });

    } catch (error) {
        console.error('[DESKTOP-AUTH] Error en postGenerateToken:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

exports.postGenerateTokenFromUser = async (req, res) => {
    try {
        const { usuario, usu_id } = req.body;

        if (!usuario && !usu_id) {
            return res.status(400).json({
                success: false,
                message: 'Usuario o usu_id es requerido'
            });
        }

        let userQuery;
        let queryParams;

        if (usu_id) {
            userQuery = `
                SELECT USU_ID, USU_USUARIO, USU_PASSWORD, USU_STATUS
                FROM CAS_USUARIO
                WHERE USU_ID = ? AND USU_STATUS = 1
                LIMIT 1
            `;
            queryParams = [usu_id];
        } else {
            userQuery = `
                SELECT USU_ID, USU_USUARIO, USU_PASSWORD, USU_STATUS
                FROM CAS_USUARIO
                WHERE USU_USUARIO = ? AND USU_STATUS = 1
                LIMIT 1
            `;
            queryParams = [usuario];
        }

        req.db.query(userQuery, queryParams, (error, results) => {
            if (error) {
                console.error('[DESKTOP-AUTH] Error consultando usuario:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }

            if (!results || results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const user = results[0];
            const usuId = user.USU_ID;
            const usuarioFinal = user.USU_USUARIO;
            const contrasena = user.USU_PASSWORD;

            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            const userData = {
                usuario: usuarioFinal,
                contrasena: contrasena
            };
            const insertQuery = `
                INSERT INTO desktop_auth_tokens 
                (token, usu_id, user_data, expires_at) 
                VALUES (?, ?, ?, ?)
            `;

            req.db.query(insertQuery, [token, usuId, JSON.stringify(userData), expiresAt], (insertErr) => {
                if (insertErr) {
                    console.error('[DESKTOP-AUTH] Error insertando token:', insertErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Error generando token'
                    });
                }

                res.json({
                    success: true,
                    token: token,
                    message: 'Token generado correctamente'
                });
            });
        });

    } catch (error) {
        console.error('[DESKTOP-AUTH] Error en postGenerateTokenFromUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

exports.postValidateToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token es requerido'
            });
        }

        const tokenQuery = `
            SELECT usu_id, user_data, expires_at, used 
            FROM desktop_auth_tokens 
            WHERE token = ?
        `;

        req.db.query(tokenQuery, [token], (err, tokenResult) => {
            if (err) {
                console.error('[DESKTOP-AUTH] Error consultando token:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }

            if (tokenResult.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Token no válido'
                });
            }

            const tokenData = tokenResult[0];
            const now = new Date();
            const expiresAt = new Date(tokenData.expires_at);

            if (tokenData.used) {
                return res.status(401).json({
                    success: false,
                    message: 'Token ya utilizado'
                });
            }

            if (now > expiresAt) {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado'
                });
            }
            const updateQuery = `
                UPDATE desktop_auth_tokens 
                SET used = 1 
                WHERE token = ?
            `;

            req.db.query(updateQuery, [token], (updateErr) => {
                if (updateErr) {
                    console.error('[DESKTOP-AUTH] Error actualizando token:', updateErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Error procesando token'
                    });
                }

                const userData = JSON.parse(tokenData.user_data);

                res.json({
                    success: true,
                    message: 'Autenticación exitosa',
                    userData: userData,
                    usu_id: tokenData.usu_id
                });
            });
        });

    } catch (error) {
        console.error('[DESKTOP-AUTH] Error en postValidateToken:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};