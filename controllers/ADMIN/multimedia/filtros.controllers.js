exports.getGradosFilter = async (req, res) => {
    try {
        req.db.query('SELECT * FROM CAS_GRADO',
            (error, results) => {
                if (error) {
                    console.error('Error en la consulta:', error);
                    return res.status(500).json({ error: 'Error en la base de datos' });
                }
                res.json(results);
            }
        );
    } catch (error) {
        console.error('Error en getGradosFilter:', error);
        res.status(500).json({
            error: 'Error al obtener getGradosFilter',
            detalle: error.message
        });
    }
};

exports.getSubtipoFilter = async (req, res) => {
    try {
        req.db.query('SELECT * FROM CAS_SUBTIPOS',
            (error, results) => {
                if (error) {
                    console.error('Error en la consulta:', error);
                    return res.status(500).json({ error: 'Error en la base de datos' });
                }
                res.json(results);
            }
        );

    } catch (error) {
        console.error('Error en getSubtipoFilter:', error);
        res.status(500).json({
            error: 'Error al obtener getSubtipoFilter',
            detalle: error.message
        });
    }
};

exports.getMateriasFilter = async (req, res) => {
    try {
        const grado = req.query.grado;
        const gradoId = parseInt(grado, 10);

        if (!Number.isInteger(gradoId) || gradoId < 1) {
            return res.status(400).json({
                error: 'Query "grado" es requerida',
                detalle: 'Debes enviar un número en el query parameter ?grado=1'
            });
        }

        const sql = `
            SELECT
                MAT_ID,
                MAT_NOMBRE,
                MAT_GRA_ID,
                MAT_STATUS
            FROM CAS_MATERIA
            WHERE MAT_GRA_ID = ?
            ORDER BY MAT_NOMBRE;
        `;

        req.db.query(sql, [gradoId], (error, results) => {
            if (error) {
                console.error('Error en getMateriasFilter:', error);
                return res.status(500).json({
                    error: 'Error en la base de datos',
                    detalle: error.message
                });
            }
            res.json(results);
        });
    } catch (error) {
        console.error('Error al obtener getMateriasFilter:', error);
        res.status(500).json({
            error: 'Error al obtener getMateriasFilter',
            detalle: error.message
        });
    }
};