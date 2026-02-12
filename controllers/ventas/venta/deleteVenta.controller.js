/**
 * Elimina una venta de CAS_VENTA.
 * DELETE /ventas/:id
 * Emite evento Socket.IO 'venta-eliminada' para actualización en tiempo real.
 */
exports.deleteVenta = (req, res) => {
    try {
        const ventaId = req.params.id;

        if (!ventaId || isNaN(Number(ventaId))) {
            return res.status(400).json({
                success: false,
                status: 'BAD_REQUEST',
                message: 'ID de venta inválido'
            });
        }

        // Verificar que la venta existe antes de eliminar
        req.db.query('SELECT VEN_ID FROM CAS_VENTA WHERE VEN_ID = ?', [ventaId], (error, rows) => {
            if (error) {
                console.error('Error al verificar venta:', error);
                return res.status(500).json({
                    success: false,
                    status: 'ERROR',
                    message: 'Error al verificar venta'
                });
            }

            if (!rows || rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    status: 'NOT_FOUND',
                    message: 'Venta no encontrada'
                });
            }

            req.db.query('DELETE FROM CAS_VENTA WHERE VEN_ID = ?', [ventaId], (deleteError, result) => {
                if (deleteError) {
                    console.error('Error al eliminar venta:', deleteError);
                    return res.status(500).json({
                        success: false,
                        status: 'ERROR',
                        message: deleteError.code === 'ER_ROW_IS_REFERENCED_2' || deleteError.errno === 1451
                            ? 'No se puede eliminar: la venta tiene licencias asociadas'
                            : 'Error al eliminar la venta'
                    });
                }

                // Emitir evento Socket.IO para actualización en tiempo real
                if (req.io) {
                    req.io.emit('venta-eliminada', {
                        success: true,
                        id: Number(ventaId),
                        mensaje: `Venta ${ventaId} eliminada`
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Venta eliminada correctamente',
                    data: { id: Number(ventaId) }
                });
            });
        });
    } catch (err) {
        console.error('Error en deleteVenta:', err);
        res.status(500).json({
            success: false,
            status: 'ERROR',
            message: 'Error en el servidor'
        });
    }
};
