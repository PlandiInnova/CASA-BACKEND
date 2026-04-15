exports.getTodasMaterias = async (req, res) => {
    try {
        req.db.query('SELECT * FROM CAS_MATERIA ORDER BY MAT_NOMBRE ASC', (error, results) => {
            if (error) {
                console.error('Error al obtener materias:', error);
                return res.status(500).json({ error: 'Error del servidor al obtener las materias' });
            }
            res.json(results);
        });
    } catch (error) {
        console.error('Error general obtener materias:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.addMateria = async (req, res) => {
    try {
        const { MAT_NOMBRE, MAT_DESCRIPCION, MAT_GRA_ID, MAT_STATUS } = req.body;

        if (!MAT_NOMBRE || !MAT_GRA_ID) {
            return res.status(400).json({ error: 'Faltan campos requeridos: MAT_NOMBRE y MAT_GRA_ID' });
        }

        const query = 'INSERT INTO CAS_MATERIA (MAT_NOMBRE, MAT_DESCRIPCION, MAT_GRA_ID, MAT_STATUS) VALUES (?, ?, ?, ?)';
        const values = [MAT_NOMBRE, MAT_DESCRIPCION || '', MAT_GRA_ID, MAT_STATUS !== undefined ? MAT_STATUS : 1];

        req.db.query(query, values, (error, results) => {
            if (error) {
                console.error('Error al insertar materia:', error);
                return res.status(500).json({ error: 'Error al registrar la materia' });
            }

            const nuevaMateria = {
                MAT_ID: results.insertId,
                MAT_NOMBRE,
                MAT_DESCRIPCION,
                MAT_GRA_ID,
                MAT_STATUS,
                tipo_contenido: 9,
                titulo: MAT_NOMBRE,
                operation: 'insert'
            };

            // Emitir evento por socket para que los clientes se actualicen
            if (req.io) {
                req.io.to('global-room').emit('new-upload', nuevaMateria);
            }

            res.status(201).json(nuevaMateria);
        });
    } catch (error) {
        console.error('Error general al añadir materia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
