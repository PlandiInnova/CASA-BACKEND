const path = require('path');
const fs = require('fs');

const BASE_DIR =
  process.env.NODE_ENV === 'production'
    ? path.join(process.env.UPLOAD_BASE_PATH || '/var/www/html', 'productos')
    : path.resolve(__dirname, '../../../../var/www/html/productos');

/**
 * Obtiene la ruta absoluta del directorio a partir de PRO_FILES.
 * Ej: "/productos/generador-de-interrogacion" -> ruta absolata a esa carpeta.
 * @param {string} proFiles - Valor de PRO_FILES (ej: "/productos/generador-de-interrogacion")
 * @returns {string|null} Ruta absoluta del directorio o null si no es válido
 */
function getDirFromProFiles(proFiles) {
  if (!proFiles || typeof proFiles !== 'string') return null;
  const slug = proFiles.replace(/^\/productos\/?/, '').trim();
  if (!slug) return null;
  return path.join(BASE_DIR, slug);
}

/**
 * Lista todos los archivos (y carpetas) que hay dentro de la carpeta del producto.
 * La ruta base es la de productos; se le anida el slug que viene en PRO_FILES.
 * Ej: PRO_FILES = "/productos/generador-de-interrogacion" -> archivos dentro de esa carpeta.
 * @param {string} proFiles - Valor de PRO_FILES (ej: "/productos/generador-de-interrogacion")
 * @returns {string[]} Nombres de archivos/carpetas en ese directorio, o [] si no existe o hay error
 */
function getArchivosEnCarpeta(proFiles) {
  if (!proFiles || typeof proFiles !== 'string') return [];
  const dir = getDirFromProFiles(proFiles);
  if (!dir) return [];
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

/**
 * Lista los archivos con información básica (nombre, es directorio, tamaño si es archivo).
 * @param {string} proFiles - Valor de PRO_FILES (ej: "/productos/generador-de-interrogacion")
 * @returns {Array<{ name: string, isDirectory: boolean, size?: number }>}
 */
function getArchivosConInfo(proFiles) {
  if (!proFiles || typeof proFiles !== 'string') return [];
  const dir = getDirFromProFiles(proFiles);
  if (!dir || !fs.existsSync(dir)) return [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.map((e) => {
      const info = { name: e.name, isDirectory: e.isDirectory() };
      if (!e.isDirectory()) {
        try {
          const fullPath = path.join(dir, e.name);
          info.size = fs.statSync(fullPath).size;
        } catch {
          info.size = 0;
        }
      }
      return info;
    });
  } catch {
    return [];
  }
}

module.exports = {
  BASE_DIR,
  getDirFromProFiles,
  getArchivosEnCarpeta,
  getArchivosConInfo,
};
