/**
 * Subsistemas que puede abarcar una licencia, según el contenido que otorga.
 *
 * El subsistema está registrado en la materia, así que se llega recorriendo:
 *
 *     paquete -> productos -> materia -> CAS_GRADO_MATERIA -> grado -> subsistema
 *
 * Se pasa por la materia y no por PRO_GRA_ID porque una materia puede impartirse
 * en varios subsistemas a la vez, mientras que el grado del producto es uno solo.
 *
 * Sin paquete (GENERICA y PRESENTACIONES) la licencia da el catálogo completo,
 * así que se toman los subsistemas de todos los productos.
 *
 * Este módulo es la única fuente: lo usan tanto el endpoint que llena el
 * selector de los formularios como el generador al guardar. Si estuviera
 * duplicado, el usuario podría marcar una opción que el generador luego
 * rechazara.
 */

/** Subsistemas alcanzables desde el catálogo completo de productos. */
const SQL_CATALOGO = `
    SELECT DISTINCT s.SUB_ID, s.SUB_NOMBRE
      FROM CAS_PRODUCTOS pr
      JOIN CAS_GRADO_MATERIA gm ON gm.GMA_MAT_ID = pr.PRO_MAT_ID
      JOIN CAS_GRADO g          ON g.GRA_ID = gm.GMA_GRA_ID
      JOIN CAS_SUBSISTEMA s     ON s.SUB_ID = g.GRA_SUB_ID
     ORDER BY s.SUB_NOMBRE`;

/** Subsistemas alcanzables desde los productos de un paquete. */
const SQL_POR_PAQUETE = `
    SELECT DISTINCT s.SUB_ID, s.SUB_NOMBRE
      FROM CAS_PAQUETE pq
      JOIN CAS_PRODUCTOS pr
        ON FIND_IN_SET(pr.PRO_ID,
             REPLACE(REPLACE(REPLACE(pq.PAQ_PRODUCTOS, '[', ''), ']', ''), ' ', '')) > 0
      JOIN CAS_GRADO_MATERIA gm ON gm.GMA_MAT_ID = pr.PRO_MAT_ID
      JOIN CAS_GRADO g          ON g.GRA_ID = gm.GMA_GRA_ID
      JOIN CAS_SUBSISTEMA s     ON s.SUB_ID = g.GRA_SUB_ID
     WHERE pq.PAQ_ID = ?
     ORDER BY s.SUB_NOMBRE`;

/**
 * Lista los subsistemas disponibles.
 * callback(error, [{ SUB_ID, SUB_NOMBRE }])
 */
function listarDisponibles(db, paqId, callback) {
    const sinPaquete = paqId == null;
    db.query(
        sinPaquete ? SQL_CATALOGO : SQL_POR_PAQUETE,
        sinPaquete ? [] : [paqId],
        (error, filas) => {
            if (error) return callback(error, []);
            callback(null, filas || []);
        }
    );
}

/**
 * Normaliza lo que llega del formulario: acepta arreglo, '[1,3]' o '1,3'.
 * Devuelve ids únicos y ordenados.
 */
function parseIds(valor) {
    if (valor == null || valor === '') return [];
    let bruto = valor;
    if (typeof bruto === 'string') {
        const texto = bruto.trim().replace(/^\[|\]$/g, '');
        bruto = texto === '' ? [] : texto.split(',');
    }
    if (!Array.isArray(bruto)) bruto = [bruto];
    const ids = bruto
        .map((v) => parseInt(v, 10))
        .filter((n) => Number.isInteger(n) && n > 0);
    return [...new Set(ids)].sort((a, b) => a - b);
}

/**
 * Resuelve el valor final de LIC_SUBSISTEMAS, como '[1,3]' o null.
 *
 * Toma los que marcó el usuario y los cruza con los que el contenido realmente
 * tiene: así no se puede guardar un subsistema del que la licencia no otorga
 * nada. Si no marcó ninguno, se guardan todos los disponibles.
 *
 * callback(textoOrNull)
 */
function resolverSubsistemas(db, paqId, seleccionados, callback) {
    listarDisponibles(db, paqId, (error, disponibles) => {
        if (error) {
            console.error('Error al deducir los subsistemas de la licencia:', error);
            return callback(null);
        }

        const idsDisponibles = disponibles.map((s) => Number(s.SUB_ID));
        const marcados = parseIds(seleccionados);

        const finales = marcados.length
            ? marcados.filter((id) => idsDisponibles.includes(id))
            : idsDisponibles;

        // Si lo marcado no coincide con nada real, se cae a lo disponible en
        // vez de dejar la licencia sin dato.
        const usar = finales.length ? finales : idsDisponibles;

        callback(usar.length ? `[${usar.sort((a, b) => a - b).join(',')}]` : null);
    });
}

module.exports = { listarDisponibles, resolverSubsistemas, parseIds };
