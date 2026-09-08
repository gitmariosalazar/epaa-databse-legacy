export const Queries = {
  findAllPaymentByDateAndOrderValue: (paymentDate: string, orderValue: number) => /*sql*/`
        SET NOCOUNT ON;
        SET ANSI_WARNINGS OFF;
          SELECT TOP 1500
            di.Cod_Ingreso AS income_code,
            di.CodCliente_Ingreso AS card_id,
            di.nombre AS name,
            di.Fecha_Ingreso AS income_date,
            di.Fecha_Pago AS payment_date,
            di.Estado_Ingreso AS income_status,
            di.Cod_Titulo_Datos AS title_code,
            di.Fecha_Venc_Interes AS due_date,
            di.Valor_Titulo AS title_value,
            di.ValorTerceros AS third_party_value,
            di.Recargo AS surcharge,
            di.tasa_basura AS trash_rate,
            di.ClaveCatastral AS cadastral_key,
            (COALESCE(di.Valor_Titulo,0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.tasa_basura, 0)) AS total,
            di.User_Cobro AS payment_user,
            v.Valor AS value,
            v.orden AS order_value,
            di.FormaDePago AS payment_method,
            di.Comentario AS comment
          FROM Datos_ingreso di
              INNER JOIN Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND V.orden = ${orderValue}
          WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${String(paymentDate)} 00:00:00.000', 120)
            AND di.Fecha_Pago <= CONVERT(DATETIME, '${String(paymentDate)} 23:59:59.997', 120)
            AND v.orden = ${orderValue}
          ORDER BY di.Fecha_Ingreso DESC;
      `,
  findAllPaymentReadingPayrollsByDate: (paymentDate: string) => /*sql*/`
      SET NOCOUNT ON;
      SET ANSI_WARNINGS OFF;
      SELECT TOP 1500
          di.Cod_Ingreso                  AS income_code,
          c.CED_IDENT_CIUDADANO           AS card_id,
          c.NOMBRES_CIUDADANO             AS name,
          c.APELLIDOS_CIUDADANO           AS last_name,
          di.ClaveCatastral               AS cadastral_key,
          di.Direccion                    AS address,
          a.Tarifa                        AS rate,
          l.Mes                           AS month,
          l.Anio                          AS year,
          l.LecturaActual                 AS current_reading,
          l.LecturaAnterior               AS previous_reading,
          l.ValorAPagar                   AS reading_value,
          di.User_Cobro                   AS payment_user,
          di.Cod_Titulo_Datos             AS title_code,
          di.Recargo                      AS surcharge,
          CASE
              WHEN l.LecturaActual IS NOT NULL
              THEN (l.LecturaActual - l.LecturaAnterior)
              ELSE NULL
          END                             AS consumption,

          CASE
              WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
              WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE()
                  THEN 'Pendiente de lectura (período actual/futuro)'
              WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE()
                  THEN 'Lectura no registrada o pendiente'
              ELSE 'No disponible'
          END                             AS reading_status,

          di.Fecha_Pago                   AS payment_date,

          CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura      ELSE NULL END AS trash_rate,
          CASE WHEN l.LecturaActual IS NOT NULL THEN (di.Valor_Titulo + di.Recargo)   ELSE NULL END AS epaa_value,
          CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros    ELSE NULL END AS third_party_value,

          CASE WHEN l.LecturaActual IS NOT NULL
              THEN COALESCE(di.Valor_Titulo, 0) +
                    COALESCE(di.ValorTerceros, 0) +
                    COALESCE(di.tasa_basura, 0) + COALESCE(di.Recargo, 0)
              ELSE NULL
          END                             AS total,

          di.Fecha_Venc_Interes           AS due_date,
          di.Estado_Ingreso               AS income_status,
          di.Fecha_Ingreso                AS income_date,
          v.Valor                         AS value,
          v.orden                         AS order_value,
          di.FormaDePago                  AS payment_method,
          di.Comentario                   AS comment

      FROM Datos_ingreso di
      INNER JOIN CIUDADANO c
          ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

      INNER JOIN AP_ACOMETIDAS a
          ON a.Sector =
              CASE
                  WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                      AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                      AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                  THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                  ELSE -1
              END
          AND a.Cuenta =
              CASE
                  WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                      AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                  THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                  ELSE -1
              END

      LEFT JOIN AP_LECTURAS l
          ON l.ClaveCatastral = di.ClaveCatastral
          AND l.Anio = YEAR(DATEADD(month, -1, di.Fecha_Venc_Interes))
          AND UPPER(LTRIM(RTRIM(l.Mes))) = UPPER(
              CASE MONTH(DATEADD(month, -1, di.Fecha_Venc_Interes))
                  WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                  WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                  WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                  WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
              END
          )
      INNER JOIN dbo.Valor V ON di.Cod_Ingreso = V.cod_Ingreso AND v.orden = 10
      WHERE
          di.Fecha_Pago >= CONVERT(DATETIME, '${String(paymentDate)} 00:00:00.000', 120)
          AND di.Fecha_Pago <= CONVERT(DATETIME, '${String(paymentDate)} 23:59:59.997', 120)

      ORDER BY
          di.ClaveCatastral,
          di.Fecha_Ingreso DESC;
      `,
  findAllPaymentByDate: (paymentDate: string) => /*sql*/`
        SET NOCOUNT ON
            SELECT
              di.Cod_Ingreso AS income_code,
              di.CodCliente_Ingreso AS card_id,
              di.nombre AS name,
              di.Fecha_Ingreso AS income_date,
              di.Fecha_Pago AS payment_date,
              di.Estado_Ingreso AS income_status,
              di.Cod_Titulo_Datos AS title_code,
              di.Fecha_Venc_Interes AS due_date,
              di.Valor_Titulo AS title_value,
              di.ValorTerceros AS third_party_value,
              di.Recargo AS surcharge,
              di.tasa_basura AS trash_rate,
              di.ClaveCatastral AS cadastral_key,
              di.FormaDePago AS payment_method,
              di.Comentario AS comment,
              (COALESCE(di.Valor_Titulo,0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.tasa_basura, 0)) AS total,
              di.User_Cobro AS payment_user,
              v.value
            FROM Datos_ingreso di
            CROSS APPLY (
                SELECT SUM(v2.Valor) AS value
                FROM Valor v2
                WHERE v2.cod_Ingreso = di.Cod_Ingreso
                HAVING COUNT(v2.cod_Ingreso) > 0
            ) v
            WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${String(paymentDate)} 00:00:00.000', 120)
              AND di.Fecha_Pago <= CONVERT(DATETIME, '${String(paymentDate)} 23:59:59.997', 120)
            ORDER BY di.Fecha_Ingreso DESC;
        `,
  findAllPaymentByInitDateAndEndDate: (initDate: string, endDate: string) => /*sql*/`
        SET NOCOUNT ON

        SELECT 
          di.Cod_Ingreso AS income_code,
          di.CodCliente_Ingreso AS card_id,
          di.nombre AS name,
          di.Fecha_Ingreso AS income_date,
          di.Fecha_Pago AS payment_date,
          di.Estado_Ingreso AS income_status,
          di.Cod_Titulo_Datos AS title_code,
          di.Fecha_Venc_Interes AS due_date,
          di.Valor_Titulo AS title_value,
          di.ValorTerceros AS third_party_value,
          di.Recargo AS surcharge,
          di.tasa_basura AS trash_rate,
          di.ClaveCatastral AS cadastral_key,
          di.FormaDePago AS payment_method,
          di.Comentario AS comment,
          (COALESCE(di.Valor_Titulo,0) + COALESCE(di.ValorTerceros,0) +
           COALESCE(di.Recargo,0) + COALESCE(di.tasa_basura,0)) AS total,
          di.User_Cobro AS payment_user,
          v.value
        FROM Datos_ingreso di
        CROSS APPLY (
            SELECT SUM(v2.Valor) AS value
            FROM Valor v2
            WHERE v2.cod_Ingreso = di.Cod_Ingreso
            HAVING COUNT(v2.cod_Ingreso) > 0
        ) v
        WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${String(initDate)} 00:00:00.000', 120)
          AND di.Fecha_Pago <= CONVERT(DATETIME, '${String(endDate)} 23:59:59.997', 120)
        ORDER BY di.Fecha_Ingreso DESC;
        `,
  findAllOverduePayments: (safeLimit: number, safeOffset: number) => /*sql*/`
      SET NOCOUNT ON;

      DECLARE @Corte DATETIME;
      SET @Corte = DATEADD(dd, DATEDIFF(dd, 0, GETDATE()) + 1, 0);

      SELECT 
        IDENTITY(int, 1, 1) AS rn,
        di.ClaveCatastral AS cadastral_key,
        di.CodCliente_Ingreso AS client_id,
        MAX(di.nombre) AS name,
        SUM(COALESCE(di.tasa_basura, 0))          AS total_trash_rate,
        SUM(COALESCE(di.Valor_Titulo, 0))         AS total_epaa_value,
        SUM(COALESCE(di.interes_mejoras, 0))      AS total_old_improvements_interest,
        SUM(COALESCE(di.Recargo, 0))              AS total_surcharge,
        SUM(COALESCE(di.Recargo_old, 0))          AS total_old_surcharge,
        COUNT(di.Cod_Ingreso)                     AS months_past_due,
        
        -- Suma el valor pre-calculado de la tabla física de caché
        SUM(COALESCE(c.interes_calculado, 0))     AS total_interest_calculated,
        
        -- Suma total general sumando el interés pre-calculado
        SUM(
            COALESCE(di.tasa_basura, 0) +
            COALESCE(di.Valor_Titulo, 0) +
            COALESCE(di.interes_mejoras, 0) +
            COALESCE(di.Recargo, 0) +
            COALESCE(c.interes_calculado, 0)
        )                                         AS total_debt_amount,
        -- Fechas
        MIN(di.Fecha_Ingreso)                     AS emision_date_more_old,
        MAX(di.Fecha_Ingreso)                     AS emision_date_more_recent,
        MIN(di.Fecha_Venc_Interes)                AS due_date_more_old,
        MAX(di.Fecha_Venc_Interes)                AS due_date_more_recent,
        -- Días transcurridos desde el vencimiento de la planilla más antigua
        DATEDIFF(day, MIN(di.Fecha_Venc_Interes), @Corte) AS days_since_due,
        -- Días transcurridos desde la fecha de ingreso
        DATEDIFF(day, MIN(di.Fecha_Ingreso), @Corte) AS days_since_emission
      INTO #OverdueTemp
      FROM Datos_ingreso di
      -- CRUCE CON LA CACHÉ
      LEFT JOIN dbo.Datos_ingreso_interes_cache c
        ON di.Cod_Ingreso = c.Cod_Ingreso
      WHERE di.Fecha_Pago IS NULL
        AND di.Estado_Ingreso IS NULL
        AND di.convenio IS NULL
        AND di.Fecha_Venc_Interes < @Corte

      GROUP BY di.ClaveCatastral, di.CodCliente_Ingreso
      HAVING COUNT(di.Cod_Ingreso) > 1
      ORDER BY di.CodCliente_Ingreso, di.ClaveCatastral;

      SELECT TOP ${safeLimit}
        cadastral_key,
        client_id,
        name,
        total_trash_rate,
        total_epaa_value,
        total_old_improvements_interest,
        total_surcharge,
        total_old_surcharge,
        months_past_due,
        total_interest_calculated,
        total_debt_amount,
        emision_date_more_old,
        emision_date_more_recent,
        due_date_more_old,
        due_date_more_recent,
        days_since_due,
        days_since_emission
      FROM #OverdueTemp
      WHERE rn > ${safeOffset}
      ORDER BY rn;

      DROP TABLE #OverdueTemp;
    `,
  findOverdueSummary: () => /*sql*/`
        SET NOCOUNT ON;

        DECLARE @Corte DATETIME;
        SET @Corte = DATEADD(dd, DATEDIFF(dd, 0, GETDATE()) + 1, 0);

        SELECT
            COUNT(DISTINCT CodCliente_Ingreso) AS total_clients_with_debt,
            COUNT(DISTINCT ClaveCatastral)     AS total_unique_cadastral_keys,

            SUM(months_past_due)               AS total_months_past_due,
            SUM(total_debt_amount)             AS total_debt_amount,

            SUM(total_epaa_value)              AS total_epaa_value,
            SUM(total_trash_rate)              AS total_trash_rate,
            SUM(total_surcharge)               AS total_surcharge,
            SUM(total_old_surcharge)           AS total_old_surcharge,
            SUM(total_improvements_interest)   AS total_improvements_interest,
            SUM(total_interest_calculated)     AS total_interest_calculated,
            AVG(CAST(months_past_due AS DECIMAL(10,2))) AS avg_months_past_due,
            MAX(months_past_due)               AS max_months_in_debt,
            MIN(months_past_due)               AS min_months_in_debt,

            COUNT(DISTINCT CASE WHEN months_past_due >= 6 THEN CodCliente_Ingreso END)  AS clients_over_6_months,
            COUNT(DISTINCT CASE WHEN months_past_due >= 12 THEN CodCliente_Ingreso END) AS clients_over_1_year,

            MAX(DATEDIFF(DAY, oldest_due_date, @Corte)) AS max_days_in_debt,
            AVG(total_debt_amount) AS avg_debt_per_client

        FROM (
            SELECT
                di.CodCliente_Ingreso,
                di.ClaveCatastral,

                COUNT(*) AS months_past_due,

                SUM(ISNULL(di.Valor_Titulo, 0)) AS total_epaa_value,
                SUM(ISNULL(di.ValorTerceros, 0)) AS total_terceros,
                SUM(ISNULL(di.tasa_basura, 0)) AS total_trash_rate,
                SUM(ISNULL(di.Recargo, 0)) AS total_surcharge,
                SUM(ISNULL(di.Recargo_old, 0)) AS total_old_surcharge,
                SUM(ISNULL(di.interes_mejoras, 0)) AS total_improvements_interest,
                SUM(ISNULL(c.interes_calculado, 0)) AS total_interest_calculated,

                SUM(
                    ISNULL(di.Valor_Titulo, 0)
                  + ISNULL(di.tasa_basura, 0)
                  + ISNULL(di.interes_mejoras, 0)
                  + ISNULL(di.Recargo, 0)
                  + ISNULL(c.interes_calculado, 0)
                ) AS total_debt_amount,

                MIN(di.Fecha_Venc_Interes) AS oldest_due_date

            FROM Datos_ingreso di
              LEFT JOIN dbo.Datos_ingreso_interes_cache c
                ON di.Cod_Ingreso = c.Cod_Ingreso
            INNER JOIN (
                SELECT CodCliente_Ingreso
                FROM Datos_ingreso
                WHERE Fecha_Pago IS NULL
                  AND Estado_Ingreso IS NULL
                  AND convenio IS NULL
                  AND Fecha_Venc_Interes < @Corte
                GROUP BY CodCliente_Ingreso
                HAVING COUNT(*) > 1
            ) AS cv ON di.CodCliente_Ingreso = cv.CodCliente_Ingreso

            WHERE di.Fecha_Pago IS NULL
              AND di.Estado_Ingreso IS NULL
              AND di.convenio IS NULL
              AND di.Fecha_Venc_Interes < @Corte

            GROUP BY
                di.CodCliente_Ingreso,
                di.ClaveCatastral
            HAVING COUNT(*) > 1
        ) AS base;
      `,
  findYearlyOverdueSummary: () => /*sql*/`
        SET NOCOUNT ON;

        DECLARE @Today DATETIME;
        SET @Today = DATEADD(dd, DATEDIFF(dd, 0, GETDATE()) + 1, 0);

        SELECT
            b.[year],

            t.total_unique_clients,
            t.total_unique_cadastral_keys,

            COUNT(DISTINCT b.CodCliente_Ingreso) AS clients_with_debt,
            COUNT(DISTINCT b.ClaveCatastral)     AS total_unique_cadastral_keys_by_year,

            SUM(months_past_due) AS total_months_past_due,
            SUM(total_debt_amount) AS total_debt_amount,

            SUM(total_epaa_value) AS total_epaa_value,
            SUM(total_trash_rate) AS total_trash_rate,
            SUM(total_surcharge) AS total_surcharge,
            SUM(total_old_surcharge) AS total_old_surcharge,
            SUM(total_improvements_interest) AS total_improvements_interest,
            SUM(total_interest_calculated) AS total_interest_calculated,

            AVG(CAST(months_past_due AS DECIMAL(10,2))) AS avg_months_past_due,
            MAX(months_past_due) AS max_months_in_debt,
            MIN(months_past_due) AS min_months_in_debt,

            COUNT(DISTINCT CASE WHEN months_past_due >= 6 THEN b.CodCliente_Ingreso END)  AS clients_over_6_months,
            COUNT(DISTINCT CASE WHEN months_past_due >= 12 THEN b.CodCliente_Ingreso END) AS clients_over_1_year,

            MAX(DATEDIFF(DAY, oldest_due_date, @Today)) AS max_days_in_debt,

            CAST(AVG(CAST(total_debt_amount AS DECIMAL(18,2))) AS DECIMAL(18,2)) AS avg_debt_per_client

        FROM (
            SELECT
                di.CodCliente_Ingreso,
                di.ClaveCatastral,
                YEAR(di.Fecha_Venc_Interes) AS [year],

                COUNT(*) AS months_past_due,

                SUM(ISNULL(di.Valor_Titulo, 0)) AS total_epaa_value,
                SUM(ISNULL(di.ValorTerceros, 0)) AS total_terceros,
                SUM(ISNULL(di.tasa_basura, 0)) AS total_trash_rate,
                SUM(ISNULL(di.Recargo, 0)) AS total_surcharge,
                SUM(ISNULL(di.Recargo_old, 0)) AS total_old_surcharge,
                SUM(ISNULL(di.interes_mejoras, 0)) AS total_improvements_interest,
                SUM(ISNULL(c.interes_calculado, 0)) AS total_interest_calculated,

                SUM(
                    ISNULL(di.tasa_basura, 0)
                  + ISNULL(di.Valor_Titulo, 0)
                  + ISNULL(di.interes_mejoras, 0)
                  + ISNULL(di.Recargo, 0)
                  + ISNULL(c.interes_calculado, 0)
                ) AS total_debt_amount,

                MIN(di.Fecha_Venc_Interes) AS oldest_due_date

            FROM Datos_ingreso di
            LEFT JOIN dbo.Datos_ingreso_interes_cache c
              ON di.Cod_Ingreso = c.Cod_Ingreso
            INNER JOIN (
                SELECT
                    CodCliente_Ingreso,
                    ClaveCatastral
                FROM Datos_ingreso
                WHERE Fecha_Pago IS NULL
                  AND Estado_Ingreso IS NULL
                  AND convenio IS NULL
                  AND Fecha_Venc_Interes < @Today
                GROUP BY CodCliente_Ingreso, ClaveCatastral
                HAVING COUNT(*) > 1
            ) AS cv ON di.CodCliente_Ingreso = cv.CodCliente_Ingreso
                  AND di.ClaveCatastral = cv.ClaveCatastral

            WHERE di.Fecha_Pago IS NULL
              AND di.Estado_Ingreso IS NULL
              AND di.convenio IS NULL
              AND di.Fecha_Venc_Interes < @Today

            GROUP BY
                di.CodCliente_Ingreso,
                di.ClaveCatastral,
                YEAR(di.Fecha_Venc_Interes)
        ) AS b
        CROSS JOIN (
            SELECT
                COUNT(DISTINCT CodCliente_Ingreso) AS total_unique_clients,
                COUNT(DISTINCT ClaveCatastral)     AS total_unique_cadastral_keys
            FROM (
                SELECT
                    di.CodCliente_Ingreso,
                    di.ClaveCatastral
                FROM Datos_ingreso di
                INNER JOIN (
                    SELECT
                        CodCliente_Ingreso,
                        ClaveCatastral
                    FROM Datos_ingreso
                    WHERE Fecha_Pago IS NULL
                      AND Estado_Ingreso IS NULL
                      AND convenio IS NULL
                      AND Fecha_Venc_Interes < @Today
                    GROUP BY CodCliente_Ingreso, ClaveCatastral
                    HAVING COUNT(*) > 1
                ) AS cv ON di.CodCliente_Ingreso = cv.CodCliente_Ingreso
                      AND di.ClaveCatastral = cv.ClaveCatastral
                WHERE di.Fecha_Pago IS NULL
                  AND di.Estado_Ingreso IS NULL
                  AND di.convenio IS NULL
                  AND di.Fecha_Venc_Interes < @Today
                GROUP BY
                    di.CodCliente_Ingreso,
                    di.ClaveCatastral
            ) AS base_totales
        ) AS t

        GROUP BY
            b.[year],
            t.total_unique_clients,
            t.total_unique_cadastral_keys

        ORDER BY b.[year] DESC;
      `,
  findMonthlyDebtSummary: () => /*sql*/`
        SET NOCOUNT ON;
        SET ANSI_WARNINGS OFF;
        DECLARE @Today DATETIME;
        SET @Today = DATEADD(dd, DATEDIFF(dd, 0, GETDATE()) + 1, 0);

        SELECT 
            CodCliente_Ingreso,
            ClaveCatastral
        INTO #clientes_validos
        FROM Datos_ingreso
        WHERE Fecha_Pago IS NULL
          AND Estado_Ingreso IS NULL
          AND convenio IS NULL
          AND Fecha_Venc_Interes < @Today
        GROUP BY CodCliente_Ingreso, ClaveCatastral
        HAVING COUNT(*) > 1

        SELECT
            di.CodCliente_Ingreso,
            di.ClaveCatastral,
            YEAR(di.Fecha_Venc_Interes)     AS [year],
            MONTH(di.Fecha_Venc_Interes)    AS [month],

            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO'     WHEN 2 THEN 'FEBRERO'   WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL'     WHEN 5 THEN 'MAYO'      WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO'     WHEN 8 THEN 'AGOSTO'    WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE'  WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END AS month_name,

            COUNT(*) AS months_past_due,

            SUM(ISNULL(di.Valor_Titulo, 0))          AS total_epaa_value,
            SUM(ISNULL(di.ValorTerceros, 0))         AS total_terceros,
            SUM(ISNULL(di.tasa_basura, 0))           AS total_trash_rate,
            SUM(ISNULL(di.Recargo, 0))               AS total_surcharge,
            SUM(ISNULL(di.Recargo_old, 0))           AS total_old_surcharge,
            SUM(ISNULL(di.interes_mejoras, 0))       AS total_improvements_interest,
            SUM(ISNULL(c.interes_calculado, 0))      AS total_interest_calculated,

            SUM(
                ISNULL(di.tasa_basura, 0)
              + ISNULL(di.Valor_Titulo, 0)
              + ISNULL(di.interes_mejoras, 0)
              + ISNULL(di.Recargo, 0)
              + ISNULL(c.interes_calculado, 0)
            ) AS total_debt_amount,

            MIN(di.Fecha_Venc_Interes) AS oldest_due_date

        INTO #base
        FROM Datos_ingreso di
        LEFT JOIN dbo.Datos_ingreso_interes_cache c
            ON di.Cod_Ingreso = c.Cod_Ingreso
        INNER JOIN #clientes_validos cv
            ON di.CodCliente_Ingreso = cv.CodCliente_Ingreso
          AND di.ClaveCatastral = cv.ClaveCatastral
        WHERE di.Fecha_Pago IS NULL
          AND di.Estado_Ingreso IS NULL
          AND di.convenio IS NULL
          AND di.Fecha_Venc_Interes < @Today
        GROUP BY 
            di.CodCliente_Ingreso,
            di.ClaveCatastral,
            YEAR(di.Fecha_Venc_Interes),
            MONTH(di.Fecha_Venc_Interes)

        SELECT
            COUNT(DISTINCT CodCliente_Ingreso) AS total_unique_clients,
            COUNT(DISTINCT ClaveCatastral)     AS total_unique_cadastral_keys
        INTO #totales
        FROM #base

        SELECT
            b.[year],
            b.[month],
            b.month_name,

            t.total_unique_clients,
            t.total_unique_cadastral_keys,

            COUNT(DISTINCT b.CodCliente_Ingreso) AS clients_with_debt_this_month,
            COUNT(DISTINCT b.ClaveCatastral)     AS unique_cadastral_keys_this_month,

            SUM(b.months_past_due)               AS total_months_past_due,
            SUM(b.total_debt_amount)             AS total_debt_amount,

            SUM(b.total_epaa_value)              AS total_epaa_value,
            SUM(b.total_trash_rate)              AS total_trash_rate,
            SUM(b.total_surcharge)               AS total_surcharge,
            SUM(b.total_old_surcharge)           AS total_old_surcharge,
            SUM(b.total_improvements_interest)   AS total_improvements_interest,
            SUM(b.total_interest_calculated)     AS total_interest_calculated,

            AVG(CAST(b.months_past_due AS DECIMAL(10,2))) AS avg_months_past_due,
            MAX(b.months_past_due)                        AS max_months_in_debt,
            MIN(b.months_past_due)                        AS min_months_in_debt,

            COUNT(DISTINCT CASE WHEN b.months_past_due >= 6 THEN b.CodCliente_Ingreso END)  
                AS clients_over_6_months,

            COUNT(DISTINCT CASE WHEN b.months_past_due >= 12 THEN b.CodCliente_Ingreso END) 
                AS clients_over_1_year,

            MAX(DATEDIFF(DAY, b.oldest_due_date, @Today)) AS max_days_in_debt,

            CAST(AVG(CAST(b.total_debt_amount AS DECIMAL(18,2))) AS DECIMAL(18,2)) 
                AS avg_debt_per_client

        FROM #base b
        CROSS JOIN #totales t

        GROUP BY 
            b.[year],
            b.[month],
            b.month_name,
            t.total_unique_clients,
            t.total_unique_cadastral_keys

        ORDER BY b.[year] DESC, b.[month] DESC;

        DROP TABLE #clientes_validos
        DROP TABLE #base
        DROP TABLE #totales
        `,
  findPendingReadingsByCadastralKey: (cadastralKey: string) => /*sql*/`
        SET NOCOUNT ON;
        DECLARE @searchParam VARCHAR(50);
        SET @searchParam = '${String(cadastralKey).trim()}';

        IF CHARINDEX('-', @searchParam) = 0
        BEGIN

        SELECT
            c.CED_IDENT_CIUDADANO           AS card_id,
            c.NOMBRES_CIUDADANO             AS name,
            c.APELLIDOS_CIUDADANO           AS last_name,
            di.ClaveCatastral               AS cadastral_key,
            di.Direccion                    AS address,
            a.Tarifa                        AS rate,
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
            l.Mes                           AS month,
            l.Anio                          AS year,
            l.LecturaActual                 AS current_reading,
            l.LecturaAnterior               AS previous_reading,
            l.ValorAPagar                   AS reading_value,
            CASE 
                WHEN l.LecturaActual IS NOT NULL 
                THEN (l.LecturaActual - l.LecturaAnterior) 
                ELSE NULL 
            END                             AS consumption,

            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END                             AS month_due,
            
            YEAR(di.Fecha_Venc_Interes)     AS year_due,

            CASE
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE() 
                    THEN 'Pendiente de lectura (período actual/futuro)'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE() 
                    THEN 'Lectura no registrada o pendiente'
                ELSE 'No disponible'
            END                             AS reading_status,

            di.Fecha_Pago                   AS payment_date,
            
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura      ELSE NULL END AS trash_rate,
            CASE WHEN l.LecturaActual IS NOT NULL THEN (di.Valor_Titulo + di.Recargo)    ELSE NULL END AS epaa_value,
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros    ELSE NULL END AS third_party_value,
            
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN COALESCE(di.Valor_Titulo, 0) + 
                      COALESCE(di.ValorTerceros, 0) + 
                      dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) +
                      COALESCE(di.tasa_basura, 0) + COALESCE(di.Recargo, 0)
                ELSE NULL 
            END                             AS total,

            di.Fecha_Venc_Interes           AS due_date,
            di.Estado_Ingreso               AS income_status,
            di.Fecha_Ingreso                AS income_date

        FROM Datos_ingreso di
        INNER JOIN CIUDADANO c 
            ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

        INNER JOIN AP_ACOMETIDAS a
            ON a.Sector = 
                CASE 
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                        AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                        AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                    THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                    ELSE -1
                END
            AND a.Cuenta = 
                CASE 
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                        AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                    THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                    ELSE -1
                END

        LEFT JOIN AP_LECTURAS l
            ON l.CodigoIngresoARentas = di.Cod_Ingreso

        
        WHERE
            di.CodCliente_Ingreso = @searchParam

            AND di.Fecha_Pago IS NULL
            AND di.convenio   IS NULL
            AND di.Estado_Ingreso IS NULL

        ORDER BY 
            di.ClaveCatastral,
            di.Fecha_Venc_Interes DESC;
      
        END
        ELSE
        BEGIN

        SELECT
            c.CED_IDENT_CIUDADANO           AS card_id,
            c.NOMBRES_CIUDADANO             AS name,
            c.APELLIDOS_CIUDADANO           AS last_name,
            di.ClaveCatastral               AS cadastral_key,
            di.Direccion                    AS address,
            a.Tarifa                        AS rate,
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
            l.Mes                           AS month,
            l.Anio                          AS year,
            l.LecturaActual                 AS current_reading,
            l.LecturaAnterior               AS previous_reading,
            l.ValorAPagar                   AS reading_value,
            CASE 
                WHEN l.LecturaActual IS NOT NULL 
                THEN (l.LecturaActual - l.LecturaAnterior) 
                ELSE NULL 
            END                             AS consumption,

            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END                             AS month_due,
            
            YEAR(di.Fecha_Venc_Interes)     AS year_due,

            CASE
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE() 
                    THEN 'Pendiente de lectura (período actual/futuro)'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE() 
                    THEN 'Lectura no registrada o pendiente'
                ELSE 'No disponible'
            END                             AS reading_status,

            di.Fecha_Pago                   AS payment_date,
            
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura      ELSE NULL END AS trash_rate,
            CASE WHEN l.LecturaActual IS NOT NULL THEN (di.Valor_Titulo + di.Recargo)    ELSE NULL END AS epaa_value,
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros    ELSE NULL END AS third_party_value,
            
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN COALESCE(di.Valor_Titulo, 0) + 
                      COALESCE(di.ValorTerceros, 0) + 
                      dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) +
                      COALESCE(di.tasa_basura, 0) + COALESCE(di.Recargo, 0)
                ELSE NULL 
            END                             AS total,

            di.Fecha_Venc_Interes           AS due_date,
            di.Estado_Ingreso               AS income_status,
            di.Fecha_Ingreso                AS income_date

        FROM Datos_ingreso di
        INNER JOIN CIUDADANO c 
            ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

        INNER JOIN AP_ACOMETIDAS a
            ON a.Sector = 
                CASE 
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                        AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                        AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                    THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                    ELSE -1
                END
            AND a.Cuenta = 
                CASE 
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                        AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                    THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                    ELSE -1
                END

        LEFT JOIN AP_LECTURAS l
            ON l.CodigoIngresoARentas = di.Cod_Ingreso

        
        WHERE
            di.ClaveCatastral = @searchParam

            AND di.Fecha_Pago IS NULL
            AND di.convenio   IS NULL
            AND di.Estado_Ingreso IS NULL

        ORDER BY 
            di.ClaveCatastral,
            di.Fecha_Venc_Interes DESC;
      
        END
`,
  findPendingReadingsByCardId: (cardId: string) => /*sql*/`
        SET NOCOUNT ON;
        DECLARE @searchParam VARCHAR(50);
        SET @searchParam = '${String(cardId).trim()}';

        IF CHARINDEX('-', @searchParam) = 0
        BEGIN

      SELECT
          c.CED_IDENT_CIUDADANO           AS card_id,
          c.NOMBRES_CIUDADANO             AS name,
          c.APELLIDOS_CIUDADANO           AS last_name,
          di.ClaveCatastral               AS cadastral_key,
          di.Direccion                    AS address,
          a.Tarifa                        AS rate,
          dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
          l.Mes                           AS month,
          l.Anio                          AS year,
          l.LecturaActual                 AS current_reading,
          l.LecturaAnterior               AS previous_reading,
          l.ValorAPagar                   AS reading_value,
          CASE 
              WHEN l.LecturaActual IS NOT NULL 
              THEN (l.LecturaActual - l.LecturaAnterior) 
              ELSE NULL 
          END                             AS consumption,

          CASE MONTH(di.Fecha_Venc_Interes)
              WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
              WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
              WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
              WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
          END                             AS month_due,
          
          YEAR(di.Fecha_Venc_Interes)     AS year_due,

          CASE
              WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
              WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE() 
                  THEN 'Pendiente de lectura (período actual/futuro)'
              WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE() 
                  THEN 'Lectura no registrada o pendiente'
              ELSE 'No disponible'
          END                             AS reading_status,

          di.Fecha_Pago                   AS payment_date,
          
          CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura      ELSE NULL END AS trash_rate,
          CASE WHEN l.LecturaActual IS NOT NULL THEN (di.Valor_Titulo + di.Recargo)     ELSE NULL END AS epaa_value,
          CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros    ELSE NULL END AS third_party_value,
          
          CASE WHEN l.LecturaActual IS NOT NULL 
              THEN COALESCE(di.Valor_Titulo, 0) + 
                    COALESCE(di.ValorTerceros, 0) + 
                    dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) +
                    COALESCE(di.tasa_basura, 0) + COALESCE(di.Recargo, 0)
              ELSE NULL 
          END                             AS total,

          di.Fecha_Venc_Interes           AS due_date,
          di.Estado_Ingreso               AS income_status,
          di.Fecha_Ingreso                AS income_date

      FROM Datos_ingreso di
      INNER JOIN CIUDADANO c 
          ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

      INNER JOIN AP_ACOMETIDAS a
          ON a.Sector = 
              CASE 
                  WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                      AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                      AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                  THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                  ELSE -1
              END
          AND a.Cuenta = 
              CASE 
                  WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                      AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                  THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                  ELSE -1
              END

      LEFT JOIN AP_LECTURAS l
          ON l.CodigoIngresoARentas = di.Cod_Ingreso

      
        WHERE
            di.CodCliente_Ingreso = @searchParam

          AND di.Fecha_Pago IS NULL
          AND di.convenio   IS NULL
          AND di.Estado_Ingreso IS NULL

      ORDER BY 
          di.ClaveCatastral,
          di.Fecha_Venc_Interes DESC;
    
        END
        ELSE
        BEGIN

      SELECT
          c.CED_IDENT_CIUDADANO           AS card_id,
          c.NOMBRES_CIUDADANO             AS name,
          c.APELLIDOS_CIUDADANO           AS last_name,
          di.ClaveCatastral               AS cadastral_key,
          di.Direccion                    AS address,
          a.Tarifa                        AS rate,
          dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,
          l.Mes                           AS month,
          l.Anio                          AS year,
          l.LecturaActual                 AS current_reading,
          l.LecturaAnterior               AS previous_reading,
          l.ValorAPagar                   AS reading_value,
          CASE 
              WHEN l.LecturaActual IS NOT NULL 
              THEN (l.LecturaActual - l.LecturaAnterior) 
              ELSE NULL 
          END                             AS consumption,

          CASE MONTH(di.Fecha_Venc_Interes)
              WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
              WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
              WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
              WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
          END                             AS month_due,
          
          YEAR(di.Fecha_Venc_Interes)     AS year_due,

          CASE
              WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
              WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE() 
                  THEN 'Pendiente de lectura (período actual/futuro)'
              WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE() 
                  THEN 'Lectura no registrada o pendiente'
              ELSE 'No disponible'
          END                             AS reading_status,

          di.Fecha_Pago                   AS payment_date,
          
          CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura      ELSE NULL END AS trash_rate,
          CASE WHEN l.LecturaActual IS NOT NULL THEN (di.Valor_Titulo + di.Recargo)     ELSE NULL END AS epaa_value,
          CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros    ELSE NULL END AS third_party_value,
          
          CASE WHEN l.LecturaActual IS NOT NULL 
              THEN COALESCE(di.Valor_Titulo, 0) + 
                    COALESCE(di.ValorTerceros, 0) + 
                    dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) +
                    COALESCE(di.tasa_basura, 0) + COALESCE(di.Recargo, 0)
              ELSE NULL 
          END                             AS total,

          di.Fecha_Venc_Interes           AS due_date,
          di.Estado_Ingreso               AS income_status,
          di.Fecha_Ingreso                AS income_date

      FROM Datos_ingreso di
      INNER JOIN CIUDADANO c 
          ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

      INNER JOIN AP_ACOMETIDAS a
          ON a.Sector = 
              CASE 
                  WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                      AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                      AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                  THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                  ELSE -1
              END
          AND a.Cuenta = 
              CASE 
                  WHEN CHARINDEX('-', di.ClaveCatastral) > 1 
                      AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                  THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                  ELSE -1
              END

      LEFT JOIN AP_LECTURAS l
          ON l.CodigoIngresoARentas = di.Cod_Ingreso

      
        WHERE
            di.ClaveCatastral = @searchParam

          AND di.Fecha_Pago IS NULL
          AND di.convenio   IS NULL
          AND di.Estado_Ingreso IS NULL

      ORDER BY 
          di.ClaveCatastral,
          di.Fecha_Venc_Interes DESC;
    
        END
`,
  findPendingReadingsByCadastralKeyOrCardId: (searchValue: string) => /*sql*/`
        SET NOCOUNT ON;
        DECLARE @searchParam VARCHAR(50);
        SET @searchParam = '${String(searchValue).trim()}';

        IF CHARINDEX('-', @searchParam) = 0
        BEGIN

        SELECT
            -- ── Identificación del cliente y suministro ──────────────────────────────────
			      di.Cod_Ingreso                  AS income_code,
            c.CED_IDENT_CIUDADANO           AS card_id,
            c.NOMBRES_CIUDADANO             AS name,
            c.APELLIDOS_CIUDADANO           AS last_name,
            di.ClaveCatastral               AS cadastral_key,
            di.Direccion                    AS address,
            a.Tarifa                        AS rate,

            -- Interes
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,

            -- ── Período de facturación ────────────────────────────────────────────────────
            l.Mes                           AS month,
            l.Anio                          AS year,

            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END                             AS month_due,

            YEAR(di.Fecha_Venc_Interes)     AS year_due,
            di.Fecha_Venc_Interes           AS due_date,
            di.Fecha_Pago                   AS payment_date,

            -- ── Lectura del medidor ───────────────────────────────────────────────────────
            l.LecturaActual                 AS current_reading,
            l.LecturaAnterior               AS previous_reading,
            CASE
                WHEN l.LecturaActual IS NOT NULL
                THEN (l.LecturaActual - l.LecturaAnterior)
                ELSE NULL
            END                             AS consumption,

            CASE
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE()
                    THEN 'Pendiente de lectura (período actual/futuro)'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE()
                    THEN 'Lectura no registrada o pendiente'
                ELSE 'No disponible'
            END                             AS reading_status,

            -- ── EPAA: valor del servicio de agua ─────────────────────────────────────────
            -- Valor por consumo de agua (según lectura del medidor)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.Valor_Titulo    ELSE NULL END AS epaa_value,
            -- Valor por servicios de terceros (alcantarillado, etc.)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros   ELSE NULL END AS third_party_value,
            -- Valor unitario por m³ consumido
            l.ValorAPagar                   AS reading_value,
            -- Recargo por mora u otro concepto general
            di.Recargo                      AS surcharge,
            -- Total EPAA: agua + terceros (sin basura ni ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                   + COALESCE(di.ValorTerceros, 0)
                   + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                   + COALESCE(di.Recargo, 0)
                ELSE NULL
            END                             AS total_epaa_value,

            -- ── Tasa de recolección de basura ─────────────────────────────────────────────
            -- Tarifa de basura OFICIAL (para mostrar como información de la tabla)
            CASE WHEN l.LecturaActual IS NOT NULL THEN ISNULL(v.Valor, di.tasa_basura)     ELSE NULL END AS trash_rate_official,
            
            -- Lo que EFECTIVAMENTE paga el usuario por basura este mes 
            -- (Si hay saldo a favor y cubre todo, paga 0)
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN 
                    CASE 
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN 
                            CASE 
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL 
            END                             AS trash_rate,

            -- Crédito original que arrastra del pasado (sólo informativo)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura_anterior_oficial ELSE NULL END AS trash_rate_previous,
            -- Saldo a favor actual
            CASE WHEN l.LecturaActual IS NOT NULL THEN anc.Valor ELSE NULL END AS balance_in_favor_current_month,
            -- Saldo a favor sobrante para el PRÓXIMO MES
            CASE WHEN l.LecturaActual IS NOT NULL AND COALESCE(anc.Valor, 0) > 0
                THEN 
                    CASE 
                        WHEN anc.Valor > ISNULL(v.Valor, di.tasa_basura) THEN anc.Valor - ISNULL(v.Valor, di.tasa_basura)
                        ELSE 0
                    END
                ELSE NULL
            END                             AS balance_in_favor_next_month,

            -- Saldo en contra: se anula por completo (nunca hay saldo a favor de la empresa)
            NULL                            AS balance_against_next_month,
            -- Descuento aplicado sobre la tasa de basura (solo en registros pagados, aquí siempre 0)
            COALESCE(di.descuento_tb, 0)    AS discount_trash_rate,
            -- Total neto de basura = lo que le toca pagar finalmente este mes
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN 
                    CASE 
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN 
                            CASE 
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL 
            END                             AS total_trash_rate,

            -- ── Totales de la planilla ────────────────────────────────────────────────────
            -- Total base: EPAA + terceros + basura actual + recargo (sin ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                  + COALESCE(di.ValorTerceros, 0)
                  + COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                  + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                  + COALESCE(di.Recargo, 0)
                -- descuento_tb no aplica: solo existe en registros pagados (Fecha_Pago IS NOT NULL)
                ELSE NULL
            END                             AS total,

            -- Total ajustado: Total consolidado del cliente
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                  + COALESCE(di.ValorTerceros, 0)
                  + COALESCE(di.Recargo, 0)
                  + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                  + CASE 
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN 
                            CASE 
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL
            END                             AS adjusted_total,

            -- ── Metadatos de ingreso ──────────────────────────────────────────────────────
            di.Estado_Ingreso               AS income_status,
            di.Fecha_Ingreso                AS income_date,
            CASE 
                WHEN di.Fecha_Venc_Interes < DATEADD(dd, DATEDIFF(dd, 0, GETDATE()), 0) THEN 'Vencido' 
                ELSE 'No Vencido' 
            END AS due_date_status

        FROM Datos_ingreso di
        INNER JOIN CIUDADANO c
            ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

        INNER JOIN AP_ACOMETIDAS a
            ON a.Sector =
                CASE
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                        AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                        AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                    THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                    ELSE -1
                END
            AND a.Cuenta =
                CASE
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                        AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                    THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                    ELSE -1
                END

        LEFT JOIN AP_LECTURAS l
            ON l.CodigoIngresoARentas = di.Cod_Ingreso

        LEFT JOIN AP_NotasCredito anc
            ON di.ClaveCatastral = anc.Cuenta

        LEFT JOIN Valor v
            ON di.Cod_Ingreso = v.cod_Ingreso AND v.orden = 10

        
        WHERE
            di.CodCliente_Ingreso = @searchParam

            AND di.Fecha_Pago IS NULL
            AND di.convenio   IS NULL
            AND di.Estado_Ingreso IS NULL

        ORDER BY
            di.ClaveCatastral,
            di.Fecha_Venc_Interes DESC;
      
        END
        ELSE
        BEGIN

        SELECT
            -- ── Identificación del cliente y suministro ──────────────────────────────────
			      di.Cod_Ingreso                  AS income_code,
            c.CED_IDENT_CIUDADANO           AS card_id,
            c.NOMBRES_CIUDADANO             AS name,
            c.APELLIDOS_CIUDADANO           AS last_name,
            di.ClaveCatastral               AS cadastral_key,
            di.Direccion                    AS address,
            a.Tarifa                        AS rate,

            -- Interes
            dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) AS interest_value,

            -- ── Período de facturación ────────────────────────────────────────────────────
            l.Mes                           AS month,
            l.Anio                          AS year,

            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END                             AS month_due,

            YEAR(di.Fecha_Venc_Interes)     AS year_due,
            di.Fecha_Venc_Interes           AS due_date,
            di.Fecha_Pago                   AS payment_date,

            -- ── Lectura del medidor ───────────────────────────────────────────────────────
            l.LecturaActual                 AS current_reading,
            l.LecturaAnterior               AS previous_reading,
            CASE
                WHEN l.LecturaActual IS NOT NULL
                THEN (l.LecturaActual - l.LecturaAnterior)
                ELSE NULL
            END                             AS consumption,

            CASE
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE()
                    THEN 'Pendiente de lectura (período actual/futuro)'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE()
                    THEN 'Lectura no registrada o pendiente'
                ELSE 'No disponible'
            END                             AS reading_status,

            -- ── EPAA: valor del servicio de agua ─────────────────────────────────────────
            -- Valor por consumo de agua (según lectura del medidor)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.Valor_Titulo    ELSE NULL END AS epaa_value,
            -- Valor por servicios de terceros (alcantarillado, etc.)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros   ELSE NULL END AS third_party_value,
            -- Valor unitario por m³ consumido
            l.ValorAPagar                   AS reading_value,
            -- Recargo por mora u otro concepto general
            di.Recargo                      AS surcharge,
            -- Total EPAA: agua + terceros (sin basura ni ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                   + COALESCE(di.ValorTerceros, 0)
                   + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                   + COALESCE(di.Recargo, 0)
                ELSE NULL
            END                             AS total_epaa_value,

            -- ── Tasa de recolección de basura ─────────────────────────────────────────────
            -- Tarifa de basura OFICIAL (para mostrar como información de la tabla)
            CASE WHEN l.LecturaActual IS NOT NULL THEN ISNULL(v.Valor, di.tasa_basura)     ELSE NULL END AS trash_rate_official,
            
            -- Lo que EFECTIVAMENTE paga el usuario por basura este mes 
            -- (Si hay saldo a favor y cubre todo, paga 0)
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN 
                    CASE 
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN 
                            CASE 
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL 
            END                             AS trash_rate,

            -- Crédito original que arrastra del pasado (sólo informativo)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura_anterior_oficial ELSE NULL END AS trash_rate_previous,
            -- Saldo a favor actual
            CASE WHEN l.LecturaActual IS NOT NULL THEN anc.Valor ELSE NULL END AS balance_in_favor_current_month,
            -- Saldo a favor sobrante para el PRÓXIMO MES
            CASE WHEN l.LecturaActual IS NOT NULL AND COALESCE(anc.Valor, 0) > 0
                THEN 
                    CASE 
                        WHEN anc.Valor > ISNULL(v.Valor, di.tasa_basura) THEN anc.Valor - ISNULL(v.Valor, di.tasa_basura)
                        ELSE 0
                    END
                ELSE NULL
            END                             AS balance_in_favor_next_month,

            -- Saldo en contra: se anula por completo (nunca hay saldo a favor de la empresa)
            NULL                            AS balance_against_next_month,
            -- Descuento aplicado sobre la tasa de basura (solo en registros pagados, aquí siempre 0)
            COALESCE(di.descuento_tb, 0)    AS discount_trash_rate,
            -- Total neto de basura = lo que le toca pagar finalmente este mes
            CASE WHEN l.LecturaActual IS NOT NULL 
                THEN 
                    CASE 
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN 
                            CASE 
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL 
            END                             AS total_trash_rate,

            -- ── Totales de la planilla ────────────────────────────────────────────────────
            -- Total base: EPAA + terceros + basura actual + recargo (sin ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                  + COALESCE(di.ValorTerceros, 0)
                  + COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                  + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                  + COALESCE(di.Recargo, 0)
                -- descuento_tb no aplica: solo existe en registros pagados (Fecha_Pago IS NOT NULL)
                ELSE NULL
            END                             AS total,

            -- Total ajustado: Total consolidado del cliente
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                  + COALESCE(di.ValorTerceros, 0)
                  + COALESCE(di.Recargo, 0)
                  + dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                  + CASE 
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN 
                            CASE 
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL
            END                             AS adjusted_total,

            -- ── Metadatos de ingreso ──────────────────────────────────────────────────────
            di.Estado_Ingreso               AS income_status,
            di.Fecha_Ingreso                AS income_date,
            CASE 
                WHEN di.Fecha_Venc_Interes < DATEADD(dd, DATEDIFF(dd, 0, GETDATE()), 0) THEN 'Vencido' 
                ELSE 'No Vencido' 
            END AS due_date_status

        FROM Datos_ingreso di
        INNER JOIN CIUDADANO c
            ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

        INNER JOIN AP_ACOMETIDAS a
            ON a.Sector =
                CASE
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                        AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                        AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                    THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                    ELSE -1
                END
            AND a.Cuenta =
                CASE
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                        AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                    THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                    ELSE -1
                END

        LEFT JOIN AP_LECTURAS l
            ON l.CodigoIngresoARentas = di.Cod_Ingreso

        LEFT JOIN AP_NotasCredito anc
            ON di.ClaveCatastral = anc.Cuenta

        LEFT JOIN Valor v
            ON di.Cod_Ingreso = v.cod_Ingreso AND v.orden = 10

        
        WHERE
            di.ClaveCatastral = @searchParam

            AND di.Fecha_Pago IS NULL
            AND di.convenio   IS NULL
            AND di.Estado_Ingreso IS NULL

        ORDER BY
            di.ClaveCatastral,
            di.Fecha_Venc_Interes DESC;
      
        END
`,
  verifyReadingExists: (searchValue: string) => /*sql*/`
        SELECT TOP 1 1
        FROM AP_LECTURAS
        WHERE ClaveCatastral = '${String(searchValue.trim())}'
           OR card_id = '${String(searchValue.trim())}'
      `,
  findHistoryInvoicesByCadastralKeyOrCardId: (searchValue: string, initDate: string, endDate: string) => /*sql*/`
        SET NOCOUNT ON;

        -- Parámetro de búsqueda original
        DECLARE @searchParam VARCHAR(50)
        SET @searchParam = '${String(searchValue.trim())}'

        -- NUEVO: Parámetros para rango de fechas (Desde - Hasta)
        -- Puedes inyectar las fechas desde tu código (ej. '2023-01-01') o dejarlas como NULL para omitir el filtro
        DECLARE @startDate DATETIME; -- Ejemplo para últimos 5 meses: DATEADD(MONTH, -5, GETDATE())
        DECLARE @endDate DATETIME;   -- Ejemplo: GETDATE()

        SET @startDate = CONVERT(DATETIME, '${initDate}', 120); -- Ej. últimos 5 meses: DATEADD(MONTH, -5, GETDATE())
        SET @endDate = CONVERT(DATETIME, '${endDate}', 120);   -- Ej: GETDATE()

        IF CHARINDEX('-', @searchParam) = 0
        BEGIN
            -- BÚSQUEDA POR CÉDULA (CodCliente_Ingreso)
            SELECT
            -- ── Identificación del cliente y suministro ──────────────────────────────────
            di.Cod_Ingreso                  AS income_code,
            c.CED_IDENT_CIUDADANO           AS card_id,
            c.NOMBRES_CIUDADANO             AS name,
            c.APELLIDOS_CIUDADANO           AS last_name,
            di.ClaveCatastral               AS cadastral_key,
            di.Direccion                    AS address,
            a.Tarifa                        AS rate,

            -- Interes
            CASE
                WHEN di.Fecha_Pago IS NULL AND di.Estado_Ingreso IS NULL
                    THEN dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                ELSE di.Intereses
            END AS interest_value,

            -- ── Período de facturación ────────────────────────────────────────────────────
            l.Mes                           AS month,
            l.Anio                          AS year,

            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END                             AS month_due,

            YEAR(di.Fecha_Venc_Interes)     AS year_due,
            di.Fecha_Venc_Interes           AS due_date,
            di.Fecha_Pago                   AS payment_date,

            -- ── Lectura del medidor ───────────────────────────────────────────────────────
            l.LecturaActual                 AS current_reading,
            l.LecturaAnterior               AS previous_reading,
            CASE
                WHEN l.LecturaActual IS NOT NULL
                THEN (l.LecturaActual - l.LecturaAnterior)
                ELSE NULL
            END                             AS consumption,

            CASE
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE()
                    THEN 'Pendiente de lectura (período actual/futuro)'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE()
                    THEN 'Lectura no registrada o pendiente'
                ELSE 'No disponible'
            END                             AS reading_status,

            -- ── EPAA: valor del servicio de agua ─────────────────────────────────────────
            -- Valor por consumo de agua (según lectura del medidor)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.Valor_Titulo    ELSE NULL END AS epaa_value,
            -- Valor por servicios de terceros (alcantarillado, etc.)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros   ELSE NULL END AS third_party_value,
            -- Valor unitario por m³ consumido
            l.ValorAPagar                   AS reading_value,
            -- Recargo por mora u otro concepto general
            di.Recargo                      AS surcharge,
            -- Total EPAA: agua + terceros (sin basura ni ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                  + COALESCE(di.ValorTerceros, 0)
                  + CASE WHEN di.Fecha_Pago IS NULL THEN dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) ELSE COALESCE(di.Intereses, 0) END
                  + COALESCE(di.Recargo, 0)
                ELSE NULL
            END                             AS total_epaa_value,

            -- ── Tasa de recolección de basura ─────────────────────────────────────────────
            -- Tarifa de basura OFICIAL (para mostrar como información de la tabla)
            CASE WHEN l.LecturaActual IS NOT NULL THEN ISNULL(v.Valor, di.tasa_basura)     ELSE NULL END AS trash_rate_official,

            -- Lo que EFECTIVAMENTE paga el usuario por basura este mes
            -- (Si hay saldo a favor y cubre todo, paga 0)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN
                    CASE
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN
                            CASE
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL
            END                             AS trash_rate,

            -- Crédito original que arrastra del pasado (sólo informativo)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura_anterior_oficial ELSE NULL END AS trash_rate_previous,
            -- Saldo a favor actual
            CASE WHEN l.LecturaActual IS NOT NULL THEN anc.Valor ELSE NULL END AS balance_in_favor_current_month,
            -- Saldo a favor sobrante para el PRÓXIMO MES
            CASE WHEN l.LecturaActual IS NOT NULL AND COALESCE(anc.Valor, 0) > 0
                THEN
                    CASE
                        WHEN anc.Valor > ISNULL(v.Valor, di.tasa_basura) THEN anc.Valor - ISNULL(v.Valor, di.tasa_basura)
                        ELSE 0
                    END
                ELSE NULL
            END                             AS balance_in_favor_next_month,

            -- Saldo en contra: se anula por completo (nunca hay saldo a favor de la empresa)
            NULL                            AS balance_against_next_month,
            -- Descuento aplicado sobre la tasa de basura (solo en registros pagados, aquí siempre 0)
            COALESCE(di.descuento_tb, 0)    AS discount_trash_rate,
            -- Total neto de basura = lo que le toca pagar finalmente este mes
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN
                    CASE
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN
                            CASE
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL
            END                             AS total_trash_rate,

            -- ── Totales de la planilla ────────────────────────────────────────────────────
            -- Total base: EPAA + terceros + basura actual + recargo (sin ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                  + COALESCE(di.ValorTerceros, 0)
                  + COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                  + CASE WHEN di.Fecha_Pago IS NULL THEN dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) ELSE COALESCE(di.Intereses, 0) END
                  + COALESCE(di.Recargo, 0)
                -- descuento_tb no aplica: solo existe en registros pagados (Fecha_Pago IS NOT NULL)
                ELSE NULL
            END                             AS total,

            -- Total ajustado: Total consolidado del cliente
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                  + COALESCE(di.ValorTerceros, 0)
                  + COALESCE(di.Recargo, 0)
                  + CASE WHEN di.Fecha_Pago IS NULL THEN dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) ELSE COALESCE(di.Intereses, 0) END
                  + CASE
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN
                            CASE
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL
            END                             AS adjusted_total,

            -- ── Metadatos de ingreso ──────────────────────────────────────────────────────
            di.Estado_Ingreso               AS income_status,
            di.Fecha_Ingreso                AS income_date,
            CASE
                WHEN di.Fecha_Venc_Interes < DATEADD(dd, DATEDIFF(dd, 0, GETDATE()), 0) THEN 'Vencido'
                ELSE 'No Vencido'
            END AS due_date_status

        FROM Datos_ingreso di
        INNER JOIN CIUDADANO c
            ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

        INNER JOIN AP_ACOMETIDAS a
            ON a.Sector =
                CASE
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                        AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                        AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                    THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                    ELSE -1
                END
            AND a.Cuenta =
                CASE
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                        AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                    THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                    ELSE -1
                END

        LEFT JOIN AP_LECTURAS l
            ON l.CodigoIngresoARentas = di.Cod_Ingreso

        LEFT JOIN AP_NotasCredito anc
            ON di.ClaveCatastral = anc.Cuenta

        LEFT JOIN Valor v
            ON di.Cod_Ingreso = v.cod_Ingreso AND v.orden = 10

        WHERE
            di.CodCliente_Ingreso = @searchParam
            -- Filtro por rango de fechas aplicado a Fecha_Venc_Interes
            AND (@startDate IS NULL OR di.Fecha_Ingreso >= @startDate)
            AND (@endDate IS NULL OR di.Fecha_Ingreso <= @endDate)

            AND di.convenio IS NULL

        ORDER BY
            di.ClaveCatastral,
            di.Fecha_Venc_Interes DESC;
        END
        ELSE
        BEGIN
            -- BÚSQUEDA POR CLAVE CATASTRAL
            SELECT
                            -- ── Identificación del cliente y suministro ──────────────────────────────────
            di.Cod_Ingreso                  AS income_code,
            c.CED_IDENT_CIUDADANO           AS card_id,
            c.NOMBRES_CIUDADANO             AS name,
            c.APELLIDOS_CIUDADANO           AS last_name,
            di.ClaveCatastral               AS cadastral_key,
            di.Direccion                    AS address,
            a.Tarifa                        AS rate,
            di.Intereses,

            -- Interes
            CASE
                WHEN di.Fecha_Pago IS NULL AND di.Estado_Ingreso IS NULL
                    THEN dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE())
                ELSE di.Intereses
            END AS interest_value,

            -- ── Período de facturación ────────────────────────────────────────────────────
            l.Mes                           AS month,
            l.Anio                          AS year,

            CASE MONTH(di.Fecha_Venc_Interes)
                WHEN 1 THEN 'ENERO' WHEN 2 THEN 'FEBRERO' WHEN 3 THEN 'MARZO'
                WHEN 4 THEN 'ABRIL' WHEN 5 THEN 'MAYO' WHEN 6 THEN 'JUNIO'
                WHEN 7 THEN 'JULIO' WHEN 8 THEN 'AGOSTO' WHEN 9 THEN 'SEPTIEMBRE'
                WHEN 10 THEN 'OCTUBRE' WHEN 11 THEN 'NOVIEMBRE' WHEN 12 THEN 'DICIEMBRE'
            END                             AS month_due,

            YEAR(di.Fecha_Venc_Interes)     AS year_due,
            di.Fecha_Venc_Interes           AS due_date,
            di.Fecha_Pago                   AS payment_date,

            -- ── Lectura del medidor ───────────────────────────────────────────────────────
            l.LecturaActual                 AS current_reading,
            l.LecturaAnterior               AS previous_reading,
            CASE
                WHEN l.LecturaActual IS NOT NULL
                THEN (l.LecturaActual - l.LecturaAnterior)
                ELSE NULL
            END                             AS consumption,

            CASE
                WHEN l.LecturaActual IS NOT NULL THEN 'Lectura registrada'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes >= GETDATE()
                    THEN 'Pendiente de lectura (período actual/futuro)'
                WHEN l.LecturaActual IS NULL AND di.Fecha_Venc_Interes < GETDATE()
                    THEN 'Lectura no registrada o pendiente'
                ELSE 'No disponible'
            END                             AS reading_status,

            -- ── EPAA: valor del servicio de agua ─────────────────────────────────────────
            -- Valor por consumo de agua (según lectura del medidor)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.Valor_Titulo    ELSE NULL END AS epaa_value,
            -- Valor por servicios de terceros (alcantarillado, etc.)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.ValorTerceros   ELSE NULL END AS third_party_value,
            -- Valor unitario por m³ consumido
            l.ValorAPagar                   AS reading_value,
            -- Recargo por mora u otro concepto general
            di.Recargo                      AS surcharge,
            -- Total EPAA: agua + terceros (sin basura ni ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                  + COALESCE(di.ValorTerceros, 0)
                  + CASE WHEN di.Fecha_Pago IS NULL THEN dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) ELSE COALESCE(di.Intereses, 0) END
                  + COALESCE(di.Recargo, 0)
                ELSE NULL
            END                             AS total_epaa_value,

            -- ── Tasa de recolección de basura ─────────────────────────────────────────────
            -- Tarifa de basura OFICIAL (para mostrar como información de la tabla)
            CASE WHEN l.LecturaActual IS NOT NULL THEN ISNULL(v.Valor, di.tasa_basura)     ELSE NULL END AS trash_rate_official,

            -- Lo que EFECTIVAMENTE paga el usuario por basura este mes
            -- (Si hay saldo a favor y cubre todo, paga 0)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN
                    CASE
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN
                            CASE
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL
            END                             AS trash_rate,

            -- Crédito original que arrastra del pasado (sólo informativo)
            CASE WHEN l.LecturaActual IS NOT NULL THEN di.tasa_basura_anterior_oficial ELSE NULL END AS trash_rate_previous,
            -- Saldo a favor actual
            CASE WHEN l.LecturaActual IS NOT NULL THEN anc.Valor ELSE NULL END AS balance_in_favor_current_month,
            -- Saldo a favor sobrante para el PRÓXIMO MES
            CASE WHEN l.LecturaActual IS NOT NULL AND COALESCE(anc.Valor, 0) > 0
                THEN
                    CASE
                        WHEN anc.Valor > ISNULL(v.Valor, di.tasa_basura) THEN anc.Valor - ISNULL(v.Valor, di.tasa_basura)
                        ELSE 0
                    END
                ELSE NULL
            END                             AS balance_in_favor_next_month,

            -- Saldo en contra: se anula por completo (nunca hay saldo a favor de la empresa)
            NULL                            AS balance_against_next_month,
            -- Descuento aplicado sobre la tasa de basura (solo en registros pagados, aquí siempre 0)
            COALESCE(di.descuento_tb, 0)    AS discount_trash_rate,
            -- Total neto de basura = lo que le toca pagar finalmente este mes
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN
                    CASE
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN
                            CASE
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL
            END                             AS total_trash_rate,

            -- ── Totales de la planilla ────────────────────────────────────────────────────
            -- Total base: EPAA + terceros + basura actual + recargo (sin ajuste de tarifa)
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                  + COALESCE(di.ValorTerceros, 0)
                  + COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                  + CASE WHEN di.Fecha_Pago IS NULL THEN dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) ELSE COALESCE(di.Intereses, 0) END
                  + COALESCE(di.Recargo, 0)
                -- descuento_tb no aplica: solo existe en registros pagados (Fecha_Pago IS NOT NULL)
                ELSE NULL
            END                             AS total,

            -- Total ajustado: Total consolidado del cliente
            CASE WHEN l.LecturaActual IS NOT NULL
                THEN COALESCE(di.Valor_Titulo, 0)
                  + COALESCE(di.ValorTerceros, 0)
                  + COALESCE(di.Recargo, 0)
                  + CASE WHEN di.Fecha_Pago IS NULL THEN dbo.fn_CalcularInteresIndividual(di.Valor_Titulo, di.Fecha_Venc_Interes, GETDATE()) ELSE COALESCE(di.Intereses, 0) END
                  + CASE
                        WHEN COALESCE(anc.Valor, 0) > 0 THEN
                            CASE
                                WHEN anc.Valor >= ISNULL(v.Valor, di.tasa_basura) THEN 0
                                ELSE ISNULL(v.Valor, di.tasa_basura) - anc.Valor
                            END
                        ELSE COALESCE(ISNULL(v.Valor, di.tasa_basura), 0)
                    END
                ELSE NULL
            END                             AS adjusted_total,

            -- ── Metadatos de ingreso ──────────────────────────────────────────────────────
            di.Estado_Ingreso               AS income_status,
            di.Fecha_Ingreso                AS income_date,
            CASE
                WHEN di.Fecha_Venc_Interes < DATEADD(dd, DATEDIFF(dd, 0, GETDATE()), 0) THEN 'Vencido'
                ELSE 'No Vencido'
            END AS due_date_status

        FROM Datos_ingreso di
        INNER JOIN CIUDADANO c
            ON di.CodCliente_Ingreso = c.CED_IDENT_CIUDADANO

        INNER JOIN AP_ACOMETIDAS a
            ON a.Sector =
                CASE
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                        AND ISNUMERIC(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) = 1
                        AND LEN(LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1)) <= 2
                    THEN CONVERT(INT, LEFT(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)-1))
                    ELSE -1
                END
            AND a.Cuenta =
                CASE
                    WHEN CHARINDEX('-', di.ClaveCatastral) > 1
                        AND ISNUMERIC(SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30)) = 1
                    THEN CONVERT(INT, SUBSTRING(di.ClaveCatastral, CHARINDEX('-', di.ClaveCatastral)+1, 30))
                    ELSE -1
                END

        LEFT JOIN AP_LECTURAS l
            ON l.CodigoIngresoARentas = di.Cod_Ingreso

        LEFT JOIN AP_NotasCredito anc
            ON di.ClaveCatastral = anc.Cuenta

        LEFT JOIN Valor v
            ON di.Cod_Ingreso = v.cod_Ingreso AND v.orden = 10

            WHERE
                di.ClaveCatastral = @searchParam
                AND (@startDate IS NULL OR di.Fecha_Ingreso >= @startDate)
                AND (@endDate IS NULL OR di.Fecha_Ingreso <= @endDate)
                AND di.convenio IS NULL
            ORDER BY
                di.ClaveCatastral,
                di.Fecha_Venc_Interes DESC;
        END;
      `,
};
