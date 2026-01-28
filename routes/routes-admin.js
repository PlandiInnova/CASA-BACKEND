const express = require('express');
const router = express.Router();

const filtros = require('../controllers/ADMIN/multimedia/filtros.controllers');
const multimedia = require('../controllers/ADMIN/multimedia/multimedia.controller');
const uploadController = require('../controllers/ADMIN/multimedia/upload.controller');
const uploadProd = require('../controllers/ADMIN/multimedia/uploadprod.controllers');
const { getProductos, updateProducto, addFilesToProducto, deleteFileFromProducto }  = require('../controllers/ADMIN/multimedia/viewProductos.controller');

module.exports = () => {

    router.get('/filter-grados', filtros.getGradosFilter);
    router.get('/filter-subtipos', filtros.getSubtipoFilter);

    router.get('/multimedia', multimedia.getMultimedia);

    router.get('/productos', getProductos);
    router.put('/productos/:id', updateProducto);
    router.post('/productos/:id/archivos', addFilesToProducto);
    router.delete('/productos/:id/archivos/:filename', deleteFileFromProducto);

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
    
            // Tipos que manejan archivos simples (todos usan el campo 'archivo' en FormData)
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

    return router;
}