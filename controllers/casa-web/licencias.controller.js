exports.existLicence = (req, res) => {    
    try {
        const { licencia } = req.body;

        const query = 'CALL sp_existe_licencia(?)';

        req.db.query(query, [licencia], (error, results) => {
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