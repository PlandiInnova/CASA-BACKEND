const nodemailer = require('nodemailer');

//********* PRUEBAS LOCALES ************ */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'alexiselcazu@gmail.com',
        pass: 'dumb rzgp edhs jbod'
    }
});

//********* PROUDCCION ************ */
// const transporter = nodemailer.createTransport({
//     host: 'mail.metabooks.com.mx', 
//     port: 465,
//     secure: true, 
//     auth: {
//         user: 'contacto@metabooks.com.mx',
//         pass: 'DyLPcBnbrzFct8jF'
//     }
// });



exports.existLicence = (req, res) => {
    try {
        const { tipo, licencia } = req.body;

        const query = 'CALL sp_existe_licencia(?,?)';

        req.db.query(query, [tipo, licencia], (error, results) => {
            if (error) {
                console.error('Error en la consulta de existe Licencia:', error);
                return res.status(500).json({
                    error: 'Error al obtener la respuesta',
                    details: error.message
                });
            }
            res.json(results[0]);
        });
    } catch (error) {
        console.error('Error en la ruta de existLicence:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { usuario, password } = req.body;

        const query = 'CALL sp_login_usuario(?, ?)';

        req.db.query(query, [usuario, password], (error, results) => {

            if (error) {
                console.error(error);
                return res.status(500).json({
                    response: 'ERROR',
                    code: 'ERROR_DB'
                });
            }

            const data = results[0][0];

            if (!data || data.RESPONSE !== 'OK') {
                return res.status(200).json({
                    response: 'ERROR',
                    code: 'CREDENCIALES_INVALIDAS'
                });
            }

            return res.status(200).json({
                response: 'OK',
                code: 'LOGIN_OK',
                userId: data.USU_ID,
                usuario: data.USU_USUARIO,
                nombre: data.USU_NOMBRE
            });

        });

    } catch (error) {
        console.error('Error loginUser:', error);
        res.status(500).json({
            response: 'ERROR',
            code: 'ERROR_SERVIDOR'
        });
    }
};

exports.getLicenceUser = (req, res) => {
    try {
        const { usuarioId } = req.body;

        const query = 'CALL mostrarLicenciasUsuario(?)';

        req.db.query(query, [usuarioId], (error, results) => {
            if (error) {
                console.error('Error en la consulta de de mostrarLicenciasUsuario:', error);
                return res.status(500).json({
                    error: 'Error al obtener la respuesta',
                    details: error.message
                });
            }
            res.json(results[0]);
        });
    } catch (error) {
        console.error('Error en la ruta de getLicenceUser:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};

exports.insertProducts = async (req, res) => {
    try {
        const { usuarioId, licenciaId } = req.body;

        const query = 'CALL agregarProductos(?,?)';

        req.db.query(query, [usuarioId, licenciaId], (error, results) => {

            if (error) {
                return res.status(500).json({
                    response: 'ERROR',
                    code: 'ERROR_DB'
                });
            }

            const spData = results[0][0];
            const spResponse = spData?.RESPONSE;

            if (spResponse === 'OK') {
                return res.status(200).json({
                    response: 'OK',
                    message: 'Producto agregado correctamente'
                });
            }

            if (spResponse === 'EXISTE') {
                return res.status(200).json({
                    response: 'EXISTE',
                    message: 'El usuario ya tiene esta licencia'
                });
            }

            return res.status(400).json({
                response: 'ERROR',
                message: 'No se pudo agregar el producto'
            });


        });

    } catch (error) {
        console.error('Error insertProducts:', error);
        res.status(500).json({
            response: 'ERROR',
            code: 'ERROR_SERVIDOR',
            message: error.message
        });
    }
};



exports.insertUser = async (req, res) => {
    try {
        const {
            nombre,
            apellidop,
            apellidom,
            correo,
            telefono,
            password,
            fecha,
            licenciaId
        } = req.body;

        // Generar usuario único
        const usuario = await generarUsuarioUnico(
            req.db,
            nombre,
            apellidop,
            apellidom
        );

        const query = 'CALL insertarUsuario(?,?,?,?,?,?,?,?,?)';

        req.db.query(query, [
            nombre,
            apellidop,
            apellidom,
            correo,
            usuario,
            telefono,
            password,
            fecha,
            licenciaId
        ], async (error, results) => {

            if (error) {
                return res.status(500).json({
                    response: 'ERROR',
                    code: 'ERROR_DB'
                });
            }

            const spData = results[0][0];

            const spResponse = spData?.RESPONSE;
            const userId = spData?.USER_ID;

            // CORREO YA EXISTE
            if (spResponse === 'CORREO_EXISTE') {
                return res.status(200).json({
                    response: 'ERROR',
                    code: 'CORREO_EXISTE'
                });
            }

            // CUALQUIER OTRO ERROR
            if (spResponse !== 'OK') {
                return res.status(200).json({
                    response: 'ERROR',
                    code: spResponse
                });
            }

            //  USUARIO CREADO
            let correoEnviado = true;

            try {
                await enviarCorreoBienvenida({
                    correo,
                    nombre,
                    usuario,
                    password
                });
            } catch (err) {
                correoEnviado = false;
                console.error('⚠️ Error enviando correo:', err.message);
            }

            return res.status(200).json({
                response: 'OK',
                code: 'USUARIO_CREADO',
                userId: userId,
                usuarioGenerado: usuario,
                usuarioNombre: nombre,
                correoEnviado
            });
        });


    } catch (error) {
        console.error('Error insertUser:', error);
        res.status(500).json({
            response: 'ERROR',
            code: 'ERROR_SERVIDOR',
            message: error.message
        });
    }
};


async function generarUsuarioUnico(db, nombre, apellidop, apellidom) {
    const base = generarUsuarioBase(nombre, apellidop, apellidom);

    let usuario;
    let existe = true;
    let intentos = 0;

    while (existe && intentos < 10) {
        const random = generarRandomAlfanumerico(4);
        usuario = base + random;
        existe = await usuarioExiste(db, usuario);
        intentos++;
    }

    if (existe) {
        throw new Error('No se pudo generar un usuario único');
    }

    return usuario;
}



function generarRandomAlfanumerico(length = 4) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generarUsuarioBase(nombre, apellidop, apellidom) {
    return (
        nombre.substring(0, 2) +
        apellidop.substring(0, 1) +
        apellidom.substring(0, 1)
    ).toUpperCase();
}

function usuarioExiste(db, usuario) {
    return new Promise((resolve, reject) => {
        const query = 'CALL sp_existe_usuario(?)';
        db.query(query, [usuario], (error, results) => {
            if (error) return reject(error);
            resolve(results[0].total > 0);
        });
    });
}


async function enviarCorreoBienvenida({ correo, nombre, usuario, password }) {
    const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>¡Bienvenido a Casa Web! 🏠</h2>
      <p>Hola <strong>${nombre}</strong>,</p>

      <p>Tu cuenta ha sido creada correctamente.</p>

      <p><strong>Datos de acceso:</strong></p>
      <ul>
        <li><strong>Usuario:</strong> ${usuario}</li>
        <li><strong>Contraseña:</strong> ${password}</li>
      </ul>

      <p>Te recomendamos cambiar tu contraseña después de iniciar sesión.</p>

      <br>
      <p>Equipo <strong>Casa Web</strong></p>
    </div>
  `;

    await transporter.sendMail({
        from: '"Casa Web" <contacto@metabooks.com.mx>',
        to: correo,
        subject: 'Bienvenido a Casa Web',
        html
    });
}
