-- =============================================================================
-- Deshacer subtipos_fusion_renombrado.sql
--
-- La fusión es el paso que no se puede revertir solo: una vez que los 52
-- contenidos de Solucionarios pasan a MUL_SBT_ID = 3, se mezclan con los 66 que
-- ya estaban ahí y nada los distingue.
--
-- Por eso la lista de abajo lleva los MUL_ID exactos que tenían MUL_SBT_ID = 1
-- en desarrollo, leídos de la base el 2026-09-07 antes de migrar.
--
-- IMPORTANTE: esta lista sirve SOLO para la base de desarrollo. Antes de correr
-- la migración en producción, saca allá su propia lista y guárdala:
--
--   SELECT GROUP_CONCAT(MUL_ID ORDER BY MUL_ID)
--     FROM CAS_MULTIMEDIA WHERE MUL_SBT_ID = 1;
--
-- Sin esa lista, en producción la fusión no tiene vuelta atrás.
--
-- Todo va comentado a propósito: descomenta solo lo que necesites.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Devolver los contenidos a Solucionarios (solo base de DESARROLLO)
-- -----------------------------------------------------------------------------

-- UPDATE CAS_MULTIMEDIA
--    SET MUL_SBT_ID = 1
--  WHERE MUL_ID IN (
--    22, 23, 24, 25, 26, 27, 28, 141, 143, 145, 146, 148, 151, 167, 168,
--    169, 172, 174, 176, 177, 179, 180, 181, 183, 184, 258, 264, 270, 285, 286,
--    288, 298, 299, 302, 303, 305, 422, 423, 424, 463, 464, 465, 466, 467, 468,
--    608, 609, 610, 611, 612, 613, 614
--  );


-- -----------------------------------------------------------------------------
-- 2. Reactivar el subtipo Solucionarios
-- -----------------------------------------------------------------------------

-- UPDATE CAS_SUBTIPOS SET SBT_STATUS = 1 WHERE SBT_ID = 1;


-- -----------------------------------------------------------------------------
-- 3. Nombres anteriores
-- -----------------------------------------------------------------------------

-- UPDATE CAS_SUBTIPOS SET SBT_TIPO = 'Planeaciones'         WHERE SBT_ID = 2;
-- UPDATE CAS_SUBTIPOS SET SBT_TIPO = 'Evaluaciones'         WHERE SBT_ID = 3;
-- UPDATE CAS_SUBTIPOS SET SBT_TIPO = 'Recursos pedagógicos' WHERE SBT_ID = 4;


-- =============================================================================
-- Además hay que revertir el código
-- =============================================================================
-- El menú del portal docente perdió la sección Solucionario y sus etiquetas
-- cambiaron. Deshacer los datos sin deshacer el código deja el subtipo 1 activo
-- pero sin ninguna pantalla que lo muestre.
