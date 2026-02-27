SELECT 
    a.acometida_id,
    a.sector,
    a.clave_catastral,
    a.direccion
FROM acometida a
WHERE a.acometida_id NOT IN (
    SELECT l.acometida_id 
    FROM lectura l 
    WHERE l.mes_lectura = '2026-02'
);




      SET NOCOUNT ON
      DECLARE @searchDateParam VARCHAR(50)
      SET @searchDateParam = '2026-02-24 00:00:00.000'
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
            SUM(v.Valor) as value
          FROM Datos_ingreso di
              INNER JOIN Valor V on di.Cod_Ingreso = V.cod_Ingreso
          WHERE di.Fecha_Pago = @searchDateParam
          GROUP BY di.Cod_Ingreso, di.CodCliente_Ingreso, di.nombre, di.Fecha_Ingreso, di.Fecha_Pago, di.Estado_Ingreso, di.Cod_Titulo_Datos, 
				   di.Fecha_Venc_Interes, di.Valor_Titulo, di.ValorTerceros, di.Recargo, di.tasa_basura, di.ClaveCatastral, di.FormaDePago, 
				   di.Comentario, di.Valor_Titulo, di.ValorTerceros, di.Recargo, di.tasa_basura, di.User_Cobro
          ORDER BY di.Fecha_Ingreso DESC;




        SET NOCOUNT ON
        DECLARE @initDateParam VARCHAR(50)
        DECLARE @endDateParam VARCHAR(50)
        SET @initDateParam = '2026-02-24 00:00:00.000'
        SET @endDateParam  = '2026-02-24 23:59:59.997'

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
            SUM(v.Valor) AS value
          FROM Datos_ingreso di
          INNER JOIN Valor v ON di.Cod_Ingreso = v.cod_Ingreso
          WHERE di.Fecha_Pago >= @initDateParam
            AND di.Fecha_Pago <= @endDateParam
          GROUP BY
            di.Cod_Ingreso, di.CodCliente_Ingreso, di.nombre, di.Fecha_Ingreso, di.Fecha_Pago,
            di.Estado_Ingreso, di.Cod_Titulo_Datos, di.Fecha_Venc_Interes, di.Valor_Titulo,
            di.ValorTerceros, di.Recargo, di.tasa_basura, di.ClaveCatastral,
            di.FormaDePago, di.Comentario, di.User_Cobro
          ORDER BY di.Fecha_Ingreso DESC;



