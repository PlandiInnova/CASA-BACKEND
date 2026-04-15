-- ============================================================
-- PASO 1: Selecciona TODO este bloque y ejecuta (Ctrl+Shift+Enter)
-- ============================================================

DROP PROCEDURE IF EXISTS `mostrarArItems`;

DELIMITER $$

CREATE PROCEDURE `mostrarArItems`()
BEGIN
    SELECT
        m.MUL_ID,
        m.MUL_TITULO,
        m.MUL_DESCRIPCION,
        m.MUL_GRA_ID,
        m.MUL_IMAGEN,
        m.MUL_TIPO,
        m.MUL_SBT_ID,
        m.MUL_ENLACE,
        m.MUL_FECHA_CREACION,
        m.MUL_STATUS,
        m.MUL_UAD_ID,
        m.MUL_MAT_ID,
        mat.MAT_NOMBRE AS MUL_MATERIA_NOMBRE
    FROM CAS_MULTIMEDIA m
    LEFT JOIN CAS_MATERIA mat ON m.MUL_MAT_ID = mat.MAT_ID
    WHERE m.MUL_TIPO = 8
      AND m.MUL_STATUS = 1
    ORDER BY m.MUL_FECHA_CREACION DESC;
END$$

DELIMITER ;

-- ============================================================
-- PASO 2: Selecciona solo esta línea y ejecuta para verificar
-- ============================================================

CALL mostrarArItems();
