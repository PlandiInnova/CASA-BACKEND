/**
 * Elimina un paquete de CAS_PAQUETE.
 * DELETE /paquetes/:id
 * Emite evento Socket.IO 'paquete-eliminado' para actualización en tiempo real.
 */
exports.deletePaquete = (req, res) => {
    try {
        const paqueteId = req.params.id;

        if (!paqueteId || isNaN(Number(paqueteId))) {
            return res.status(400).json({
                success: false,
                status: 'BAD_REQUEST',
                message: 'ID de paquete inválido'
            });
        }

        // Verificar que el paquete existe antes de eliminar
        req.db.query('SELECT PAQ_ID FROM CAS_PAQUETE WHERE PAQ_ID = ?', [paqueteId], (error, rows) => {
            if (error) {
                console.error('Error al verificar paquete:', error);
                return res.status(500).json({
                    success: false,
                    status: 'ERROR',
                    message: 'Error al verificar paquete'
                });
            }

            if (!rows || rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    status: 'NOT_FOUND',
                    message: 'Paquete no encontrado'
                });
            }

            req.db.query('DELETE FROM CAS_PAQUETE WHERE PAQ_ID = ?', [paqueteId], (deleteError, result) => {
                if (deleteError) {
                    console.error('Error al eliminar paquete:', deleteError);
                    return res.status(500).json({
                        success: false,
                        status: 'ERROR',
                        message: deleteError.code === 'ER_ROW_IS_REFERENCED_2' || deleteError.errno === 1451
                            ? 'No se puede eliminar: el paquete tiene licencias asociadas'
                            : 'Error al eliminar el paquete'
                    });
                }

                // Emitir evento Socket.IO para actualización en tiempo real
                if (req.io) {
                    req.io.emit('paquete-eliminado', {
                        success: true,
                        id: Number(paqueteId),
                        mensaje: `Paquete ${paqueteId} eliminado`
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Paquete eliminado correctamente',
                    data: { id: Number(paqueteId) }
                });
            });
        });
    } catch (err) {
        console.error('Error en deletePaquete:', err);
        res.status(500).json({
            success: false,
            status: 'ERROR',
            message: 'Error en el servidor'
        });
    }
};
