-- =============================================================================
-- Procedimiento: sp_insertar_pedido
-- Inserta un pedido en CAS_PEDIDO y genera PDD_SISTEMA automáticamente (único).
-- Retorna el PDD_ID generado para usarlo en LIC_PDD_ID.
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_insertar_pedido;

DELIMITER //

CREATE PROCEDURE sp_insertar_pedido(
  IN p_bitacora INT,
  IN p_solicitante VARCHAR(100),
  IN p_uad_id INT,
  IN p_fecha_registro DATE
)
BEGIN
  DECLARE v_sistema INT DEFAULT 0;
  DECLARE v_existe INT DEFAULT 1;
  DECLARE v_pdd_id INT DEFAULT 0;

  -- Generar PDD_SISTEMA único (no repetido)
  -- Buscar el máximo actual y sumar 1, o empezar en 1 si no hay registros
  REPEAT
    SELECT COALESCE(MAX(PDD_SISTEMA), 0) + 1 INTO v_sistema FROM CAS_PEDIDO;
    
    -- Verificar que no exista (por si acaso hubo un insert concurrente)
    SELECT COUNT(*) INTO v_existe FROM CAS_PEDIDO WHERE PDD_SISTEMA = v_sistema;
    
    IF v_existe > 0 THEN
      SET v_sistema = v_sistema + 1;
      SET v_existe = 1;
    END IF;
  UNTIL v_existe = 0
  END REPEAT;

  INSERT INTO CAS_PEDIDO (
    PDD_BITACORA,
    PDD_SISTEMA,
    PDD_SOLICITANTE,
    PDD_UAD_ID,
    PDD_FECHA_REGISTRO
  ) VALUES (
    p_bitacora,
    v_sistema,
    SUBSTRING(TRIM(IFNULL(p_solicitante, '')), 1, 100),
    p_uad_id,
    COALESCE(p_fecha_registro, CURDATE())
  );

  SET v_pdd_id = LAST_INSERT_ID();
  SELECT v_pdd_id AS pdd_id;
END //

DELIMITER ;
