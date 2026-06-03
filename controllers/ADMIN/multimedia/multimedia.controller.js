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

        req.db.query(
            'CALL ObtenerMultimedia(?, ?, ?, ?)',
            [tipo, grado, subtipo, materia],
            (error, results) => {
                if (error) {
                    console.error('Error en la consulta:', error);
                    return res.status(500).json({ error: 'Error en la base de datos' });
                }
                res.json(results[0]);
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