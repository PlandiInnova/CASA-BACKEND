const express = require('express');
const router = express.Router();

const filtros = require('../controllers/ADMIN/multimedia/filtros.controllers');
const multimedia = require('../controllers/ADMIN/multimedia/multimedia.controller');
const uploadController = require('../controllers/ADMIN/multimedia/upload.controller');
const uploadProd = require('../controllers/ADMIN/multimedia/uploadprod.controllers');
const { getProductos, updateProducto, addFilesToProducto, deleteFileFromProducto }  = require('../controllers/ADMIN/multimedia/viewProductos.controller');
const { deleteMultimedia } = require('../controllers/ADMIN/multimedia/deleteMultimedia.controller');
const { deleteProducto } = require('../controllers/ADMIN/multimedia/deleteProducto.controller');
const { updateStatus } = require('../controllers/ADMIN/multimedia/updateStatus.controller');
const { registrarVenta } = require('../controllers/ventas/venta/registrarVenta.controller');
const { getTiposVenta } = require('../controllers/ventas/venta/tiposVenta.controller');
const { getVentas } = require('../controllers/ventas/venta/ventas.controller');
const { registrarPaquete } = require('../controllers/ventas/paquete/registrarPaquete.controller');
const { getPaquetes } = require('../controllers/ventas/paquete/paquetes.controller');
const { getPaquetesCompletos } = require('../controllers/ventas/paquete/paquetesCompletos.controller');
const { generarLicencias } = require('../controllers/ventas/licencia/generarLicencias.controller');
const { getPedidosCompletos } = require('../controllers/ventas/pedido/pedidosCompletos.controller');

module.exports = () => {

    router.post('/registrar-venta', registrarVenta);
    router.get('/tipos-venta', getTiposVenta);
    router.get('/ventas', getVentas);

    router.post('/registrar-paquete', registrarPaquete);
    router.get('/paquetes', getPaquetes);
    router.get('/paquetes-completos', getPaquetesCompletos);

    router.post('/licencias', generarLicencias);
    router.get('/pedidos-completos', getPedidosCompletos);

    router.get('/filter-grados', filtros.getGradosFilter);
    router.get('/filter-subtipos', filtros.getSubtipoFilter);

    router.get('/update-status', updateStatus);

    router.get('/productos', getProductos);
    router.put('/productos/:id', updateProducto);
    router.post('/productos/:id/archivos', addFilesToProducto);
    router.delete('/productos/:id/archivos/:filename', deleteFileFromProducto);
    router.delete('/delete-productos/:id', deleteProducto);

    router.post('/upload',
        (req, res, next) => {
            const tipo = req.query.type;
    
            if (!tipo) {
                return res.status(400).json({
                    error: 'Tipo de contenido requerido',
                    detalle: 'Debes especificar el tipo de contenido en el query parameter ?type='
                });
            }
    
            const tipoStr = tipo.toString();
            console.log('📤 Tipo de contenido recibido:', tipoStr);
    
            const fileTypes = ['Audios', 'Word', 'Excel', 'PDF'];
            
            if (fileTypes.includes(tipoStr)) {
                uploadController.uploadFile(req, res, (err) => {
                    if (err) {
                        return res.status(400).json({
                            error: err.message || 'Error al procesar el archivo',
                            detalle: err.message
                        });
                    }
                    next();
                });
            } else {
                // Para Videos y otros tipos: usar handleFormData (puede tener URL de YouTube o archivo)
                uploadController.handleFormData(req, res, (err) => {
                    if (err) {
                        return res.status(400).json({
                            error: err.message || 'Error al procesar el formulario',
                            detalle: err.message
                        });
                    }
                    next();
                });
            }
        },
        uploadController.handleUpload
    );

    router.post('/upload-prod', uploadProd.uploadProd);

    router.get('/multimedia', multimedia.getMultimedia);
    router.delete('/delete-multimedia', deleteMultimedia);

    return router;
}