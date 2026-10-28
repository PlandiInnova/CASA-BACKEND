-- =============================================================================
-- MIGRACION COMPLETA PARA PRODUCCION  (192.168.100.25 / BD_CASA / hostname "Casa")
--
-- Deja la base lista para el codigo que se va a subir. Reune en un solo archivo
-- y en el orden correcto lo que estaba repartido entre:
--   - materias_multi_subsistema_grado.sql   (solo backfill, daba por hecho el DDL)
--   - licencias_subsistemas.sql             (solo backfill, el ALTER iba comentado)
--
-- Contrastado contra produccion el 2026-10-16. En ese momento faltaban
-- exactamente dos cosas: la tabla CAS_GRADO_MATERIA y la columna
-- CAS_LICENCIA.LIC_SUBSISTEMAS. El resto (GRA_SUB_ID, MAT_SUB_ID, MAT_PORTADA,
-- PRO_MAT_ID) ya estaba.
--
-- ES IDEMPOTENTE: se puede ejecutar varias veces sin duplicar nada.
-- NO BORRA NI VACIA NADA. No toca ningun procedimiento almacenado.
--
-- ANTES DE EMPEZAR: tener el respaldo a la mano.
--   mysqldump --host=192.168.100.25 --user=root -p \
--             --single-transaction --routines --triggers --events \
--             --column-statistics=0 BD_CASA > BD_CASA_PRODUCCION.sql
--
-- EJECUTAR LOS PASOS EN ORDEN. El paso 3 depende del 2.
-- =============================================================================


-- =============================================================================
-- PASO 0  ·  Verificacion previa (no modifica nada)
--
-- Correr esto primero y leer el resultado. Sirve de punto de partida y dice
-- que hace falta. Las filas que digan "YA ESTABA" significan que ese paso no
-- hara nada, lo cual es correcto si el script ya se habia ejecutado.
-- =============================================================================

SELECT 'CAS_GRADO_MATERIA (tabla)' AS objeto,
       IF(COUNT(*) > 0, 'YA ESTABA', 'LA CREA EL PASO 1') AS estado
  FROM information_schema.TABLES
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAS_GRADO_MATERIA'
UNION ALL
SELECT 'CAS_LICENCIA.LIC_SUBSISTEMAS',
       IF(COUNT(*) > 0, 'YA ESTABA', 'LA CREA EL PASO 1')
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAS_LICENCIA' AND COLUMN_NAME = 'LIC_SUBSISTEMAS'
UNION ALL
SELECT 'CAS_GRADO.GRA_SUB_ID (requisito)',
       IF(COUNT(*) > 0, 'OK', '*** FALTA: NO CONTINUAR ***')
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAS_GRADO' AND COLUMN_NAME = 'GRA_SUB_ID'
UNION ALL
SELECT 'CAS_PRODUCTOS.PRO_MAT_ID (requisito)',
       IF(COUNT(*) > 0, 'OK', '*** FALTA: NO CONTINUAR ***')
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAS_PRODUCTOS' AND COLUMN_NAME = 'PRO_MAT_ID'
UNION ALL
SELECT 'CAS_MATERIA.MAT_SUB_ID (requisito)',
       IF(COUNT(*) > 0, 'OK', '*** FALTA: NO CONTINUAR ***')
  FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CAS_MATERIA' AND COLUMN_NAME = 'MAT_SUB_ID';

-- Materias que apuntan a un semestre inexistente: tienen que ser 0, o el
-- paso 2 fallara al crear la clave foranea.
SELECT COUNT(*) AS materias_con_semestre_invalido
  FROM CAS_MATERIA m
  LEFT JOIN CAS_GRADO g ON g.GRA_ID = m.MAT_GRA_ID
 WHERE m.MAT_GRA_ID IS NOT NULL AND g.GRA_ID IS NULL;

-- Foto del antes, para comparar al final.
SELECT (SELECT COUNT(*) FROM CAS_MATERIA)                               AS materias,
       (SELECT COUNT(*) FROM CAS_LICENCIA)                              AS licencias,
       (SELECT COUNT(*) FROM CAS_LICENCIA WHERE LIC_PAQ_ID IS NOT NULL) AS licencias_con_paquete,
       (SELECT COUNT(*) FROM CAS_PRODUCTOS)                             AS productos,
       (SELECT COUNT(*) FROM CAS_PRODUCTOS WHERE PRO_MAT_ID IS NULL)    AS productos_sin_materia;


-- =============================================================================
-- PASO 1  ·  Estructura
--
-- La tabla y la columna son las que el codigo nuevo necesita. Ambas sentencias
-- llevan IF NOT EXISTS, asi que si ya existen no pasa nada.
--
-- El DDL de la tabla es copia del de desarrollo, sin el AUTO_INCREMENT=214 que
-- traia (ahi empieza en 1, que es lo que corresponde en una tabla vacia).
-- El charset latin1_swedish_ci coincide con CAS_GRADO, CAS_MATERIA y
-- CAS_LICENCIA en produccion, asi que no hay mezcla de collations.
-- =============================================================================

CREATE TABLE IF NOT EXISTS `CAS_GRADO_MATERIA` (
  `GMA_ID` int(11) NOT NULL AUTO_INCREMENT,
  `GMA_GRA_ID` int(11) DEFAULT NULL,
  `GMA_MAT_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`GMA_ID`),
  KEY `GMA_GRA_ID` (`GMA_GRA_ID`),
  KEY `GMA_MAT_ID` (`GMA_MAT_ID`),
  CONSTRAINT `CAS_GRADO_MATERIA_ibfk_1` FOREIGN KEY (`GMA_GRA_ID`) REFERENCES `CAS_GRADO` (`GRA_ID`),
  CONSTRAINT `CAS_GRADO_MATERIA_ibfk_2` FOREIGN KEY (`GMA_MAT_ID`) REFERENCES `CAS_MATERIA` (`MAT_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Va despues de LIC_TIPO, que hoy es la ultima columna de la tabla.
ALTER TABLE CAS_LICENCIA
  ADD COLUMN IF NOT EXISTS LIC_SUBSISTEMAS varchar(100) NULL AFTER LIC_TIPO;


-- =============================================================================
-- PASO 2  ·  Materias en varios semestres y subsistemas
--
-- Pasa a CAS_GRADO_MATERIA lo que hoy vive en CAS_MATERIA.MAT_GRA_ID.
--
-- No hace falta una tabla aparte para el subsistema: cada fila de CAS_GRADO
-- lleva GRA_SUB_ID, asi que un grado ES "semestre N del subsistema X", y
-- apuntar a el guarda las dos cosas de una vez.
--
-- MAT_GRA_ID y MAT_SUB_ID NO se vacian ni se eliminan: el backend las sigue
-- escribiendo con el primer semestre marcado, para que nada que todavia las
-- lea se quede sin valor.
--
-- El LEFT JOIN lo hace idempotente: al repetirlo inserta 0 filas.
-- =============================================================================

INSERT INTO CAS_GRADO_MATERIA (GMA_MAT_ID, GMA_GRA_ID)
SELECT m.MAT_ID, m.MAT_GRA_ID
  FROM CAS_MATERIA m
  LEFT JOIN CAS_GRADO_MATERIA gm
    ON gm.GMA_MAT_ID = m.MAT_ID
   AND gm.GMA_GRA_ID = m.MAT_GRA_ID
 WHERE m.MAT_GRA_ID IS NOT NULL
   AND gm.GMA_ID IS NULL;


-- =============================================================================
-- PASO 3  ·  Subsistemas que abarca cada licencia
--
-- DEPENDE DEL PASO 2: recorre CAS_GRADO_MATERIA. Si se ejecuta antes, deja
-- todo en NULL sin avisar.
--
-- El subsistema no se captura a mano: se deduce recorriendo
--   paquete -> productos -> materia -> CAS_GRADO_MATERIA -> grado -> subsistema
--
-- Se pasa por la materia y no por PRO_GRA_ID porque el subsistema esta
-- registrado en la materia, y una materia puede impartirse en varios
-- subsistemas mientras que el grado del producto es uno solo.
--
-- Solo toca las filas en NULL, asi que es idempotente y no pisa lo que el
-- backend calcule despues al generar licencias nuevas.
-- =============================================================================

-- 3.1  Licencias CON paquete (las INDIVIDUAL)
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

-- 3.2  Licencias SIN paquete (GENERICA y PRESENTACIONES)
--
-- Dan el catalogo completo, asi que abarcan todos los subsistemas que tengan
-- productos hoy. Es una foto del momento: si manana se agrega un producto de
-- otro subsistema, estas licencias lo incluiran aunque su LIC_SUBSISTEMAS
-- siga diciendo lo de hoy.
UPDATE CAS_LICENCIA
   SET LIC_SUBSISTEMAS = (
       SELECT CONCAT('[', GROUP_CONCAT(DISTINCT g.GRA_SUB_ID ORDER BY g.GRA_SUB_ID), ']')
         FROM CAS_PRODUCTOS pr
         JOIN CAS_GRADO_MATERIA gm ON gm.GMA_MAT_ID = pr.PRO_MAT_ID
         JOIN CAS_GRADO g          ON g.GRA_ID = gm.GMA_GRA_ID)
 WHERE LIC_PAQ_ID IS NULL
   AND LIC_SUBSISTEMAS IS NULL;


-- =============================================================================
-- PASO 4  ·  Verificacion final
--
-- Lo esperado segun el estado de produccion al 2026-10-16:
--   - CAS_GRADO_MATERIA con 23 filas (una por materia)
--   - licencias_sin_subsistema = 0
--   - las 22 GENERICA y las 2 PRESENTACIONES con '[1]'
--   - las 135 INDIVIDUAL con '[1]' o NULL si su paquete no lleva productos
--     con materia asignada (ver la nota de abajo)
-- =============================================================================

SELECT 'CAS_GRADO_MATERIA' AS tabla, COUNT(*) AS filas FROM CAS_GRADO_MATERIA;

SELECT LIC_TIPO,
       IFNULL(LIC_SUBSISTEMAS, '(sin asignar)') AS subsistemas,
       COUNT(*) AS licencias
  FROM CAS_LICENCIA
 GROUP BY LIC_TIPO, LIC_SUBSISTEMAS
 ORDER BY LIC_TIPO, subsistemas;

SELECT COUNT(*) AS licencias_sin_subsistema
  FROM CAS_LICENCIA WHERE LIC_SUBSISTEMAS IS NULL;

-- Materias y donde se imparten ahora
SELECT m.MAT_ID, m.MAT_NOMBRE,
       GROUP_CONCAT(DISTINCT CONCAT(s.SUB_NOMBRE, ' ', g.GRA_NUMERO, 'o')
                    ORDER BY s.SUB_NOMBRE, g.GRA_NUMERO SEPARATOR ', ') AS imparte
  FROM CAS_MATERIA m
  LEFT JOIN CAS_GRADO_MATERIA gm ON gm.GMA_MAT_ID = m.MAT_ID
  LEFT JOIN CAS_GRADO g          ON g.GRA_ID = gm.GMA_GRA_ID
  LEFT JOIN CAS_SUBSISTEMA s     ON s.SUB_ID = g.GRA_SUB_ID
 GROUP BY m.MAT_ID, m.MAT_NOMBRE
 ORDER BY m.MAT_NOMBRE;


-- =============================================================================
-- DOS COSAS QUE CONVIENE SABER (no son errores del script)
-- =============================================================================
--
-- 1. Hay 8 productos de 30 sin PRO_MAT_ID. Como el subsistema se deduce a
--    traves de la materia, esos 8 no aportan nada al calculo. Si un paquete
--    esta formado SOLO por productos de esos, su licencia quedara con
--    LIC_SUBSISTEMAS en NULL. Para ver cuales son:
--
--    SELECT PRO_ID, PRO_NOMBRE FROM CAS_PRODUCTOS WHERE PRO_MAT_ID IS NULL;
--
--    Se arregla asignandoles materia desde el panel y volviendo a correr el
--    paso 3 (solo toca las filas en NULL, no pisa las ya calculadas).
--
-- 2. En produccion hay dos subsistemas, 1=BGT y 3=BC, pero solo BGT tiene
--    semestres dados de alta (6). BC no tiene ninguno, asi que todavia no se
--    le puede asignar ninguna materia. Los semestres se crean desde el panel
--    ("Crear semestres" en el formulario de materias), no desde aqui.
--
--
-- =============================================================================
-- REVERSA  (si algo sale mal)
-- =============================================================================
-- Lo primero es restaurar el respaldo. Si solo hace falta deshacer esto:
--
--   DROP TABLE IF EXISTS CAS_GRADO_MATERIA;
--   ALTER TABLE CAS_LICENCIA DROP COLUMN IF EXISTS LIC_SUBSISTEMAS;
--
-- MAT_GRA_ID y MAT_SUB_ID siguen intactas, asi que el codigo anterior vuelve
-- a funcionar sin mas.
-- =============================================================================
