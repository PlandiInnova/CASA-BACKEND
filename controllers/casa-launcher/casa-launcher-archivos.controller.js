const { getArchivosEnCarpeta } = require('../ADMIN/multimedia/productosFiles');

/**
 * Archivos de la carpeta de un producto, para que el launcher arme la descarga.
 * Query: pro_files (valor de PRO_FILES, ej: "/productos/cronos")
 */
exports.getArchivosProducto = (req, res) => {
    try {
        const proFiles = req.query.pro_files;

        if (!proFiles || typeof proFiles !== 'string') {
            return res.status(400).json({
                detalle: 'Query pro_files es requerido (ej: ?pro_files=/productos/cronos)'
            });
        }

        return res.json({
            pro_files: proFiles,
            archivos: getArchivosEnCarpeta(proFiles)
        });
    } catch (error) {
        console.error('[CASA-LAUNCHER ARCHIVOS] Error inesperado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los archivos del producto'
        });
    }
};