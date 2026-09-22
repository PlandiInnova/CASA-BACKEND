/**
 * Controlador de productos para CASA-LAUNCHER.
 * Query: usuario (USU_USUARIO). Obtiene productos vía licencias del usuario.
 */

/** Tipos sin paquete: su alcance es el catálogo completo. */
const TIPOS_CATALOGO_COMPLETO = ['PRESENTACIONES', 'GENERICA'];

/** Columnas que consume el launcher. Idénticas en ambas ramas de alcance. */
const COLUMNAS_PRODUCTO = `
    PRO_ID,
    PRO_NOMBRE,
    PRO_NOMBRE_DETALLADO,
    PRO_DESCRIPCION,
    PRO_GRA_ID,
    PRO_EXE,
    PRO_IMAGEN,
    PRO_TIPO,
    PRO_FILES,
    PRO_VERSION`;

// LEFT y no INNER: con INNER, una licencia sin paquete desaparecía y no había
// forma de saber que era PRESENTACIONES.
const QUERY_LICENCIAS = `
    SELECT
        l.LIC_TIPO AS LIC_TIPO,
        p.PAQ_PRODUCTOS AS PAQ_PRODUCTOS
    FROM CAS_LICENCIAS_USUARIOS lu
    INNER JOIN CAS_LICENCIA l ON l.LIC_ID = lu.LUS_LIC_ID AND l.LIC_STATUS = 1
    LEFT JOIN CAS_PAQUETE p ON p.PAQ_ID = l.LIC_PAQ_ID
    WHERE lu.LUS_USU_ID = ?
`;

function esCatalogoCompleto(tipo) {
    return TIPOS_CATALOGO_COMPLETO.includes(String(tipo ?? '').trim().toUpperCase());
}

/** Une los PRO_ID de los paquetes de todas las licencias del usuario. */
function idsDeProductos(rows) {
    const ids = new Set();
    for (const row of rows || []) {
        if (!row.PAQ_PRODUCTOS) continue;
        try {
            const parsed = JSON.parse(row.PAQ_PRODUCTOS);
            if (Array.isArray(parsed)) {
                parsed.forEach((id) => ids.add(Number(id)));
            }
        } catch (e) {
            console.warn('[CASA-LAUNCHER PRODUCTOS] PAQ_PRODUCTOS no es JSON válido:', row.PAQ_PRODUCTOS);
        }
    }
    return [...ids];
}

/** Los tipos que hoy sabe tratar el sistema. Cualquier otro se avisa. */
const TIPOS_CONOCIDOS = ['PRESENTACIONES', 'GENERICA', 'INDIVIDUAL'];

/** Se mandan sin interpretar: cruzarlas en el launcher evita desplegar backend
 *  cada vez que cambien las reglas del menu.
 *
 *  `productoMateria` va aqui y no en COLUMNAS_PRODUCTO a proposito: PRO_MAT_ID y
 *  CAS_GRADO_MATERIA son estructuras nuevas que pueden faltar en un servidor sin
 *  migrar, y un SELECT contra una columna inexistente tumbaria el catalogo. Aqui
 *  el fallo solo cuesta el menu. */
const CONSULTAS_CATALOGO = {
    subsistemas: 'SELECT SUB_ID, SUB_NOMBRE FROM CAS_SUBSISTEMA WHERE SUB_STATUS = 1',
    grados: 'SELECT GRA_ID, GRA_NUMERO, GRA_SUB_ID FROM CAS_GRADO WHERE GRA_STATUS = 1',
    materiaGrado: 'SELECT GMA_MAT_ID, GMA_GRA_ID FROM CAS_GRADO_MATERIA',
    productoMateria: 'SELECT PRO_ID, PRO_MAT_ID FROM CAS_PRODUCTOS WHERE PRO_MAT_ID IS NOT NULL'
};

/** req.db es el pool: resuelve la conexion solo. */
function consultar(db, sql) {
    return new Promise((resolve, reject) => {
        db.query(sql, (err, filas) => (err ? reject(err) : resolve(filas || [])));
    });
}

function catalogoDeReferencia(db) {
    return Promise.all([
        consultar(db, CONSULTAS_CATALOGO.subsistemas),
        consultar(db, CONSULTAS_CATALOGO.grados),
        consultar(db, CONSULTAS_CATALOGO.materiaGrado),
        consultar(db, CONSULTAS_CATALOGO.productoMateria)
    ]).then(([subsistemas, grados, materiaGrado, productoMateria]) =>
        ({ subsistemas, grados, materiaGrado, productoMateria }));
}

/** Si el catalogo falla, los productos salen igual con `catalogo: null`: el
 *  launcher lo lee como "sin menu". Nunca se queda sin catalogo por esto. */
function responder(res, db, alcance, productos) {
    return catalogoDeReferencia(db)
        .catch((err) => {
            console.error('[CASA-LAUNCHER PRODUCTOS] No se pudo leer el catalogo de referencia:', err);
            return null;
        })
        .then((catalogo) => res.json({ success: true, alcance, productos, catalogo }))
        .catch((err) => console.error('[CASA-LAUNCHER PRODUCTOS] Error al responder:', err));
}

/** Un tipo nuevo caeria a la rama de paquete y devolveria lista vacia en silencio. */
function avisarTiposDesconocidos(usuario, licencias) {
    const raros = [...new Set(
        licencias
            .map((row) => String(row.LIC_TIPO ?? '').trim().toUpperCase())
            .filter((tipo) => tipo && !TIPOS_CONOCIDOS.includes(tipo))
    )];
    if (raros.length) {
        console.warn(`[CASA-LAUNCHER PRODUCTOS] ${usuario}: tipo de licencia no reconocido: ${raros.join(', ')}`);
    }
}

function errorProductos(res, err) {
    console.error('[CASA-LAUNCHER PRODUCTOS] Error al obtener CAS_PRODUCTOS:', err);
    return res.status(500).json({
        success: false,
        message: 'Error al obtener productos',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
}

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

        req.db.query(QUERY_LICENCIAS, [userId], (error, rows) => {
            if (error) {
                console.error('[CASA-LAUNCHER PRODUCTOS] Error al obtener licencias del usuario:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener productos',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }

            const licencias = rows || [];
            avisarTiposDesconocidos(usuario, licencias);

            if (licencias.length === 0) {
                return responder(res, req.db, 'NINGUNO', []);
            }

            // Gana el alcance mayor: basta una para no resolver paquetes.
            if (licencias.some((row) => esCatalogoCompleto(row.LIC_TIPO))) {
                const queryTodos = `
                    SELECT ${COLUMNAS_PRODUCTO}
                    FROM CAS_PRODUCTOS
                    ORDER BY PRO_NOMBRE
                `;

                return req.db.query(queryTodos, (err, products) => {
                    if (err) return errorProductos(res, err);

                    console.log(`[CASA-LAUNCHER PRODUCTOS] ${usuario}: catálogo completo, ${(products || []).length} productos`);
                    return responder(res, req.db, 'TOTAL', products || []);
                });
            }

            const idsArray = idsDeProductos(licencias);
            if (idsArray.length === 0) {
                return responder(res, req.db, 'PAQUETE', []);
            }

            const placeholders = idsArray.map(() => '?').join(',');
            const queryProductos = `
                SELECT ${COLUMNAS_PRODUCTO}
                FROM CAS_PRODUCTOS
                WHERE PRO_ID IN (${placeholders})
                ORDER BY PRO_NOMBRE
            `;

            req.db.query(queryProductos, idsArray, (err, products) => {
                if (err) return errorProductos(res, err);

                console.log(`[CASA-LAUNCHER PRODUCTOS] ${usuario}: por paquete, ${(products || []).length} productos`);
                return responder(res, req.db, 'PAQUETE', products || []);
            });
        });
    });
};