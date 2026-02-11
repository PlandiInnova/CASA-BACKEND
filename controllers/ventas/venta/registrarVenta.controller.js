/**
 * Registra una venta en CAS_VENTA (VEN_NOMBRE, VEN_TIPO).
 * Body: { nombre, tipo, id_usuario }
 * Emite evento Socket.IO 'venta-nueva' para actualización en tiempo real.
 */
exports.registrarVenta = (req, res) => {
    try {
        const { nombre, tipo, id_usuario } = req.body;

        if (!nombre || nombre.toString().trim() === '') {
            return res.status(400).json({
                success: false,
                status: 'BAD_REQUEST',
                message: 'El campo nombre es requerido'
            });
        }
        if (!tipo || tipo.toString().trim() === '') {
            return res.status(400).json({
                success: false,
                status: 'BAD_REQUEST',
                message: 'El campo tipo es requerido'
            });
        }
        if (!id_usuario || id_usuario.toString().trim() === '') {
            return res.status(400).json({
                success: false,
                status: 'BAD_REQUEST',
                message: 'El campo id_usuario es requerido'
            });
        }

        const nombreVal = nombre.toString().trim().substring(0, 100);
        const tipoVal = tipo.toString().trim().substring(0, 100);
        const id_usuarioVal = id_usuario.toString().trim().substring(0, 100);
        const fecha_registro = new Date().toISOString().slice(0, 10);

        console.log(nombreVal, tipoVal, fecha_registro, id_usuarioVal);

        req.db.query(
            'INSERT INTO CAS_VENTA (VEN_NOMBRE, VEN_TIPO, VEN_FECHA_REGISTRO, VEN_UAD_ID) VALUES (?, ?, ?, ?)',
            [nombreVal, tipoVal, fecha_registro, id_usuarioVal],
            (error, result) => {
                if (error) {
                    console.error('Error al registrar venta:', error);
                    return res.status(500).json({
                        success: false,
                        status: 'ERROR',
                        message: 'Error al registrar la venta'
                    });
                }

                const ventaId = result.insertId;

                // Obtener el nombre del usuario para el evento Socket.IO
                req.db.query(
                    `SELECT 
                        v.VEN_ID AS id,
                        v.VEN_NOMBRE AS nombre,
                        v.VEN_TIPO AS tipo,
                        v.VEN_FECHA_REGISTRO AS fechaRegistro,
                        COALESCE(u.UAD_NOMBRE, 'Sin usuario') AS usuarioNombre,
                        v.VEN_UAD_ID AS uadId
                    FROM CAS_VENTA v
                    LEFT JOIN CAS_USUARIO_ADMIN u ON v.VEN_UAD_ID = u.UAD_ID
                    WHERE v.VEN_ID = ?`,
                    [ventaId],
                    (err, rows) => {
                        const ventaCompleta = rows && rows[0] ? rows[0] : {
                            id: ventaId,
                            nombre: nombreVal,
                            tipo: tipoVal,
                            fechaRegistro: fecha_registro,
                            usuarioNombre: 'Sin usuario',
                            uadId: id_usuarioVal
                        };

                        // Emitir evento Socket.IO para actualización en tiempo real
                        if (req.io) {
                            req.io.emit('venta-nueva', {
                                success: true,
                                venta: ventaCompleta
                            });
                        }

                        res.status(201).json({
                            success: true,
                            message: 'Venta registrada correctamente',
                            data: ventaCompleta
                        });
                    }
                );
            }
        );
    } catch (err) {
        console.error('Error en registrarVenta:', err);
        res.status(500).json({
            success: false,
            status: 'ERROR',
            message: 'Error en el servidor'
        });
    }
};
