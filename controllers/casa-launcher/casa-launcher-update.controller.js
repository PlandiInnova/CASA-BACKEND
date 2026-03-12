const { log } = require('console');
const fs = require('fs');
const path = require('path');

const ACTUALIZACIONES_FOLDER = 'actualizaciones';
const LATEST_YML = 'latest.yml';

function getBasePath() {
    return process.env.NODE_ENV === 'production'
        ? (process.env.UPLOAD_BASE_PATH || '/var/www/html')
        : path.resolve(__dirname, '../../../var/www/html');
}

function parseLatestYml(content) {
    const versionMatch = content.match(/^version:\s*(.+)$/m);
    const fileUrlMatch = content.match(/^\s+-\s+url:\s*(.+)$/m);
    const sha512Match = content.match(/^sha512:\s*(.+)$/m);
    const releaseDateMatch = content.match(/^releaseDate:\s*'?(.+?)'?$/m);

    return {
        version: versionMatch ? versionMatch[1].trim() : null,
        fileName: fileUrlMatch ? fileUrlMatch[1].trim() : null,
        sha512: sha512Match ? sha512Match[1].trim() : null,
        releaseDate: releaseDateMatch ? releaseDateMatch[1].trim() : null,
    };
}

exports.getLauncherUpdateInfo = (req, res) => {
    log('[CASA-LAUNCHER UPDATE] Solicitud de información de actualización recibida');
    try {
        const ymlPath = path.join(getBasePath(), ACTUALIZACIONES_FOLDER, LATEST_YML);

        if (!fs.existsSync(ymlPath)) {
            return res.status(404).json({
                success: false,
                message: 'Archivo latest.yml no encontrado en el servidor',
            });
        }

        const { version, fileName, sha512, releaseDate } = parseLatestYml(
            fs.readFileSync(ymlPath, 'utf8')
        );

        if (!fileName) {
            return res.status(500).json({
                success: false,
                message: 'No se pudo determinar el nombre del archivo desde latest.yml',
            });
        }

        const downloadPath = `/FILES/static/${ACTUALIZACIONES_FOLDER}/${encodeURIComponent(fileName)}`;

        return res.json({
            success: true,
            data: { version, fileName, downloadPath, sha512, releaseDate },
        });
    } catch (error) {
        console.error('[CASA-LAUNCHER UPDATE] Error al obtener info de actualización:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al obtener la información de actualización',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};