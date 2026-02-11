const { fetchDistribucion } = require('./licenciasDistribucion.controller');

/**
 * Actualiza el status de una licencia en CAS_LICENCIA.
 * PUT /licencias/:id/status
 * Body: { status }
 * Emite evento Socket.IO 'licencia-status-actualizado' para actualización en tiempo real.
 */
exports.updateLicenciaStatus = (req, res) => {
    try {
        const licenciaId = req.params.id;
        const { status } = req.body;

        if (!licenciaId || isNaN(Number(licenciaId))) {
            return res.status(400).json({
                success: false,
                status: 'BAD_REQUEST',
                message: 'ID de licencia inválido'
            });
        }

        if (status === undefined || status === null) {
            return res.status(400).json({
                success: false,
                status: 'BAD_REQUEST',
                message: 'El campo status es requerido'
            });
        }

        const statusVal = Number(status);
        if (isNaN(statusVal) || !Number.isInteger(statusVal)) {
            return res.status(400).json({
                success: false,
                status: 'BAD_REQUEST',
                message: 'El campo status debe ser un número entero'
            });
        }

        // Verificar que la licencia existe antes de actualizar
        req.db.query(
            'SELECT LIC_ID FROM CAS_LICENCIA WHERE LIC_ID = ?',
            [licenciaId],
            (error, rows) => {
                if (error) {
                    console.error('Error al verificar licencia:', error);
                    return res.status(500).json({
                        success: false,
                        status: 'ERROR',
                        message: 'Error al verificar licencia'
                    });
                }

                if (!rows || rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        status: 'NOT_FOUND',
                        message: 'Licencia no encontrada'
                    });
                }

                // Actualizar el status
                req.db.query(
                    'UPDATE CAS_LICENCIA SET LIC_STATUS = ? WHERE LIC_ID = ?',
                    [statusVal, licenciaId],
                    (updateError, result) => {
                        if (updateError) {
                            console.error('Error al actualizar status de licencia:', updateError);
                            return res.status(500).json({
                                success: false,
                                status: 'ERROR',
                                message: 'Error al actualizar el status de la licencia'
                            });
                        }

                        // Obtener la licencia actualizada con información completa para Socket.IO
                        req.db.query(
                            `SELECT 
                                l.LIC_ID AS id,
                                l.LIC_LICENCIA AS licencia,
                                l.LIC_INDICIO AS indicio,
                                l.LIC_FECHA_INICIO AS fechaInicio,
                                l.LIC_FECHA_FIN AS fechaFin,
                                l.LIC_TIEMPO AS tiempo,
                                l.LIC_NUM_LICENCIAS AS numLicencias,
                                l.LIC_NUM_CARACTERES AS numCaracteres,
                                l.LIC_STATUS AS status,
                                l.LIC_TIPO AS tipo,
                                COALESCE(u.UAD_NOMBRE, 'Sin usuario') AS usuarioNombre,
                                l.LIC_UAD_ID AS uadId,
                                COALESCE(v.VEN_NOMBRE, 'Sin tipo de venta') AS tipoVentaNombre,
                                l.LIC_VEN_ID AS venId,
                                COALESCE(paq.PAQ_NOMBRE, 'Sin paquete') AS paqueteNombre,
                                l.LIC_PAQ_ID AS paqId,
                                ped.PDD_BITACORA AS pedidoBitacora,
                                ped.PDD_SISTEMA AS pedidoSistema,
                                ped.PDD_SOLICITANTE AS pedidoSolicitante,
                                l.LIC_PDD_ID AS pedidoId
                            FROM CAS_LICENCIA l
                            LEFT JOIN CAS_USUARIO_ADMIN u ON l.LIC_UAD_ID = u.UAD_ID
                            LEFT JOIN CAS_VENTA v ON l.LIC_VEN_ID = v.VEN_ID
                            LEFT JOIN CAS_PAQUETE paq ON l.LIC_PAQ_ID = paq.PAQ_ID
                            LEFT JOIN CAS_PEDIDO ped ON l.LIC_PDD_ID = ped.PDD_ID
                            WHERE l.LIC_ID = ?`,
                            [licenciaId],
                            (selectError, licenciaRows) => {
                                const licenciaActualizada = licenciaRows && licenciaRows[0] 
                                    ? licenciaRows[0] 
                                    : { id: licenciaId, status: statusVal };

                                // Emitir evento Socket.IO para actualización en tiempo real
                                if (req.io) {
                                    req.io.emit('licencia-status-actualizado', {
                                        success: true,
                                        licencia: licenciaActualizada,
                                        mensaje: `Status de licencia ${licenciaId} actualizado a ${statusVal}`
                                    });
                                    // Emitir distribución actualizada (dashboard por estado)
                                    fetchDistribucion(req.db, (errDist, dist) => {
                                        if (!errDist && dist) {
                                            req.io.emit('licencias-distribucion-actualizada', dist);
                                        }
                                    });
                                }

                                res.status(200).json({
                                    success: true,
                                    message: 'Status de licencia actualizado correctamente',
                                    data: licenciaActualizada
                                });
                            }
                        );
                    }
                );
            }
        );
    } catch (err) {
        console.error('Error en updateLicenciaStatus:', err);
        res.status(500).json({
            success: false,
            status: 'ERROR',
            message: 'Error en el servidor'
        });
    }
};
