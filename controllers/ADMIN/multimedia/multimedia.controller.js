exports.getMultimedia = async (req, res) => {
    try {
        const tipo = parseInt(req.query.tipo);

        if (isNaN(tipo)) {
            return res.status(400).json({ error: 'Parámetro tipo inválido' });
        }

        const grado = req.query.grado ? parseInt(req.query.grado) : null;
        const subtipo = req.query.subtipo ? parseInt(req.query.subtipo) : null;
        const materia = req.query.materia ? parseInt(req.query.materia) : null;

        if (req.query.grado && isNaN(grado)) {
            return res.status(400).json({ error: 'Parámetro grado inválido' });
        }
        if (req.query.subtipo && isNaN(subtipo)) {
            return res.status(400).json({ error: 'Parámetro subtipo inválido' });
        }

        if (req.query.materia && isNaN(materia)) {
            return res.status(400).json({ error: 'Parámetro materia inválido' });
        }

        /*
         * Antes era CALL ObtenerMultimedia(?,?,?,?). La consulta vive aquí
         * porque el filtro por semestre cambió y el procedimiento se deja
         * intacto para no tener que recrearlo en cada base.
         *
         * El semestre ya no se compara contra MUL_GRA_ID, que guarda uno solo.
         * Se compara contra los semestres de la MATERIA del contenido: si una
         * materia se imparte en BGT-1 y BC-3, su contenido aparece al filtrar
         * por cualquiera de los dos. Antes solo salía en el primero.
         *
         * Los contenidos sin materia caen de vuelta a su MUL_GRA_ID; si no,
         * desaparecerían del filtro por semestre.
         *
         * Las columnas devueltas y el orden son los mismos del procedimiento.
         */
        const sql = `
            SELECT
                m.MUL_ID,
                m.MUL_TITULO,
                m.MUL_DESCRIPCION,
                m.MUL_GRA_ID,
                m.MUL_IMAGEN,
                m.MUL_TIPO,
                m.MUL_SBT_ID,
                m.MUL_ENLACE,
                m.MUL_FECHA_CREACION,
                m.MUL_STATUS,
                m.MUL_UAD_ID,
                m.MUL_MAT_ID,
                g.GRA_NUMERO,
                g.GRA_NOMBRE,
                s.SBT_TIPO,
                ua.UAD_USUARIO AS USU_USUARIO,
                mat.MAT_NOMBRE
            FROM CAS_MULTIMEDIA m
            LEFT JOIN CAS_GRADO g          ON m.MUL_GRA_ID = g.GRA_ID
            LEFT JOIN CAS_SUBTIPOS s       ON m.MUL_SBT_ID = s.SBT_ID
            LEFT JOIN CAS_USUARIO_ADMIN ua ON m.MUL_UAD_ID = ua.UAD_ID
            LEFT JOIN CAS_MATERIA mat      ON m.MUL_MAT_ID = mat.MAT_ID
            WHERE m.MUL_TIPO = ?
                AND (? IS NULL
                     OR EXISTS (SELECT 1 FROM CAS_GRADO_MATERIA gm
                                 WHERE gm.GMA_MAT_ID = m.MUL_MAT_ID
                                   AND gm.GMA_GRA_ID = ?)
                     OR (m.MUL_MAT_ID IS NULL AND m.MUL_GRA_ID = ?))
                AND (? IS NULL OR m.MUL_SBT_ID = ?)
                AND (? IS NULL OR m.MUL_MAT_ID = ?)
            ORDER BY m.MUL_FECHA_CREACION DESC`;

        req.db.query(
            sql,
            [tipo, grado, grado, grado, subtipo, subtipo, materia, materia],
            (error, results) => {
                if (error) {
                    console.error('Error en la consulta:', error);
                    return res.status(500).json({ error: 'Error en la base de datos' });
                }
                res.json(results);
            }
        );

    } catch (error) {
        console.error('Error en getMultimedia:', error);
        res.status(500).json({
            error: 'Error al obtener multimedia',
            detalle: error.message
        });
    }
};