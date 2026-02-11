-- =============================================================================
-- Script consolidado: Actualizar todos los procedimientos necesarios
-- Ejecutar este script completo en tu base de datos MySQL/MariaDB
-- =============================================================================

-- =============================================================================
-- 1. Procedimiento: sp_insertar_pedido
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

-- =============================================================================
-- 2. Procedimiento: sp_generar_licencias_batch (ACTUALIZADO - 12 parámetros)
-- Licencias: códigos 12 caracteres = INDICIO (al inicio) + resto aleatorio (0-9, A-Z).
-- Ej.: indicio "AAA" → "AAA" + 9 aleatorios = 12. Sin duplicados.
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_generar_licencias_batch;

DELIMITER //

CREATE PROCEDURE sp_generar_licencias_batch(
  IN p_indicio VARCHAR(12),
  IN p_ven_id INT,
  IN p_fecha_inicio DATE,
  IN p_fecha_fin DATE,
  IN p_paq_id INT,
  IN p_tiempo INT,
  IN p_num_caracteres INT,
  IN p_uad_id INT,
  IN p_tipo VARCHAR(45),
  IN p_tipo_licencia VARCHAR(45),
  IN p_pdd_id INT,
  IN p_cantidad INT
)
proc_label: BEGIN
  DECLARE i BIGINT DEFAULT 0;
  DECLARE v_codigo VARCHAR(12);
  DECLARE v_id BIGINT;
  DECLARE v_chars VARCHAR(36) DEFAULT '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  DECLARE v_j INT DEFAULT 0;
  DECLARE v_existe INT DEFAULT 1;
  DECLARE v_reintentos INT DEFAULT 0;
  DECLARE v_indicio VARCHAR(12) DEFAULT '';
  DECLARE v_len_indicio INT DEFAULT 0;
  DECLARE v_len_random INT DEFAULT 12;
  DECLARE v_indicio_guardar VARCHAR(100) DEFAULT '';

  -- Indicio al inicio: solo 0-9 y A-Z, máx 12 caracteres (el resto del código es aleatorio)
  SET v_indicio = UPPER(TRIM(IFNULL(SUBSTRING(p_indicio, 1, 12), '')));
  SET v_len_indicio = CHAR_LENGTH(v_indicio);
  SET v_len_random = 12 - v_len_indicio;
  IF v_len_random < 0 THEN
    SET v_len_random = 0;
    SET v_indicio = SUBSTRING(v_indicio, 1, 12);
    SET v_len_indicio = 12;
  END IF;
  SET v_indicio_guardar = SUBSTRING(TRIM(IFNULL(p_indicio, '')), 1, 100);

  -- Tabla temporal para devolver (id, licencia)
  DROP TEMPORARY TABLE IF EXISTS tmp_licencias_gen;
  CREATE TEMPORARY TABLE tmp_licencias_gen (
    lic_id BIGINT,
    lic_codigo VARCHAR(12)
  );

  -- Límite por invocación
  SET p_cantidad = LEAST(GREATEST(COALESCE(p_cantidad, 0), 0), 50000);

  IF p_cantidad = 0 THEN
    SELECT lic_id AS id, lic_codigo AS licencia FROM tmp_licencias_gen;
    DROP TEMPORARY TABLE IF EXISTS tmp_licencias_gen;
    LEAVE proc_label;
  END IF;

  WHILE i < p_cantidad DO
    SET v_existe = 1;
    SET v_reintentos = 0;

    -- Código = indicio + N caracteres aleatorios (0-9, A-Z), total 12. Sin duplicados.
    REPEAT
      SET v_codigo = v_indicio;
      SET v_j = 0;
      WHILE v_j < v_len_random DO
        SET v_codigo = CONCAT(v_codigo, SUBSTRING(v_chars, FLOOR(1 + RAND() * 36), 1));
        SET v_j = v_j + 1;
      END WHILE;

      SELECT COUNT(*) INTO v_existe FROM CAS_LICENCIA WHERE LIC_LICENCIA = v_codigo;
      SET v_reintentos = v_reintentos + 1;

      IF v_reintentos > 50 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se pudo generar código único después de reintentos';
      END IF;
    UNTIL v_existe = 0
    END REPEAT;

    INSERT INTO CAS_LICENCIA (
      LIC_VEN_ID,
      LIC_LICENCIA,
      LIC_INDICIO,
      LIC_FECHA_INICIO,
      LIC_FECHA_FIN,
      LIC_PAQ_ID,
      LIC_TIEMPO,
      LIC_NUM_LICENCIAS,
      LIC_NUM_CARACTERES,
      LIC_UAD_ID,
      LIC_PDD_ID,
      LIC_STATUS,
      LIC_TIPO
    ) VALUES (
      p_ven_id,
      v_codigo,
      v_indicio_guardar,
      p_fecha_inicio,
      p_fecha_fin,
      p_paq_id,
      p_tiempo,
      1,
      p_num_caracteres,
      p_uad_id,
      p_pdd_id,
      1,
      COALESCE(p_tipo_licencia, p_tipo)
    );

    SET v_id = LAST_INSERT_ID();
    INSERT INTO tmp_licencias_gen (lic_id, lic_codigo) VALUES (v_id, v_codigo);
    SET i = i + 1;
  END WHILE;

  SELECT lic_id AS id, lic_codigo AS licencia FROM tmp_licencias_gen;
  DROP TEMPORARY TABLE tmp_licencias_gen;
END //

DELIMITER ;

-- =============================================================================
-- Verificación: Verificar que los procedimientos se crearon correctamente
-- =============================================================================

-- SELECT ROUTINE_NAME, ROUTINE_TYPE 
-- FROM INFORMATION_SCHEMA.ROUTINES 
-- WHERE ROUTINE_SCHEMA = DATABASE() 
--   AND ROUTINE_NAME IN ('sp_insertar_pedido', 'sp_generar_licencias_batch');
