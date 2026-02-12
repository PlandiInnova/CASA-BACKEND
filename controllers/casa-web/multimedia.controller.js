exports.allMultimedia = (req, res) => {    
    try {
        const { subtipo, grado } = req.body;

        const query = 'CALL mostrarMultimedia(?,?)';

        req.db.query(query, [subtipo, grado], (error, results) => {
            if (error) {
                console.error('Error en la consulta de mostrarMultimedia:', error);
                return res.status(500).json({
                    error: 'Error al obtener la multimedia',
                    details: error.message
                });
            }
            res.json(results[0]);
        });
    } catch (error) {
        console.error('Error en la ruta de mostrarMultimedia:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};

exports.allGradosSubtipo = (req, res) => {    
    try {
        const { subtipo } = req.body;

        const query = 'CALL mostrarGradosSubtipos(?)';

        req.db.query(query, [subtipo], (error, results) => {
            if (error) {
                console.error('Error en la consulta de mostrarGradosSubtipos:', error);
                return res.status(500).json({
                    error: 'Error al obtener los grados',
                    details: error.message
                });
            }
            res.json(results[0]);
        });
    } catch (error) {
        console.error('Error en la ruta de allGradosSubtipo:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};


exports.allMultimediaSubtipo = (req, res) => {    
    try {
        const { subtipo } = req.body;

        const query = 'CALL mostrarMultimediaPorSubtipo(?)';

        req.db.query(query, [subtipo], (error, results) => {
            if (error) {
                console.error('Error en la consulta de mostrarMultimediaPorSubtipo:', error);
                return res.status(500).json({
                    error: 'Error al obtener los grados',
                    details: error.message
                });
            }
            res.json(results[0]);
        });
    } catch (error) {
        console.error('Error en la ruta de allMultimediaSubtipo:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};