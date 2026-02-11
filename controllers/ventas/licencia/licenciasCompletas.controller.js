/**
 * Lista todas las licencias desde CAS_LICENCIA con información completa:
 * - Nombre del usuario (JOIN con CAS_USUARIO_ADMIN)
 * - Nombre del tipo de venta (JOIN con CAS_VENTA)
 * - Nombre del paquete (JOIN con CAS_PAQUETE)
 * - Información del pedido (JOIN con CAS_PEDIDO)
 * GET /licencias-completas -> [{ id, licencia, indicio, fechaInicio, fechaFin, tipoVentaNombre, paqueteNombre, pedidoInfo, usuarioNombre, ... }, ...]
 */
exports.getLicenciasCompletas = (req, res) => {
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
        ORDER BY l.LIC_ID DESC`,
        [],
        (error, rows) => {
            if (error) {
                console.error('Error al obtener licencias completas:', error);
                return res.status(500).json({
                    success: false,
                    status: 'ERROR',
                    message: 'Error al obtener licencias'
                });
            }
            res.status(200).json(Array.isArray(rows) ? rows : []);
        }
    );
};
