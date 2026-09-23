-- =============================================================================
-- RESPALDO de definiciones de procedimientos
--
-- Se guardan las 6 que se revisaron el 2026-09-10. De ellas SOLO se eliminaron
-- dos, las de admin y ventas:
--
--     ObtenerMultimedia   (admin)
--     mostrarVentas       (ventas)
--
-- Las otras cuatro son del portal docente y SIGUEN EXISTIENDO en la base: se
-- restauraron a proposito para no tocar nada fuera de admin y ventas. Su
-- definicion se conserva aqui solo como referencia.
--
-- Para restaurar cualquiera: ejecutar su bloque de este archivo.
-- =============================================================================

-- --------------------------------------------------------------------------
-- mostrarMaterias
-- Motivo: su consulta se movio a casa-web/multimedia.controller.js (allMaterias), filtrando por CAS_GRADO_MATERIA
-- --------------------------------------------------------------------------

DELIMITER //

CREATE PROCEDURE mostrarMaterias(IN gradoId int(11))
BEGIN
SELECT * 
FROM CAS_MATERIA
WHERE MAT_GRA_ID = gradoId;
END//

DELIMITER ;


-- --------------------------------------------------------------------------
-- mostrarMateriasPorLicenciaGrado
-- Motivo: su consulta se movio a casa-web/multimedia.controller.js (allMateriasPorLicenciaGrado)
-- --------------------------------------------------------------------------

DELIMITER //

CREATE PROCEDURE mostrarMateriasPorLicenciaGrado(IN p_lic_id int(11), IN p_gra_id int(11))
BEGIN
SELECT DISTINCT
        m.MAT_ID,
        m.MAT_NOMBRE,
        m.MAT_DESCRIPCION,
        m.MAT_GRA_ID,
        m.MAT_STATUS
    FROM CAS_LICENCIA l
    INNER JOIN CAS_PAQUETE pq
        ON pq.PAQ_ID = l.LIC_PAQ_ID
    INNER JOIN CAS_PRODUCTOS pr
        ON FIND_IN_SET(
             pr.PRO_ID,
             REPLACE(REPLACE(REPLACE(pq.PAQ_PRODUCTOS, '[', ''), ']', ''), ' ', '')
           ) > 0
    INNER JOIN CAS_MATERIA m
        ON m.MAT_ID = pr.PRO_MAT_ID
    WHERE l.LIC_ID = p_lic_id
      AND m.MAT_GRA_ID = p_gra_id
    ORDER BY m.MAT_NOMBRE;
END//

DELIMITER ;


-- --------------------------------------------------------------------------
-- mostrarMultimediaVideos
-- Motivo: duplicado exacto de mostrarPorTipoMultimedia; nunca se llamo desde el codigo
-- --------------------------------------------------------------------------

DELIMITER //

CREATE PROCEDURE mostrarMultimediaVideos(IN subtipo int(11), IN materiaId int(11), IN tipoMulti int(11))
BEGIN
SELECT *
FROM CAS_MULTIMEDIA
WHERE MUL_SBT_ID = subtipo AND MUL_MAT_ID = materiaId AND MUL_TIPO = tipoMulti;
END//

DELIMITER ;


-- --------------------------------------------------------------------------
-- mostrarVentas
-- Motivo: el listado de ventas usa una consulta propia en ventas.controller.js
-- --------------------------------------------------------------------------

DELIMITER //

CREATE PROCEDURE mostrarVentas()
BEGIN
SELECT * FROM CAS_VENTA ORDER BY VEN_ID ASC;
END//

DELIMITER ;


-- --------------------------------------------------------------------------
-- ObtenerMultimedia
-- Motivo: su consulta se movio a ADMIN/multimedia.controller.js, para filtrar el semestre por la materia
-- --------------------------------------------------------------------------

DELIMITER //

CREATE PROCEDURE ObtenerMultimedia(IN p_tipo int(11), IN p_grado int(11), IN p_subtipo int(11), IN p_materia int(11))
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
        g.GRA_NUMERO,
        g.GRA_NOMBRE,
        s.SBT_TIPO,
        ua.UAD_USUARIO AS USU_USUARIO,
        mat.MAT_NOMBRE
    FROM CAS_MULTIMEDIA m
    LEFT JOIN CAS_GRADO g ON m.MUL_GRA_ID = g.GRA_ID
    LEFT JOIN CAS_SUBTIPOS s ON m.MUL_SBT_ID = s.SBT_ID
    LEFT JOIN CAS_USUARIO_ADMIN ua ON m.MUL_UAD_ID = ua.UAD_ID
    LEFT JOIN CAS_MATERIA mat ON m.MUL_MAT_ID = mat.MAT_ID
    WHERE m.MUL_TIPO = p_tipo
        AND (p_grado IS NULL OR m.MUL_GRA_ID = p_grado)
        AND (p_subtipo IS NULL OR m.MUL_SBT_ID = p_subtipo)
        AND (p_materia IS NULL OR m.MUL_MAT_ID = p_materia)
    ORDER BY m.MUL_FECHA_CREACION DESC;
END//

DELIMITER ;


-- --------------------------------------------------------------------------
-- sp_existe_licencia
-- Motivo: reemplazado por la consulta en casa-web/licencias.controller.js, que acepta varios tipos a la vez
-- --------------------------------------------------------------------------

DELIMITER //

CREATE PROCEDURE sp_existe_licencia(IN tipo varchar(100), IN licencia varchar(100))
BEGIN
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 'SI'
            ELSE 'NO'
        END AS RESPONSE,
        MAX(LIC_ID) AS LIC_ID
    FROM CAS_LICENCIA
    WHERE LIC_LICENCIA = licencia
      AND LIC_TIPO = tipo AND LIC_STATUS = 1;
END//

DELIMITER ;


