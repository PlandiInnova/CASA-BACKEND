-- =============================================================================
-- Subtipos: nuevos nombres y fusión de Solucionarios en Evaluación.
--
--   1 Solucionarios        -> se fusiona en Evaluación (deja de existir)
--   2 Planeaciones         -> Planeación
--   3 Evaluaciones         -> Evaluación
--   4 Recursos pedagógicos -> Didáctica
--
-- NO CREA NI ALTERA TABLAS Y NO TOCA NINGÚN PROCEDIMIENTO.
-- Son UPDATEs sobre CAS_MULTIMEDIA y CAS_SUBTIPOS.
--
-- El subtipo 1 no se borra: se desactiva (SBT_STATUS = 0). Borrarlo chocaría
-- con la clave foránea CAS_MULTIMEDIA_ibfk_1 y además dejaría sin rastro de qué
-- contenidos venían de Solucionarios. El backend ya solo lista los que tienen
-- SBT_STATUS = 1, así que desactivado desaparece de la interfaz igual.
--
-- Ejecutar una vez, en orden.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Antes de empezar: anota el resultado, es tu punto de partida
-- -----------------------------------------------------------------------------

-- SELECT MUL_SBT_ID, COUNT(*) FROM CAS_MULTIMEDIA GROUP BY MUL_SBT_ID;
-- Esperado en desarrollo: 1 -> 52, 2 -> 62, 3 -> 66, 4 -> 429


-- -----------------------------------------------------------------------------
-- 1. Mover el contenido de Solucionarios a Evaluación
--
-- En desarrollo son 52 filas (46 Word y 6 PDF). Evaluación pasa de 66 a 118.
-- -----------------------------------------------------------------------------

UPDATE CAS_MULTIMEDIA
   SET MUL_SBT_ID = 3
 WHERE MUL_SBT_ID = 1;


-- -----------------------------------------------------------------------------
-- 2. Nuevos nombres
-- -----------------------------------------------------------------------------

UPDATE CAS_SUBTIPOS SET SBT_TIPO = 'Planeación' WHERE SBT_ID = 2;
UPDATE CAS_SUBTIPOS SET SBT_TIPO = 'Evaluación' WHERE SBT_ID = 3;
UPDATE CAS_SUBTIPOS SET SBT_TIPO = 'Didáctica'  WHERE SBT_ID = 4;


-- -----------------------------------------------------------------------------
-- 3. Retirar Solucionarios de la interfaz
-- -----------------------------------------------------------------------------

UPDATE CAS_SUBTIPOS
   SET SBT_STATUS = 0
 WHERE SBT_ID = 1;


-- =============================================================================
-- Verificación
-- =============================================================================
-- SELECT s.SBT_ID, s.SBT_TIPO, s.SBT_STATUS, COUNT(m.MUL_ID) AS multimedia
--   FROM CAS_SUBTIPOS s
--   LEFT JOIN CAS_MULTIMEDIA m ON m.MUL_SBT_ID = s.SBT_ID
--  GROUP BY s.SBT_ID, s.SBT_TIPO, s.SBT_STATUS
--  ORDER BY s.SBT_ID;
--
-- Esperado en desarrollo:
--   1  Solucionarios  status 0    0
--   2  Planeación     status 1   62
--   3  Evaluación     status 1  118
--   4  Didáctica      status 1  429
