exports.allLicencias = (req, res) => {
    try {
        const query = 'CALL mostrarVentas()';

        req.db.query(query, (error, results) => {
            if (error) {
                console.error('Error en la consulta de allLicencias:', error);
                return res.status(500).json({
                    error: 'Error al obtener las licencias',
                    details: error.message
                });
            }

            res.json(results[0]);
        });
    } catch (error) {
        console.error('Error en la ruta de allLicencias:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};