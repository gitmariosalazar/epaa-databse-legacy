-- =============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS: Datos_ingreso & AP_NotasCredito
-- Archivo: create_indexes_general_collection_ss2022.sql
-- Compatibilidad: SQL Server 2022 — Standard / Developer / Express
--                 (ONLINE=ON y SORT_IN_TEMPDB removidos: requieren Enterprise)
-- Generado para: SqlServer2000GeneralCollectionPersistence
--
-- Características usadas (disponibles en todas las ediciones):
--   ✔ Catálogo sys.indexes / sys.objects
--   ✔ INCLUDE → covering indexes (evita Key Lookup)
--   ✔ Índices filtrados (WHERE ClaveCatastral IS NOT NULL)
--   ✔ FILLFACTOR = 85  → reduce page splits en inserts
--   ✔ STATISTICS_NORECOMPUTE = OFF → estadísticas siempre actualizadas
--   ✔ OPTIMIZE_FOR_SEQUENTIAL_KEY (SS2019+, todas las ediciones)
-- =============================================================================


-- =============================================================================
-- TABLA: Datos_ingreso
-- =============================================================================

-- -----------------------------------------------------------------------------
-- IDX 1: Fecha_Pago + Cod_Titulo_Datos + Cod_Ingreso  (dateFilter=paymentDate)
-- -----------------------------------------------------------------------------
-- Cubre: getGeneralCollectionReport, getGeneralDailyCollectionGroupedReport,
--        getGeneralCollectionKPI, getGeneralYearlyCollectionKPI,
--        getGeneralMonthlyCollectionKPI, getGeneralYearlyCollectionGroupedReport,
--        getGeneralMonthlyCollectionGroupedReport
-- INCLUDE: todas las columnas de agregación y proyección → covering index
--          (evita Key Lookup sobre el clustered index en KPIs y reportes).
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM   sys.indexes i
    JOIN   sys.objects o ON i.object_id = o.object_id
    WHERE  o.name = 'Datos_ingreso'
      AND  i.name = 'IDX_DI_FechaPago_CodTitulo_CodIngreso'
)
    CREATE NONCLUSTERED INDEX IDX_DI_FechaPago_CodTitulo_CodIngreso
        ON Datos_ingreso (Fecha_Pago ASC, Cod_Titulo_Datos ASC, Cod_Ingreso ASC)
        INCLUDE (
            Fecha_Ingreso,
            Fecha_Vencimiento,
            Estado_Ingreso,
            ClaveCatastral,
            CodCliente_Ingreso,
            nombre,
            User_Cobro,
            FormaDePago,
            Valor_Titulo,
            ValorTerceros,
            Recargo,
            tasa_basura,
            descuento_tb,
            interes_mejoras
        )
        WITH (
            FILLFACTOR             = 85,
            STATISTICS_NORECOMPUTE = OFF
        )
GO


-- -----------------------------------------------------------------------------
-- IDX 2: Fecha_Ingreso + Cod_Titulo_Datos + Cod_Ingreso  (dateFilter=incomeDate)
-- Espejo del IDX 1 para el campo alternativo de fecha.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM   sys.indexes i
    JOIN   sys.objects o ON i.object_id = o.object_id
    WHERE  o.name = 'Datos_ingreso'
      AND  i.name = 'IDX_DI_FechaIngreso_CodTitulo_CodIngreso'
)
    CREATE NONCLUSTERED INDEX IDX_DI_FechaIngreso_CodTitulo_CodIngreso
        ON Datos_ingreso (Fecha_Ingreso ASC, Cod_Titulo_Datos ASC, Cod_Ingreso ASC)
        INCLUDE (
            Fecha_Pago,
            Fecha_Vencimiento,
            Estado_Ingreso,
            ClaveCatastral,
            CodCliente_Ingreso,
            nombre,
            User_Cobro,
            FormaDePago,
            Valor_Titulo,
            ValorTerceros,
            Recargo,
            tasa_basura,
            descuento_tb,
            interes_mejoras
        )
        WITH (
            FILLFACTOR             = 85,
            STATISTICS_NORECOMPUTE = OFF
        )
GO


-- -----------------------------------------------------------------------------
-- IDX 3: GROUP BY de reportes agrupados  (dateFilter=paymentDate)
-- Cubre: getGeneralDailyCollectionGroupedReport
--        getGeneralYearlyCollectionGroupedReport
--        getGeneralMonthlyCollectionGroupedReport
-- Razón: Todas las columnas del GROUP BY como key → el motor resuelve la
--        agregación con Ordered Index Scan sin operador Sort adicional.
-- INCLUDE: columnas de suma para evitar Key Lookup en las agregaciones.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM   sys.indexes i
    JOIN   sys.objects o ON i.object_id = o.object_id
    WHERE  o.name = 'Datos_ingreso'
      AND  i.name = 'IDX_DI_FechaPago_GroupBy_Cols'
)
    CREATE NONCLUSTERED INDEX IDX_DI_FechaPago_GroupBy_Cols
        ON Datos_ingreso (
            Fecha_Pago       ASC,
            User_Cobro       ASC,
            Cod_Titulo_Datos ASC,
            FormaDePago      ASC,
            Estado_Ingreso   ASC
        )
        INCLUDE (
            Cod_Ingreso,
            Valor_Titulo,
            ValorTerceros,
            Recargo,
            tasa_basura,
            descuento_tb,
            interes_mejoras,
            ClaveCatastral
        )
        WITH (
            FILLFACTOR             = 85,
            STATISTICS_NORECOMPUTE = OFF
        )
GO


-- -----------------------------------------------------------------------------
-- IDX 4: GROUP BY de reportes agrupados  (dateFilter=incomeDate)
-- Espejo del IDX 3 para el campo alternativo de fecha.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM   sys.indexes i
    JOIN   sys.objects o ON i.object_id = o.object_id
    WHERE  o.name = 'Datos_ingreso'
      AND  i.name = 'IDX_DI_FechaIngreso_GroupBy_Cols'
)
    CREATE NONCLUSTERED INDEX IDX_DI_FechaIngreso_GroupBy_Cols
        ON Datos_ingreso (
            Fecha_Ingreso    ASC,
            User_Cobro       ASC,
            Cod_Titulo_Datos ASC,
            FormaDePago      ASC,
            Estado_Ingreso   ASC
        )
        INCLUDE (
            Cod_Ingreso,
            Valor_Titulo,
            ValorTerceros,
            Recargo,
            tasa_basura,
            descuento_tb,
            interes_mejoras,
            ClaveCatastral
        )
        WITH (
            FILLFACTOR             = 85,
            STATISTICS_NORECOMPUTE = OFF
        )
GO


-- -----------------------------------------------------------------------------
-- IDX 5: Subconsulta EXISTS en KPIs  — ClaveCatastral + Fecha_Pago
-- Cubre: WHERE di_sub.ClaveCatastral = nc_in.Cuenta
--          AND di_sub.Fecha_Pago BETWEEN @inicio AND @fin
--          AND di_sub.Cod_Titulo_Datos = @code
-- Índice FILTRADO: excluye filas con ClaveCatastral NULL → índice ~30–40%
--   más pequeño, seeks más rápidos.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM   sys.indexes i
    JOIN   sys.objects o ON i.object_id = o.object_id
    WHERE  o.name = 'Datos_ingreso'
      AND  i.name = 'IDX_DI_ClaveCatastral_FechaPago_CodTitulo'
)
    CREATE NONCLUSTERED INDEX IDX_DI_ClaveCatastral_FechaPago_CodTitulo
        ON Datos_ingreso (ClaveCatastral ASC, Fecha_Pago ASC, Cod_Titulo_Datos ASC)
        WHERE ClaveCatastral IS NOT NULL
        WITH (
            FILLFACTOR             = 85,
            STATISTICS_NORECOMPUTE = OFF
        )
GO


-- -----------------------------------------------------------------------------
-- IDX 6: Subconsulta EXISTS en KPIs  — ClaveCatastral + Fecha_Ingreso
-- Espejo filtrado del IDX 5 para dateFilter=incomeDate.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM   sys.indexes i
    JOIN   sys.objects o ON i.object_id = o.object_id
    WHERE  o.name = 'Datos_ingreso'
      AND  i.name = 'IDX_DI_ClaveCatastral_FechaIngreso_CodTitulo'
)
    CREATE NONCLUSTERED INDEX IDX_DI_ClaveCatastral_FechaIngreso_CodTitulo
        ON Datos_ingreso (ClaveCatastral ASC, Fecha_Ingreso ASC, Cod_Titulo_Datos ASC)
        WHERE ClaveCatastral IS NOT NULL
        WITH (
            FILLFACTOR             = 85,
            STATISTICS_NORECOMPUTE = OFF
        )
GO


-- -----------------------------------------------------------------------------
-- IDX 7: Cod_Ingreso — paginación NOT IN (SELECT TOP N ...) y COUNT()
-- NOTA: Omite si Cod_Ingreso ya es PRIMARY KEY (clustered index).
--       OPTIMIZE_FOR_SEQUENTIAL_KEY: disponible desde SS2019, todas las
--       ediciones; reduce contención en el último nivel del B-Tree en
--       escenarios de inserts concurrentes monotónicamente crecientes.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM   sys.indexes i
    JOIN   sys.objects o ON i.object_id = o.object_id
    WHERE  o.name         = 'Datos_ingreso'
      AND  i.name         = 'IDX_DI_CodIngreso'
      AND  i.is_primary_key = 0
)
AND NOT EXISTS (
    -- No crear si Cod_Ingreso ya forma parte de la PK
    SELECT 1
    FROM   sys.indexes i
    JOIN   sys.objects o  ON i.object_id = o.object_id
    JOIN   sys.index_columns ic ON ic.object_id = i.object_id
                                AND ic.index_id  = i.index_id
    JOIN   sys.columns c  ON c.object_id = ic.object_id
                          AND c.column_id  = ic.column_id
    WHERE  o.name           = 'Datos_ingreso'
      AND  i.is_primary_key = 1
      AND  c.name           = 'Cod_Ingreso'
)
    CREATE NONCLUSTERED INDEX IDX_DI_CodIngreso
        ON Datos_ingreso (Cod_Ingreso ASC)
        WITH (
            FILLFACTOR                  = 90,
            OPTIMIZE_FOR_SEQUENTIAL_KEY = ON,
            STATISTICS_NORECOMPUTE      = OFF
        )
GO


-- =============================================================================
-- TABLA: AP_NotasCredito
-- =============================================================================

-- -----------------------------------------------------------------------------
-- IDX 8: Cuenta — join implícito con Datos_ingreso.ClaveCatastral en KPIs
-- INCLUDE: Valor → resuelve SUM(Valor) directamente desde el índice,
--          sin Key Lookup al clustered de AP_NotasCredito.
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM   sys.indexes i
    JOIN   sys.objects o ON i.object_id = o.object_id
    WHERE  o.name = 'AP_NotasCredito'
      AND  i.name = 'IDX_NC_Cuenta'
)
    CREATE NONCLUSTERED INDEX IDX_NC_Cuenta
        ON AP_NotasCredito (Cuenta ASC)
        INCLUDE (Valor)
        WITH (
            FILLFACTOR             = 85,
            STATISTICS_NORECOMPUTE = OFF
        )
GO


-- =============================================================================
-- ACTUALIZACIÓN DE ESTADÍSTICAS POST-CREACIÓN
-- Después de crear índices sobre tablas grandes, recalcula estadísticas con
-- escaneo completo para que el optimizador tenga información precisa.
-- =============================================================================
UPDATE STATISTICS Datos_ingreso   WITH FULLSCAN;
UPDATE STATISTICS AP_NotasCredito WITH FULLSCAN;
GO


-- =============================================================================
-- RESUMEN DE ÍNDICES — SQL Server 2022 Standard/Developer/Express
-- =============================================================================
--
-- Tabla Datos_ingreso  (7 índices nonclustered)
-- ┌─────┬───────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────┐
-- │ IDX │ Key columns                                                        │ INCLUDE / Nota especial                           │
-- ├─────┼───────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
-- │  1  │ Fecha_Pago, Cod_Titulo_Datos, Cod_Ingreso                          │ INCLUDE 14 cols → covering index full report       │
-- │  2  │ Fecha_Ingreso, Cod_Titulo_Datos, Cod_Ingreso                       │ INCLUDE 14 cols → covering index full report       │
-- │  3  │ Fecha_Pago, User_Cobro, Cod_Titulo_Datos, FormaDePago, Estado_Ing. │ INCLUDE sumas   → GROUP BY sin Sort operator       │
-- │  4  │ Fecha_Ingreso, User_Cobro, Cod_Titulo_Datos, FormaDePago, Estado…  │ INCLUDE sumas   → GROUP BY sin Sort operator       │
-- │  5  │ ClaveCatastral, Fecha_Pago, Cod_Titulo_Datos                       │ FILTERED (NOT NULL) → seeks más rápidos en KPIs   │
-- │  6  │ ClaveCatastral, Fecha_Ingreso, Cod_Titulo_Datos                    │ FILTERED (NOT NULL) → seeks más rápidos en KPIs   │
-- │  7  │ Cod_Ingreso                                                        │ OPTIMIZE_FOR_SEQUENTIAL_KEY → paginación NOT IN    │
-- └─────┴───────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────┘
--
-- Tabla AP_NotasCredito  (1 índice)
-- ┌─────┬────────┬───────────────────────────────────────────────────────────┐
-- │  8  │ Cuenta │ INCLUDE (Valor) → SUM(Valor) sin Key Lookup               │
-- └─────┴────────┴───────────────────────────────────────────────────────────┘
--
-- Opciones disponibles en TODAS las ediciones de SS2022:
--   FILLFACTOR, STATISTICS_NORECOMPUTE, OPTIMIZE_FOR_SEQUENTIAL_KEY,
--   índices filtrados (WHERE), INCLUDE.
--
-- Solo Enterprise:  ONLINE = ON,  SORT_IN_TEMPDB = ON  (no usados aquí).
-- =============================================================================
