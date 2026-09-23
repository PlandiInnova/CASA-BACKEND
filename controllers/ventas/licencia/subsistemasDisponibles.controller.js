const { listarDisponibles } = require('./subsistemasLicencia');

/**
 * GET /casa/admin/subsistemas-disponibles?paquete=5
 *
 * Subsistemas que el formulario de licencias puede ofrecer para marcar.
 * Salen del contenido, no del catálogo entero: un subsistema sin productos
 * no aparece, así no se puede emitir una licencia que diga abarcarlo.
 *
 * Sin el parámetro `paquete` responde con los del catálogo completo, que es
 * lo que otorgan las licencias PRESENTACIONES y GENERICA.
 */
exports.getSubsistemasDisponibles = (req, res) => {
    const bruto = req.query.paquete;
    const paqId = bruto == null || bruto === '' ? null : parseInt(bruto, 10);

    if (bruto != null && bruto !== '' && (!Number.isInteger(paqId) || paqId <= 0)) {
        return res.status(400).json({ error: 'El parámetro paquete debe ser un id válido' });
    }

    listarDisponibles(req.db, paqId, (error, subsistemas) => {
        if (error) {
            console.error('Error al obtener los subsistemas disponibles:', error);
            return res.status(500).json({ error: 'Error al obtener los subsistemas disponibles' });
        }
        res.json(subsistemas);
    });
};
