-- =============================================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS DE CAS_LICENCIA
-- Ejecutar en tu base de datos MySQL/MariaDB para mejorar el rendimiento
-- =============================================================================

-- Índices en CAS_LICENCIA para optimizar los JOINs y filtros comunes
-- Estos índices mejoran significativamente el rendimiento cuando hay muchas licencias

-- 1. Índice para JOIN con CAS_USUARIO_ADMIN (LIC_UAD_ID)
-- Útil para: filtros por usuario, JOINs con usuarios
CREATE INDEX idx_lic_uad_id ON CAS_LICENCIA(LIC_UAD_ID);

-- 2. Índice para JOIN con CAS_VENTA (LIC_VEN_ID)
-- Útil para: filtros por tipo de venta, JOINs con ventas
CREATE INDEX idx_lic_ven_id ON CAS_LICENCIA(LIC_VEN_ID);

-- 3. Índice para JOIN con CAS_PAQUETE (LIC_PAQ_ID)
-- Útil para: filtros por paquete, JOINs con paquetes
CREATE INDEX idx_lic_paq_id ON CAS_LICENCIA(LIC_PAQ_ID);

-- 4. Índice para JOIN con CAS_PEDIDO (LIC_PDD_ID)
-- Útil para: filtros por pedido, JOINs con pedidos
CREATE INDEX idx_lic_pdd_id ON CAS_LICENCIA(LIC_PDD_ID);

-- 5. Índice compuesto para ORDER BY + filtros comunes
-- Optimiza: ORDER BY LIC_ID DESC cuando se combina con filtros
-- (LIC_ID ya es PK, pero este índice compuesto ayuda en consultas complejas)
CREATE INDEX idx_lic_id_status ON CAS_LICENCIA(LIC_ID DESC, LIC_STATUS);

-- 6. Índice para filtros por fecha (si filtras por rango de fechas)
-- Útil para: WHERE LIC_FECHA_INICIO BETWEEN ... AND ...
CREATE INDEX idx_lic_fecha_inicio ON CAS_LICENCIA(LIC_FECHA_INICIO);

-- 7. Índice para filtros por fecha de fin (si filtras por vencimiento)
-- Útil para: WHERE LIC_FECHA_FIN BETWEEN ... AND ...
CREATE INDEX idx_lic_fecha_fin ON CAS_LICENCIA(LIC_FECHA_FIN);

-- 8. Índice para filtros por status (muy común)
-- Útil para: WHERE LIC_STATUS = 1 (activas), WHERE LIC_STATUS = 0 (inactivas)
CREATE INDEX idx_lic_status ON CAS_LICENCIA(LIC_STATUS);

-- 9. Índice compuesto para consultas por usuario y status
-- Útil para: WHERE LIC_UAD_ID = ? AND LIC_STATUS = ?
CREATE INDEX idx_lic_uad_status ON CAS_LICENCIA(LIC_UAD_ID, LIC_STATUS);

-- 10. Índice para búsqueda por código de licencia (si buscas por LIC_LICENCIA)
-- Útil para: WHERE LIC_LICENCIA = 'ABC123...'
CREATE INDEX idx_lic_licencia ON CAS_LICENCIA(LIC_LICENCIA);

-- =============================================================================
-- VERIFICACIÓN: Ver índices creados
-- =============================================================================
-- Ejecutar para ver todos los índices de CAS_LICENCIA:
-- SHOW INDEX FROM CAS_LICENCIA;

-- =============================================================================
-- NOTAS IMPORTANTES:
-- =============================================================================
-- 1. Los índices mejoran SELECT pero ralentizan INSERT/UPDATE/DELETE ligeramente
-- 2. Si tienes millones de registros, considera paginación en el endpoint
-- 3. Los índices 1-4 son CRÍTICOS para los JOINs actuales
-- 4. Los índices 5-10 son OPCIONALES según tus necesidades de filtrado
-- 5. Si solo necesitas las últimas N licencias, considera LIMIT en la consulta
-- 6. Para tablas muy grandes (>1M registros), considera particionamiento por fecha
