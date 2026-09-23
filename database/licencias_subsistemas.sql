-- =============================================================================
-- LIC_SUBSISTEMAS: subsistemas que abarca cada licencia, como '[1,3]'
--
-- La columna ya existe en la base:
--   ALTER TABLE CAS_LICENCIA ADD COLUMN LIC_SUBSISTEMAS VARCHAR(100) NULL AFTER LIC_TIPO;
--
-- Este script solo RELLENA las licencias que ya estaban. Las nuevas las deduce
-- el backend al generarlas, con la misma cadena (generarLicencias.controller.js).
--
-- El subsistema NO se captura a mano: está registrado en la materia y de ahí
-- se llega por paquete -> productos -> materia -> grado -> subsistema.
--
-- NO TOCA NINGÚN PROCEDIMIENTO. sp_generar_licencias_batch queda intacto: el
-- controlador actualiza la columna después de cada lote, usando los ids que el
-- propio procedimiento devuelve.
--
-- El campo es informativo: se muestra en los paneles de admin y ventas y sale
-- en la exportación. No restringe lo que ven el portal docente ni el launcher.
--
-- Ejecutar una vez. Es idempotente: solo toca las filas en NULL.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Licencias CON paquete (las INDIVIDUAL)
--
-- El subsistema sale de recorrer:
--   paquete -> productos -> MATERIA -> CAS_GRADO_MATERIA -> grado -> subsistema
--
-- Se pasa por la materia y no por PRO_GRA_ID porque el subsistema está
-- registrado en la materia, y una materia puede impartirse en varios
-- subsistemas a la vez mientras que el grado del producto es uno solo.
-- -----------------------------------------------------------------------------

UPDATE CAS_LICENCIA l
   SET l.LIC_SUBSISTEMAS = (
       SELECT CONCAT('[', GROUP_CONCAT(DISTINCT g.GRA_SUB_ID ORDER BY g.GRA_SUB_ID), ']')
         FROM CAS_PAQUETE pq
         JOIN CAS_PRODUCTOS pr
           ON FIND_IN_SET(pr.PRO_ID,
                REPLACE(REPLACE(REPLACE(pq.PAQ_PRODUCTOS, '[', ''), ']', ''), ' ', '')) > 0
         JOIN CAS_GRADO_MATERIA gm ON gm.GMA_MAT_ID = pr.PRO_MAT_ID
         JOIN CAS_GRADO g          ON g.GRA_ID = gm.GMA_GRA_ID
        WHERE pq.PAQ_ID = l.LIC_PAQ_ID)
 WHERE l.LIC_PAQ_ID IS NOT NULL
   AND l.LIC_SUBSISTEMAS IS NULL;


-- -----------------------------------------------------------------------------
-- 2. Licencias SIN paquete (GENERICA y PRESENTACIONES)
--
-- Estas dan el catálogo completo, así que abarcan todos los subsistemas que
-- tengan productos hoy. Es una foto del momento: si mañana se agrega un
-- producto de otro subsistema, estas licencias lo incluirán aunque su
-- LIC_SUBSISTEMAS siga diciendo lo de hoy.
-- -----------------------------------------------------------------------------

UPDATE CAS_LICENCIA
   SET LIC_SUBSISTEMAS = (
       SELECT CONCAT('[', GROUP_CONCAT(DISTINCT g.GRA_SUB_ID ORDER BY g.GRA_SUB_ID), ']')
         FROM CAS_PRODUCTOS pr
         JOIN CAS_GRADO_MATERIA gm ON gm.GMA_MAT_ID = pr.PRO_MAT_ID
         JOIN CAS_GRADO g          ON g.GRA_ID = gm.GMA_GRA_ID)
 WHERE LIC_PAQ_ID IS NULL
   AND LIC_SUBSISTEMAS IS NULL;


-- =============================================================================
-- Verificación
-- =============================================================================
-- SELECT LIC_TIPO, LIC_SUBSISTEMAS, COUNT(*) AS licencias
--   FROM CAS_LICENCIA GROUP BY LIC_TIPO, LIC_SUBSISTEMAS ORDER BY LIC_TIPO;
--
-- Esperado en desarrollo:
--   GENERICA        [1,3]    22
--   INDIVIDUAL      [1]      80
--   PRESENTACIONES  [1,3]     2
--
-- SELECT COUNT(*) AS nulas FROM CAS_LICENCIA WHERE LIC_SUBSISTEMAS IS NULL;  -- 0

-- =============================================================================
-- Revertir
-- =============================================================================
-- UPDATE CAS_LICENCIA SET LIC_SUBSISTEMAS = NULL;
