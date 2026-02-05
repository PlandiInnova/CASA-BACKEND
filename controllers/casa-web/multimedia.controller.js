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
            res.json(results);
        });
    } catch (error) {
        console.error('Error en la ruta de mostrarMultimedia:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};