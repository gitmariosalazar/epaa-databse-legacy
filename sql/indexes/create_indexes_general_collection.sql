-- =============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS: Datos_ingreso & AP_NotasCredito
-- Archivo: create_indexes_general_collection.sql
-- Compatibilidad: SQL Server 2000 (no soporta INCLUDE, filtered indexes ni
--                 indexed computed columns; se usan índices compuestos clásicos)
-- Generado para: SqlServer2000GeneralCollectionPersistence
-- =============================================================================
-- NOTAS DE COMPATIBILIDAD SQL SERVER 2000:
--   - No existe la cláusula INCLUDE en CREATE INDEX.
--   - No existen índices filtrados (WHERE en CREATE INDEX).
--   - No existen índices sobre columnas calculadas persistidas (PERSISTED).
--   - Las funciones YEAR() / MONTH() en WHERE son no-sargables; la solución
--     es filtrar por rango de fechas en lugar de YEAR(col) en la query,
--     pero dado que el código actual usa YEAR(), los índices sobre las
--     columnas de fecha de todos modos aceleran el acceso.
--   - Se usa IF EXISTS sobre sysobjects para no recrear índices ya existentes.
-- =============================================================================


-- =============================================================================
-- TABLA: Datos_ingreso
-- =============================================================================

-- -----------------------------------------------------------------------------
-- IDX 1: Fecha_Pago + Cod_Titulo_Datos + Cod_Ingreso
-- Cubre: getGeneralCollectionReport (dateFilter=paymentDate)
--        getGeneralDailyCollectionGroupedReport (dateFilter=paymentDate)
--        getGeneralCollectionKPI (dateFilter=paymentDate)
--        getGeneralYearlyCollectionKPI (dateFilter=paymentDate)
--        getGeneralMonthlyCollectionKPI (dateFilter=paymentDate)
--        getGeneralYearlyCollectionGroupedReport (dateFilter=paymentDate)
--        getGeneralMonthlyCollectionGroupedReport (dateFilter=paymentDate)
-- Razón: Fecha_Pago es la columna de filtro principal en rango de fechas y
--        en YEAR(Fecha_Pago). Cod_Titulo_Datos es el segundo predicado más
--        frecuente. Cod_Ingreso se incluye para el NOT IN de paginación.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sysindexes
    WHERE id   = OBJECT_ID('Datos_ingreso')
      AND name = 'IDX_DI_FechaPago_CodTitulo_CodIngreso'
)
CREATE INDEX IDX_DI_FechaPago_CodTitulo_CodIngreso
    ON Datos_ingreso (Fecha_Pago, Cod_Titulo_Datos, Cod_Ingreso)
GO


-- -----------------------------------------------------------------------------
-- IDX 2: Fecha_Ingreso + Cod_Titulo_Datos + Cod_Ingreso
-- Cubre: getGeneralCollectionReport (dateFilter=incomeDate)
--        getGeneralDailyCollectionGroupedReport (dateFilter=incomeDate)
--        getGeneralCollectionKPI (dateFilter=incomeDate)
--        getGeneralYearlyCollectionKPI (dateFilter=incomeDate)
--        getGeneralMonthlyCollectionKPI (dateFilter=incomeDate)
--        getGeneralYearlyCollectionGroupedReport (dateFilter=incomeDate)
--        getGeneralMonthlyCollectionGroupedReport (dateFilter=incomeDate)
-- Razón: Espejo del índice anterior para el campo alternativo de fecha.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sysindexes
    WHERE id   = OBJECT_ID('Datos_ingreso')
      AND name = 'IDX_DI_FechaIngreso_CodTitulo_CodIngreso'
)
CREATE INDEX IDX_DI_FechaIngreso_CodTitulo_CodIngreso
    ON Datos_ingreso (Fecha_Ingreso, Cod_Titulo_Datos, Cod_Ingreso)
GO


-- -----------------------------------------------------------------------------
-- IDX 3: Fecha_Pago + User_Cobro + Cod_Titulo_Datos + FormaDePago + Estado_Ingreso
-- Cubre: getGeneralDailyCollectionGroupedReport (GROUP BY)
--        getGeneralYearlyCollectionGroupedReport (GROUP BY)
--        getGeneralMonthlyCollectionGroupedReport (GROUP BY)
-- Razón: Todas las columnas del GROUP BY. Al estar en el índice, el motor
--        puede resolver el GROUP BY/ORDER BY sin ordenamiento adicional
--        (index scan ordered).
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sysindexes
    WHERE id   = OBJECT_ID('Datos_ingreso')
      AND name = 'IDX_DI_FechaPago_GroupBy_Cols'
)
CREATE INDEX IDX_DI_FechaPago_GroupBy_Cols
    ON Datos_ingreso (
        Fecha_Pago,
        User_Cobro,
        Cod_Titulo_Datos,
        FormaDePago,
        Estado_Ingreso
    )
GO


-- -----------------------------------------------------------------------------
-- IDX 4: Fecha_Ingreso + User_Cobro + Cod_Titulo_Datos + FormaDePago + Estado_Ingreso
-- Cubre: Mismo que IDX 3 pero para dateFilter=incomeDate
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sysindexes
    WHERE id   = OBJECT_ID('Datos_ingreso')
      AND name = 'IDX_DI_FechaIngreso_GroupBy_Cols'
)
CREATE INDEX IDX_DI_FechaIngreso_GroupBy_Cols
    ON Datos_ingreso (
        Fecha_Ingreso,
        User_Cobro,
        Cod_Titulo_Datos,
        FormaDePago,
        Estado_Ingreso
    )
GO


-- -----------------------------------------------------------------------------
-- IDX 5: ClaveCatastral + Fecha_Pago + Cod_Titulo_Datos
-- Cubre: Subconsulta EXISTS en getGeneralCollectionKPI / getGeneralYearlyCollectionKPI
--        / getGeneralMonthlyCollectionKPI
--        → WHERE di_sub.ClaveCatastral = nc_in.Cuenta
--            AND di_sub.Fecha_Pago BETWEEN @inicio AND @fin
--            AND di_sub.Cod_Titulo_Datos = @code
-- Razón: La subconsulta correlacionada accede primero por ClaveCatastral
--        (join con AP_NotasCredito.Cuenta) y luego filtra por fecha y código.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sysindexes
    WHERE id   = OBJECT_ID('Datos_ingreso')
      AND name = 'IDX_DI_ClaveCatastral_FechaPago_CodTitulo'
)
CREATE INDEX IDX_DI_ClaveCatastral_FechaPago_CodTitulo
    ON Datos_ingreso (ClaveCatastral, Fecha_Pago, Cod_Titulo_Datos)
GO


-- -----------------------------------------------------------------------------
-- IDX 6: ClaveCatastral + Fecha_Ingreso + Cod_Titulo_Datos
-- Cubre: Mismo que IDX 5 pero para dateFilter=incomeDate
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sysindexes
    WHERE id   = OBJECT_ID('Datos_ingreso')
      AND name = 'IDX_DI_ClaveCatastral_FechaIngreso_CodTitulo'
)
CREATE INDEX IDX_DI_ClaveCatastral_FechaIngreso_CodTitulo
    ON Datos_ingreso (ClaveCatastral, Fecha_Ingreso, Cod_Titulo_Datos)
GO


-- -----------------------------------------------------------------------------
-- IDX 7: Cod_Ingreso (si no hay PK o clave clustered ya definida)
-- Cubre: Paginación NOT IN (SELECT TOP N Cod_Ingreso ...)
--        COUNT(di.Cod_Ingreso) en KPIs
-- Razón: Cod_Ingreso es la clave de negocio usada en conteos y paginación.
--        Verifica primero si ya es PK (clustered) antes de crear.
-- NOTA: Comenta este bloque si Cod_Ingreso ya es PRIMARY KEY de la tabla.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sysindexes
    WHERE id         = OBJECT_ID('Datos_ingreso')
      AND name       = 'IDX_DI_CodIngreso'
      AND indid      BETWEEN 1 AND 254   -- no es heap (0) ni texto (255)
)
AND NOT EXISTS (
    SELECT 1 FROM sysobjects so
    INNER JOIN sysindexes si ON so.id = si.id
    WHERE so.name   = 'Datos_ingreso'
      AND si.name IN (
            SELECT name FROM sysindexes
            WHERE id    = OBJECT_ID('Datos_ingreso')
              AND indid = 1  -- índice clustered / PK
      )
      AND INDEXPROPERTY(OBJECT_ID('Datos_ingreso'), si.name, 'IsClustered') = 1
)
BEGIN
    CREATE INDEX IDX_DI_CodIngreso
        ON Datos_ingreso (Cod_Ingreso)
END
GO


-- =============================================================================
-- TABLA: AP_NotasCredito
-- =============================================================================

-- -----------------------------------------------------------------------------
-- IDX 8: Cuenta (columna que se une con Datos_ingreso.ClaveCatastral)
-- Cubre: CROSS JOIN + EXISTS en los tres métodos KPI
--        → WHERE nc_in.Cuenta = di_sub.ClaveCatastral
-- Razón: Sin índice sobre Cuenta, cada fila de la subconsulta fuerza un
--        full scan de AP_NotasCredito.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sysindexes
    WHERE id   = OBJECT_ID('AP_NotasCredito')
      AND name = 'IDX_NC_Cuenta'
)
CREATE INDEX IDX_NC_Cuenta
    ON AP_NotasCredito (Cuenta)
GO


-- =============================================================================
-- RESUMEN DE ÍNDICES CREADOS
-- =============================================================================
--
-- Tabla Datos_ingreso  (7 índices)
-- ┌─────┬───────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────┐
-- │ IDX │ Columnas                                                   │ Queries que beneficia                                 │
-- ├─────┼───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
-- │  1  │ Fecha_Pago, Cod_Titulo_Datos, Cod_Ingreso                  │ Report, Daily, KPI, Yearly/Monthly KPI & Grouped      │
-- │  2  │ Fecha_Ingreso, Cod_Titulo_Datos, Cod_Ingreso               │ Ídem para incomeDate                                  │
-- │  3  │ Fecha_Pago, User_Cobro, Cod_Titulo_Datos, FormaDePago,     │ Daily/Yearly/Monthly GroupedReport (GROUP BY)          │
-- │     │ Estado_Ingreso                                             │                                                       │
-- │  4  │ Fecha_Ingreso, User_Cobro, Cod_Titulo_Datos, FormaDePago,  │ Ídem para incomeDate                                  │
-- │     │ Estado_Ingreso                                             │                                                       │
-- │  5  │ ClaveCatastral, Fecha_Pago, Cod_Titulo_Datos               │ EXISTS subconsulta en todos los métodos KPI            │
-- │  6  │ ClaveCatastral, Fecha_Ingreso, Cod_Titulo_Datos            │ Ídem para incomeDate                                  │
-- │  7  │ Cod_Ingreso                                                │ Paginación NOT IN, COUNT(Cod_Ingreso)                 │
-- └─────┴───────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────┘
--
-- Tabla AP_NotasCredito  (1 índice)
-- ┌─────┬─────────────┬──────────────────────────────────────────────────────┐
-- │ IDX │ Columnas    │ Queries que beneficia                                 │
-- ├─────┼─────────────┼──────────────────────────────────────────────────────┤
-- │  8  │ Cuenta      │ CROSS JOIN + EXISTS en getGeneralCollectionKPI,       │
-- │     │             │ getGeneralYearlyCollectionKPI,                        │
-- │     │             │ getGeneralMonthlyCollectionKPI                        │
-- └─────┴─────────────┴──────────────────────────────────────────────────────┘
--
-- RECOMENDACIÓN ADICIONAL (no aplicable en SQL Server 2000):
--   En versiones modernas (2008+) se podría usar columnas INCLUDE para
--   cubrir las columnas de agregación (Valor_Titulo, Recargo, etc.)
--   y convertir los index scan en index seek cubrientes.
-- =============================================================================
