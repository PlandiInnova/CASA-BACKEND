-- =============================================================================
-- ELIMINAR ÍNDICES DE CAS_LICENCIA
-- Ejecutar en tu base de datos MySQL/MariaDB para eliminar los índices creados
-- =============================================================================

-- IMPORTANTE: Solo elimina los índices que realmente creaste.
-- Si intentas eliminar un índice que no existe, obtendrás un error.

-- 1. Eliminar índice para JOIN con CAS_USUARIO_ADMIN
DROP INDEX idx_lic_uad_id ON CAS_LICENCIA;

-- 2. Eliminar índice para JOIN con CAS_VENTA
DROP INDEX idx_lic_ven_id ON CAS_LICENCIA;

-- 3. Eliminar índice para JOIN con CAS_PAQUETE
DROP INDEX idx_lic_paq_id ON CAS_LICENCIA;

-- 4. Eliminar índice para JOIN con CAS_PEDIDO
DROP INDEX idx_lic_pdd_id ON CAS_LICENCIA;

-- 5. Eliminar índice compuesto para ORDER BY + status
DROP INDEX idx_lic_id_status ON CAS_LICENCIA;

-- 6. Eliminar índice para filtros por fecha de inicio
DROP INDEX idx_lic_fecha_inicio ON CAS_LICENCIA;

-- 7. Eliminar índice para filtros por fecha de fin
DROP INDEX idx_lic_fecha_fin ON CAS_LICENCIA;

-- 8. Eliminar índice para filtros por status
DROP INDEX idx_lic_status ON CAS_LICENCIA;

-- 9. Eliminar índice compuesto usuario + status
DROP INDEX idx_lic_uad_status ON CAS_LICENCIA;

-- 10. Eliminar índice para búsqueda por código de licencia
DROP INDEX idx_lic_licencia ON CAS_LICENCIA;

-- =============================================================================
-- VERIFICACIÓN: Ver índices restantes después de eliminar
-- =============================================================================
-- Ejecutar para ver todos los índices de CAS_LICENCIA:
-- SHOW INDEX FROM CAS_LICENCIA;

-- =============================================================================
-- NOTAS:
-- =============================================================================
-- 1. Si un índice no existe, obtendrás un error. Puedes usar IF EXISTS (MySQL 5.7.4+):
--    DROP INDEX IF EXISTS idx_lic_uad_id ON CAS_LICENCIA;
--
-- 2. El índice PRIMARY KEY (LIC_ID) NO se puede eliminar con DROP INDEX.
--    Para eliminarlo necesitarías: ALTER TABLE CAS_LICENCIA DROP PRIMARY KEY;
--    (NO recomendado a menos que sepas lo que haces)
--
-- 3. Después de eliminar índices, las consultas pueden volverse más lentas.
--    Solo elimínalos si realmente necesitas hacerlo.
