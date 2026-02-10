/**
 * Genera N licencias en CAS_LICENCIA vía procedimiento almacenado.
 * Soporta cantidades masivas con tope 400.000.
 * Progreso en tiempo real por Socket.IO si se envía sessionId en el body.
 *
 * Body: tipoVenta, tipoLicencia, indicio, fechaInicio, cantidadLicencias, paquete,
 *       tiempoDias, fechaVencimiento, cantidadCaracteres, pedidoBitacora, solicitante,
 *       [uadId] (opcional, por defecto 1), [sessionId]
 *
 * Socket (progreso en tiempo real):
 * - Frontend debe unirse a la sala: socket.emit('join-license-room', sessionId)
 * - Eventos emitidos a esa sala: licencias-inicio, licencias-progreso, licencias-fin, licencias-error
 */

const TOPE_MAXIMO = 400000;
const TAMANO_LOTE = 10000;

/** Convierte ISO o cualquier fecha a YYYY-MM-DD para MySQL DATE. */
function toDateOnly(value) {
    if (value == null || value === '') return null;
    const s = value.toString().trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

exports.generarLicencias = (req, res) => {
    try {
        const {
            tipoVenta,
            tipoLicencia,
            indicio,
            fechaInicio,
            cantidadLicencias,
            paquete,
            tiempoDias,
            fechaVencimiento,
            cantidadCaracteres,
            pedidoBitacora,
            solicitante,
            uadId,
            sessionId
        } = req.body;

        const roomId = (sessionId && typeof sessionId === 'string' && sessionId.trim()) ? sessionId.trim() : null;
        const emitProgress = roomId && req.io;

        if (!tipoVenta || tipoVenta.toString().trim() === '') {
            return res.status(400).json({
                success: false,
                status: 'BAD_REQUEST',
                message: 'El campo tipoVenta es requerido'
            });
        }

        const cantidadSolicitada = Number(cantidadLicencias) || 0;
        if (cantidadSolicitada <= 0) {
            return res.status(400).json({
                success: false,
                status: 'BAD_REQUEST',
                message: 'cantidadLicencias debe ser un número mayor a 0'
            });
        }

        const cantidad = Math.min(cantidadSolicitada, TOPE_MAXIMO);
        const paqId = paquete != null && paquete !== '' ? Number(paquete) : null;
        const tiempo = tiempoDias != null && tiempoDias !== '' ? Number(tiempoDias) : null;
        const numCaracteres = cantidadCaracteres != null && cantidadCaracteres !== '' ? Number(cantidadCaracteres) : null;
        const fechaIni = toDateOnly(fechaInicio);
        const fechaFin = toDateOnly(fechaVencimiento);

        const indicioStr = (indicio != null && indicio !== '') ? indicio.toString().trim().substring(0, 12) : '';
        const tipoVentaStr = tipoVenta.toString().trim().substring(0, 45);
        const tipoLicenciaStr = (tipoLicencia != null && tipoLicencia !== '') 
            ? tipoLicencia.toString().trim().substring(0, 45) 
            : tipoVentaStr;
        
        const bitacora = (pedidoBitacora != null && pedidoBitacora !== '') ? Number(pedidoBitacora) : null;
        const solicitanteStr = (solicitante != null && solicitante !== '') 
            ? solicitante.toString().trim().substring(0, 100) 
            : '';
        
        const licUadId = (uadId != null && uadId !== '') 
            ? Number(uadId) 
            : ((req.user && (req.user.userId ?? req.user.id)) || 1);

        const resolveVenId = (cb) => {
            const num = Number(tipoVenta);
            if (!Number.isNaN(num) && Number.isInteger(num) && num > 0) {
                return cb(null, num);
            }
            req.db.query(
                'SELECT VEN_ID FROM CAS_VENTA WHERE VEN_TIPO = ? OR VEN_NOMBRE = ? LIMIT 1',
                [tipoVentaStr, tipoVentaStr],
                (error, rows) => {
                    if (error) return cb(error, null);
                    const id = rows && rows[0] ? rows[0].VEN_ID : null;
                    cb(null, id);
                }
            );
        };

        resolveVenId((err, licVenId) => {
            if (err) {
                console.error('Error al resolver LIC_VEN_ID:', err);
                return res.status(500).json({
                    success: false,
                    status: 'ERROR',
                    message: 'Error al resolver tipo de venta'
                });
            }

            const fechaRegistroPedido = new Date().toISOString().slice(0, 10);

            const insertarPedido = (cb) => {
                if (bitacora == null && solicitanteStr === '') {
                    return cb(null, null);
                }
                
                req.db.query(
                    'CALL sp_insertar_pedido(?, ?, ?, ?)',
                    [bitacora, solicitanteStr, licUadId, fechaRegistroPedido],
                    (error, results) => {
                        if (error) {
                            console.error('Error al insertar pedido:', error);
                            return cb(error, null);
                        }
                        let filas = [];
                        if (Array.isArray(results) && results.length > 0) {
                            filas = Array.isArray(results[0]) ? results[0] : results;
                        }
                        const pddId = filas && filas[0] ? filas[0].pdd_id : null;
                        cb(null, pddId);
                    }
                );
            };

            const emitirPedidoNuevo = (pddId, done) => {
                if (!pddId || !req.io) return done();
                req.db.query(
                    `SELECT 
                        p.PDD_ID AS id,
                        p.PDD_BITACORA AS bitacora,
                        p.PDD_SISTEMA AS sistema,
                        p.PDD_SOLICITANTE AS solicitante,
                        p.PPD_FECHA_REGISTRO AS fechaRegistro,
                        COALESCE(u.UAD_NOMBRE, 'Sin usuario') AS usuarioNombre,
                        p.PDD_UAD_ID AS uadId
                    FROM CAS_PEDIDO p
                    LEFT JOIN CAS_USUARIO_ADMIN u ON p.PDD_UAD_ID = u.UAD_ID
                    WHERE p.PDD_ID = ?`,
                    [pddId],
                    (err, rows) => {
                        if (!err && rows && rows[0]) {
                            req.io.emit('pedido-nuevo', { success: true, pedido: rows[0] });
                        }
                        done();
                    }
                );
            };

            insertarPedido((errPedido, pddId) => {
                if (errPedido) {
                    return res.status(500).json({
                        success: false,
                        status: 'ERROR',
                        message: 'Error al crear pedido',
                        detalle: errPedido.message
                    });
                }

                emitirPedidoNuevo(pddId, () => {});

                const sqlCall = 'CALL sp_generar_licencias_batch(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                const params = [
                    indicioStr,
                    licVenId,
                    fechaIni,
                    fechaFin,
                    paqId,
                    tiempo,
                    numCaracteres,
                    licUadId,
                    tipoVentaStr,
                    tipoLicenciaStr,
                    pddId,
                    0
                ];

            const licenciasGeneradas = [];
            let offset = 0;
            let errorGlobal = null;

            if (emitProgress) {
                req.io.to(roomId).emit('licencias-inicio', {
                    total: cantidad,
                    mensaje: `Generando ${cantidad} licencia(s)...`
                });
            }

            const ejecutarSiguienteLote = () => {
                if (offset >= cantidad) {
                    if (errorGlobal) {
                        if (emitProgress) {
                            req.io.to(roomId).emit('licencias-error', {
                                message: errorGlobal.message || 'Error al generar licencias'
                            });
                        }
                        return res.status(500).json({
                            success: false,
                            status: 'ERROR',
                            message: 'Error al generar licencias',
                            detalle: errorGlobal.message
                        });
                    }
                    if (emitProgress) {
                        req.io.to(roomId).emit('licencias-fin', {
                            success: true,
                            cantidad: licenciasGeneradas.length,
                            mensaje: `Se generaron ${licenciasGeneradas.length} licencia(s)`
                        });
                    }
                    return res.status(201).json({
                        success: true,
                        message: `Se generaron ${licenciasGeneradas.length} licencia(s)`,
                        data: {
                            cantidad: licenciasGeneradas.length,
                            licencias: licenciasGeneradas
                        }
                    });
                }

                const lote = Math.min(TAMANO_LOTE, cantidad - offset);
                params[11] = lote;

                req.db.query(sqlCall, params, (error, results) => {
                    if (error) {
                        errorGlobal = error;
                        console.error('Error en sp_generar_licencias_batch:', error);
                        offset = cantidad;
                        return ejecutarSiguienteLote();
                    }

                    let filas = [];
                    if (Array.isArray(results) && results.length > 0) {
                        filas = Array.isArray(results[0]) ? results[0] : results;
                    }
                    filas.forEach(row => {
                        licenciasGeneradas.push({
                            id: row.id,
                            licencia: row.licencia
                        });
                    });

                    offset += lote;

                    if (emitProgress) {
                        const generadas = licenciasGeneradas.length;
                        const porcentaje = cantidad > 0 ? Math.round((100 * generadas) / cantidad) : 100;
                        req.io.to(roomId).emit('licencias-progreso', {
                            total: cantidad,
                            generadas,
                            porcentaje,
                            mensaje: `${generadas} / ${cantidad} (${porcentaje}%)`
                        });
                    }

                    ejecutarSiguienteLote();
                });
            };

            ejecutarSiguienteLote();
            });
        });
    } catch (err) {
        console.error('Error en generarLicencias:', err);
        res.status(500).json({
            success: false,
            status: 'ERROR',
            message: 'Error en el servidor'
        });
    }
};
