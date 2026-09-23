-- =============================================================================
-- Eliminación de procedimientos sin uso  (SOLO ADMIN Y VENTAS)
--
-- Alcance deliberado: aquí únicamente se tocan procedimientos que pertenecen al
-- panel de administración y al de ventas. El portal docente (casa-web) y el
-- launcher NO se tocan, aunque también tengan procedimientos sin uso.
--
-- Ninguno de los dos de abajo se llama ya desde el código. Sus definiciones
-- están en procedimientos_eliminados_RESPALDO.sql: si hiciera falta volver
-- atrás, basta ejecutar ese archivo.
--
-- ORDEN DE APLICACIÓN: primero se sube el código, después este script. Al revés,
-- el backend en vivo llamaría a un procedimiento que ya no existe.
-- =============================================================================

-- ADMIN. Su consulta vive en ADMIN/multimedia/multimedia.controller.js,
-- resolviendo el semestre por la materia del contenido y no por MUL_GRA_ID.
DROP PROCEDURE IF EXISTS ObtenerMultimedia;

-- VENTAS. El listado usa su propia consulta en ventas.controller.js.
DROP PROCEDURE IF EXISTS mostrarVentas;


-- =============================================================================
-- NO se eliminan (son del portal docente, fuera de alcance)
--
--   mostrarMaterias                 el portal lo dejó de llamar, pero se queda
--   mostrarMateriasPorLicenciaGrado igual
--   sp_existe_licencia              igual
--   mostrarMultimediaVideos         duplicado de mostrarPorTipoMultimedia
--
-- Quedan como código muerto en la base a propósito. Si algún día se limpian,
-- va aparte y con el portal en mano.
-- =============================================================================
