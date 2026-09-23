-- =============================================================================
-- VERIFICACION PREVIA  -- ejecutar en PRODUCCION antes de cualquier otro script
--
-- No modifica nada: solo consulta. Dice que estructura ya existe y que falta.
-- Cada renglon debe decir OK. Si alguno dice FALTA, hay que resolverlo antes.
-- =============================================================================

SELECT 'CAS_GRADO_MATERIA (tabla)' AS requisito,
       IF(COUNT(*) > 0, 'OK', 'FALTA') AS estado,
       'la usa el alta de materias multi-semestre' AS para_que
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAS_GRADO_MATERIA'

UNION ALL
SELECT 'CAS_GRADO.GRA_SUB_ID',
       IF(COUNT(*) > 0, 'OK', 'FALTA'),
       'liga cada semestre con su subsistema'
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAS_GRADO' AND COLUMN_NAME = 'GRA_SUB_ID'

UNION ALL
SELECT 'CAS_MATERIA.MAT_SUB_ID',
       IF(COUNT(*) > 0, 'OK', 'FALTA'),
       'lo crea alter_materia_subsistema.sql'
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAS_MATERIA' AND COLUMN_NAME = 'MAT_SUB_ID'

UNION ALL
SELECT 'CAS_PRODUCTOS.PRO_MAT_ID',
       IF(COUNT(*) > 0, 'OK', 'FALTA'),
       'lo crea alter_producto_materia.sql'
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAS_PRODUCTOS' AND COLUMN_NAME = 'PRO_MAT_ID'

UNION ALL
SELECT 'CAS_LICENCIA.LIC_SUBSISTEMAS',
       IF(COUNT(*) > 0, 'OK', 'FALTA -> correr el ALTER de abajo'),
       'columna nueva, en desarrollo se creo a mano'
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAS_LICENCIA' AND COLUMN_NAME = 'LIC_SUBSISTEMAS';


-- -----------------------------------------------------------------------------
-- Si LIC_SUBSISTEMAS dice FALTA, este es el ALTER (no viene en ningun script):
-- -----------------------------------------------------------------------------
-- ALTER TABLE CAS_LICENCIA ADD COLUMN LIC_SUBSISTEMAS VARCHAR(100) NULL AFTER LIC_TIPO;


-- =============================================================================
-- Punto de partida: anotar estos numeros ANTES de ejecutar nada
-- =============================================================================

-- Reparto actual de subtipos (en desarrollo era 1->52, 2->62, 3->66, 4->429)
SELECT MUL_SBT_ID, COUNT(*) AS contenidos
  FROM CAS_MULTIMEDIA GROUP BY MUL_SBT_ID ORDER BY MUL_SBT_ID;

-- IMPRESCINDIBLE para poder deshacer la fusion de Solucionarios.
-- Guardar esta lista: es la version de PRODUCCION del rollback, y no coincide
-- con la de desarrollo. Sin ella, el paso 2 es irreversible.
SELECT GROUP_CONCAT(MUL_ID ORDER BY MUL_ID) AS ids_solucionarios_a_guardar
  FROM CAS_MULTIMEDIA WHERE MUL_SBT_ID = 1;
