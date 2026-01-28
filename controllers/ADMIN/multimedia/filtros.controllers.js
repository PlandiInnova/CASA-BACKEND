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