import { Injectable } from '@nestjs/common';
import { InterfaceGeneralCollectionRepository } from '../../../../domain/contracts/general-collection.interface.repository';
import { DatabaseServiceSQLServer2022 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2022.service';
import {
  GeneralCollectionsParams,
  GeneralTrendCollectionsParams,
} from '../../../../domain/schemas/dto/request/general-collection.params';
import {
  GeneralCollectionResponse,
  GeneralDailyGroupedReportResponse,
  GeneralYearlyGroupedReportResponse,
  GeneralMonthlyGroupedReportResponse,
  GeneralYearlyKPIResponse,
  GeneralMonthlyKPIResponse,
  GeneralKPIResponse,
} from '../../../../domain/schemas/dto/response/general-collection.response';
import {
  GeneralCollectionSQLResult,
  GeneralDailyGroupedReportSQLResult,
  GeneralKPIResponseSQLResult,
} from '../../../interfaces/sql/general-collection.sql.response';
import { SQLServerGeneralCollectionAdapter } from '../adapters/sql-server.general-collection.adapter';

@Injectable()
export class SqlServerGeneralCollectionPersistence
  implements InterfaceGeneralCollectionRepository
{
  // Aquí puedes agregar métodos para interactuar con la base de datos SQL Server
  // por ejemplo, métodos para ejecutar consultas y mapear resultados a las interfaces definidas.
  constructor(private readonly sqlServerService: DatabaseServiceSQLServer2022) {
    // Aquí puedes inyectar dependencias como un cliente de base de datos, si es necesario.
  }

  async getGeneralCollectionReport(
    params: GeneralCollectionsParams,
  ): Promise<GeneralCollectionResponse[]> {
    try {
      const initDateTime = `${String(params.startDate)} 00:00:00.000`;
      const endDateTime = `${String(params.endDate)} 23:59:59.997`;
      const safeOffset =
        Number.isInteger(params.offset) && params.offset! >= 0
          ? params.offset!
          : 0;
      const safeLimit =
        Number.isInteger(params.limit) && params.limit! > 0
          ? params.limit!
          : 1000000;

      const query = `
        SET NOCOUNT ON;

        SELECT TOP ${safeLimit}
          di.Cod_Ingreso AS income_code,  
          di.CodCliente_Ingreso AS card_id,  
          di.nombre AS name,  
          di.Fecha_Ingreso AS income_date,  
          di.Fecha_Pago AS payment_date,  
          di.Estado_Ingreso AS income_status,  
          di.Cod_Titulo_Datos AS title_code,  
          di.Fecha_Vencimiento AS due_date,  
          di.Valor_Titulo AS title_value,  
          di.ValorTerceros AS third_party_value,  
          di.Recargo AS surcharge,  
          di.tasa_basura AS trash_rate,  
          di.ClaveCatastral AS cadastral_key,  
          (COALESCE(di.Valor_Titulo,0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.tasa_basura, 0)) AS total,  
          di.User_Cobro AS payment_user,  
          --v.Valor as value,  
          --v.orden AS order_value,    
          di.FormaDePago AS payment_method,  
          di.Comentario AS comment  
        FROM Datos_ingreso di  
            --INNER JOIN Valor V on di.Cod_Ingreso = V.cod_Ingreso
        WHERE di.Fecha_Pago >= CONVERT(DATETIME, '${initDateTime}', 120)  
          AND di.Fecha_Pago <= CONVERT(DATETIME, '${endDateTime}', 120)
          ${
            safeOffset > 0
              ? `AND di.Cod_Ingreso NOT IN (
              SELECT TOP ${safeOffset} inner_di.Cod_Ingreso
              FROM Datos_ingreso inner_di
              WHERE inner_di.Fecha_Pago >= CONVERT(DATETIME, '${initDateTime}', 120)  
                AND inner_di.Fecha_Pago <= CONVERT(DATETIME, '${endDateTime}', 120)
              ORDER BY inner_di.Fecha_Ingreso DESC
          )`
              : ''
          }
        ORDER BY di.Fecha_Ingreso DESC;
      `;

      const queryParameters: any[] = [];

      const results =
        await this.sqlServerService.query<GeneralCollectionSQLResult>(
          query,
          queryParameters,
        );

      const response: GeneralCollectionResponse[] = results.map((sqlResult) =>
        SQLServerGeneralCollectionAdapter.toGeneralCollectionResponse(
          sqlResult,
        ),
      );

      return response;
    } catch (error) {
      throw error; // Manejo de errores adecuado
    }
  }

  async getGeneralDailyCollectionGroupedReport(
    params: GeneralCollectionsParams,
  ): Promise<GeneralDailyGroupedReportResponse[]> {
    try {
      const initDateTime = `${String(params.startDate)} 00:00:00.000`;
      const endDateTime = `${String(params.endDate)} 23:59:59.997`;

      const safeOffset =
        Number.isInteger(params.offset) && params.offset! >= 0
          ? params.offset!
          : 0;
      const safeLimit =
        Number.isInteger(params.limit) && params.limit! > 0
          ? params.limit!
          : 1000000;

      let queryDateFilter = '';
      if (params.dateFilter === 'paymentDate') {
        queryDateFilter = 'Fecha_Pago';
      } else if (params.dateFilter === 'incomeDate') {
        queryDateFilter = 'Fecha_Ingreso';
      } else {
        queryDateFilter = 'Fecha_Pago'; // Valor predeterminado
      }

      let titleCodeFilter = '';
      if (params.titleCode && params.titleCode.length > 0) {
        titleCodeFilter = `AND Cod_Titulo_Datos = '${params.titleCode}'`;
      }

      const query = `
        SET NOCOUNT ON;

        SELECT IDENTITY(INT, 1, 1) AS RowNum, *
        INTO #TempOrdered
        FROM (
            SELECT  
                CONVERT(VARCHAR(8),  Fecha_Pago, 112)      AS day,  
                CONVERT(VARCHAR(10), Fecha_Pago, 120)      AS date,  
                User_Cobro                                 AS collector,  
                Cod_Titulo_Datos                           AS title_code,  
                FormaDePago                                AS payment_method,  
                Estado_Ingreso                             AS status,  
                SUM(COALESCE(Valor_Titulo,  0))            AS title_value,  
                SUM(COALESCE(ValorTerceros, 0))            AS third_party_value,  
                SUM(COALESCE(Recargo,       0))            AS surcharge_value,  
                SUM(COALESCE(tasa_basura,   0))            AS trash_rate_value,  
                SUM(COALESCE(descuento_tb,  0))            AS discount_trash_rate_value,  
                SUM(  
                    COALESCE(Valor_Titulo,  0) +  
                    COALESCE(ValorTerceros, 0) +  
                    COALESCE(Recargo,       0) +  
                    COALESCE(tasa_basura,   0) -  
                    COALESCE(descuento_tb,  0)  
                )                                          AS total_value,  
                COUNT(Cod_Ingreso)                         AS record_count  
            FROM Datos_ingreso  
            WHERE ${queryDateFilter} >= CONVERT(DATETIME, '${initDateTime}', 120)  
              AND ${queryDateFilter} <= CONVERT(DATETIME, '${endDateTime}',  120)
              ${titleCodeFilter}  
            GROUP BY  
                CONVERT(VARCHAR(8),  Fecha_Pago, 112),  
                CONVERT(VARCHAR(10), Fecha_Pago, 120),  
                User_Cobro,  
                Cod_Titulo_Datos,  
                FormaDePago,  
                Estado_Ingreso  
        ) i
        ORDER BY day, collector, title_code, payment_method;

        SELECT 
            day,  
            date,  
            collector,  
            title_code,  
            payment_method,  
            status,  
            title_value,  
            third_party_value,  
            surcharge_value,  
            trash_rate_value,  
            discount_trash_rate_value,  
            total_value,  
            record_count  
        FROM #TempOrdered
        WHERE RowNum > ${safeOffset} AND RowNum <= ${safeOffset + safeLimit}
        ORDER BY RowNum;

        DROP TABLE #TempOrdered;
      `;

      const queryParameters: any[] = [];

      const results =
        await this.sqlServerService.query<GeneralDailyGroupedReportSQLResult>(
          query,
          queryParameters,
        );

      const response: GeneralDailyGroupedReportResponse[] = results.map(
        (sqlResult) =>
          SQLServerGeneralCollectionAdapter.toGeneralCollectionDailyGroupedReportResponse(
            sqlResult,
          ),
      );

      return response;
    } catch (error) {
      throw error; // Manejo de errores adecuado
    }
  }

  async getGeneralCollectionKPI(
    params: GeneralCollectionsParams,
  ): Promise<GeneralKPIResponse | null> {
    try {
      const initDateTime = `${String(params.startDate)} 00:00:00.000`;
      const endDateTime = `${String(params.endDate)} 23:59:59.997`;

      const queryDateFilter =
        params.dateFilter === 'incomeDate'
          ? 'di.Fecha_Ingreso'
          : 'di.Fecha_Pago';
      const titleCodeFilter = params.titleCode
        ? `AND di.Cod_Titulo_Datos = '${params.titleCode}'`
        : '';

      const query = `
        SET NOCOUNT ON;

        DECLARE @fechaInicioKPI DATETIME;
        SET @fechaInicioKPI = '${initDateTime}';  
        DECLARE @fechaFinKPI    DATETIME;
        SET @fechaFinKPI = '${endDateTime}';  
        DECLARE @code           VARCHAR(5);
        SET @code = '${params.titleCode || ''}';  

        SELECT  
            COUNT(DISTINCT di.ClaveCatastral) AS unique_cadastral_keys,  
            -- ##########################  
            --          General    
            -- ##########################
            COUNT(di.Cod_Ingreso) AS total_bills_issued,  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS paid_bills,  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS pending_bills,  
          
            -- Título dinámico  
            CASE  
                WHEN @code = '' OR @code IS NULL THEN 'ALL'  
                ELSE MAX(di.Cod_Titulo_Datos)  
            END AS code_title,  
            -- ##########################  
            --          EPAA    
            -- ##########################
            -- Total EPAA pendings and payments
            SUM(COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.interes_mejoras, 0)) AS total_epaa,  
            -- Total de valores pendientes EPAA  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) +COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_epaa_pendings,  
            -- Total de valores cobrados EPAA  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_epaa_collected,  
            -- Total EPAA con valor 0  
            SUM(CASE WHEN COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.interes_mejoras, 0) = 0 THEN 1 ELSE 0 END) AS total_epaa_zero,  
            -- Total EPAA con valor NULL  
            SUM(CASE  
                WHEN di.Valor_Titulo IS NULL  
                THEN 1  
                ELSE 0  
            END) AS total_epaa_null,  
            -- Total EPAA Mayor a 0  
            SUM(CASE WHEN di.Valor_Titulo > 0 THEN 1 ELSE 0 END) AS total_epaa_greater_than_zero,  
            -- Total EPAA Menor a 0  
            SUM(CASE WHEN di.Valor_Titulo < 0 THEN 1 ELSE 0 END) AS total_epaa_less_than_zero,  
          
            -- ##########################  
            --          Recargos    
            -- ##########################
            -- Total Recargos pendings and payments
            SUM(COALESCE(di.Recargo, 0)) AS total_surcharges,  
            -- Total de valores pendientes Recargos  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.Recargo, 0) ELSE 0 END) AS total_surcharges_pending,  
            -- Total de valores cobrados Recargos  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.Recargo, 0) - COALESCE(di.descuento_tb, 0) ELSE 0 END) AS total_surcharges_collected,  
            -- Total Recargos con valor 0  
            SUM(CASE WHEN COALESCE(di.Recargo, 0) = 0 THEN 1 ELSE 0 END) AS total_surcharges_zero,  
            -- Total Recargos con valor NULL  
            SUM(CASE  
                WHEN di.Recargo IS NULL  
                THEN 1  
                ELSE 0  
            END) AS total_surcharges_null,  
            -- Total Recargos Mayor a 0  
            SUM(CASE WHEN di.Recargo > 0 THEN 1 ELSE 0 END) AS total_surcharges_greater_than_zero,  
            -- Total Recargos Menor a 0  
            SUM(CASE WHEN di.Recargo < 0 THEN 1 ELSE 0 END) AS total_surcharges_less_than_zero,  
          
            -- ##########################  
            --          Terceros    
            -- ##########################
            -- Total Terceros pendings and payments
            SUM(COALESCE(di.ValorTerceros, 0)) AS total_third_parties,  
            -- Total de valores pendientes Terceros  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.ValorTerceros, 0) ELSE 0 END) AS total_third_parties_pending,  
            -- Total de valores cobrados Terceros  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.ValorTerceros, 0) ELSE 0 END) AS total_third_parties_collected,  
            -- Total Terceros con valor 0  
            SUM(CASE WHEN COALESCE(di.ValorTerceros, 0) = 0 THEN 1 ELSE 0 END) AS total_third_parties_zero,  
            -- Total Terceros con valor NULL  
            SUM(CASE  
                WHEN di.ValorTerceros IS NULL  
                THEN 1  
                ELSE 0  
            END) AS total_third_parties_null,  
            -- Total Terceros Mayor a 0  
            SUM(CASE WHEN di.ValorTerceros > 0 THEN 1 ELSE 0 END) AS total_third_parties_greater_than_zero,  
            -- Total Terceros Menor a 0  
            SUM(CASE WHEN di.ValorTerceros < 0 THEN 1 ELSE 0 END) AS total_third_parties_less_than_zero,  
          
            -- ##########################  
            --          Mejoras    
            -- ##########################
            -- Total Mejoras pendings and payments
            SUM(COALESCE(di.interes_mejoras, 0)) AS total_improvements,  
            -- Total de valores pendientes Mejoras  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_improvements_pending,  
            -- Total de valores cobrados Mejoras  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_improvements_collected,  
            -- Total Mejoras con valor 0  
            SUM(CASE WHEN COALESCE(di.interes_mejoras, 0) = 0 THEN 1 ELSE 0 END) AS total_improvements_zero,  
            -- Total Mejoras con valor NULL  
            SUM(CASE  
                WHEN di.interes_mejoras IS NULL  
                THEN 1  
                ELSE 0  
            END) AS total_improvements_null,  
            -- Total Mejoras Mayor a 0  
            SUM(CASE WHEN di.interes_mejoras > 0 THEN 1 ELSE 0 END) AS total_improvements_greater_than_zero,  
            -- Total Mejoras Menor a 0  
            SUM(CASE WHEN di.interes_mejoras < 0 THEN 1 ELSE 0 END) AS total_improvements_less_than_zero,  
          
            -- ##########################  
            --          Tasa Basura    
            -- ##########################
            -- Total Tasa Basura pendings and payments
            SUM(COALESCE(di.tasa_basura, 0)) AS total_trash_rate,  
            -- Total de valores pendientes tasa basura  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.tasa_basura, 0) ELSE 0 END) AS total_trash_rate_pending,  
            -- Total de valores cobrados tasa basura  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.tasa_basura, 0) - COALESCE(di.descuento_tb, 0) ELSE 0 END) AS total_trash_rate_collected,  
            -- Total de descuentos tasa basura  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.descuento_tb, 0) ELSE 0 END) AS total_trash_rate_discounts,  
          
          
            -- ##########################  
            --          Count trash rate    
            -- ##########################
            -- Total de facturas con tasa basura
            SUM(CASE WHEN di.tasa_basura IS NOT NULL THEN 1 ELSE 0 END) AS count_bills_with_trash_rate,  
            -- Total de facturas con tasa basura pendientes  
            SUM(CASE WHEN di.tasa_basura IS NOT NULL AND di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS count_bills_with_trash_rate_pending,  
            -- Total de facturas con tasa basura cobradas  
            SUM(CASE WHEN di.tasa_basura IS NOT NULL AND di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS count_bills_with_trash_rate_collected,  
            -- Total Tasa Basura con valor 0  
            SUM(CASE WHEN COALESCE(di.tasa_basura, 0) = 0 THEN 1 ELSE 0 END) AS total_trash_rate_zero,  
            -- Total Tasa Basura con valor NULL  
            SUM(CASE  
                WHEN di.tasa_basura IS NULL  
                THEN 1  
                ELSE 0  
            END) AS total_trash_rate_null,  
            -- Total Tasa Basura Mayor a 0  
            SUM(CASE WHEN di.tasa_basura > 0 THEN 1 ELSE 0 END) AS total_trash_rate_greater_than_zero,  
            -- Total Tasa Basura Menor a 0  
            SUM(CASE WHEN di.tasa_basura < 0 THEN 1 ELSE 0 END) AS total_trash_rate_less_than_zero,  
          
            -- Traemos los totales del CTE (siempre será 1 fila)  
            -- Valor promedio por factura cobrada
            AVG(CASE WHEN di.Fecha_Pago IS NOT NULL THEN  
                COALESCE(di.Valor_Titulo, 0) + COALESCE(di.tasa_basura, 0)  
                ELSE NULL END) AS average_paid_bill,  
            MAX(nc.count_notes) AS count_notes,  
            MAX(nc.total_notes_amount) AS total_notes_amount  
          
        FROM Datos_ingreso di  
        CROSS JOIN (
            SELECT  
                ISNULL(SUM(Valor), 0) AS total_notes_amount,  
                COUNT(*) AS count_notes  
            FROM AP_NotasCredito nc_in
            WHERE EXISTS (
                SELECT 1
                FROM Datos_ingreso di_sub
                WHERE di_sub.ClaveCatastral = nc_in.Cuenta
                  AND di_sub.${queryDateFilter.replace('di.', '')} BETWEEN @fechaInicioKPI AND @fechaFinKPI
                  ${titleCodeFilter.replace('di.', 'di_sub.')}
            )
        ) nc  
        WHERE ${queryDateFilter} BETWEEN @fechaInicioKPI AND @fechaFinKPI  
          ${titleCodeFilter}
        GROUP BY  
            -- Agrupamos por una constante si @code es vacío para obtener una sola fila  
            CASE WHEN @code = '' OR @code IS NULL THEN '1' ELSE di.Cod_Titulo_Datos END;
      `;

      const queryParameters: any[] = [];

      const results =
        await this.sqlServerService.query<GeneralKPIResponseSQLResult>(
          query,
          queryParameters,
        );

      if (results.length === 0) {
        return null;
      }

      const response = SQLServerGeneralCollectionAdapter.toGeneralKPIResponse(
        results[0],
      );

      return response;
    } catch (error) {
      throw error; // Manejo de errores adecuado
    }
  }

  async getGeneralYearlyCollectionKPI(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralYearlyKPIResponse[]> {
    try {
      const referenceStartYear = params.startYear || new Date().getFullYear();
      const referenceEndYear = params.endYear || new Date().getFullYear();

      const queryDateFilter =
        params.dateFilter === 'incomeDate' ? 'Fecha_Ingreso' : 'Fecha_Pago';

      const query = `
        SET NOCOUNT ON;

        DECLARE @startYear INTEGER;
        SET @startYear = '${referenceStartYear}';  
        DECLARE @endYear    INTEGER;
        SET @endYear = '${referenceEndYear}';  
        DECLARE @code           VARCHAR(5);
        SET @code = '${params.titleCode || ''}';  

        SELECT  
            YEAR(di.${queryDateFilter}) AS year,
            COUNT(DISTINCT di.ClaveCatastral) AS unique_cadastral_keys,  
            -- ##########################  
            --          General    
            -- ##########################
            COUNT(di.Cod_Ingreso) AS total_bills_issued,  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS paid_bills,  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS pending_bills,  
          
            -- Título dinámico  
            CASE  
                WHEN @code = '' OR @code IS NULL THEN 'ALL'  
                ELSE MAX(di.Cod_Titulo_Datos)  
            END AS code_title,  
            -- ##########################  
            --          EPAA    
            -- ##########################
            -- Total EPAA pendings and payments
            SUM(COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.interes_mejoras, 0)) AS total_epaa,  
            -- Total de valores pendientes EPAA  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) +COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_epaa_pendings,  
            -- Total de valores cobrados EPAA  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_epaa_collected,  
            -- Total EPAA con valor 0  
            SUM(CASE WHEN COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.interes_mejoras, 0) = 0 THEN 1 ELSE 0 END) AS total_epaa_zero,  
            -- Total EPAA con valor NULL  
            SUM(CASE  
                WHEN di.Valor_Titulo IS NULL  
                THEN 1  
                ELSE 0  
            END) AS total_epaa_null,  
            -- Total EPAA Mayor a 0  
            SUM(CASE WHEN di.Valor_Titulo > 0 THEN 1 ELSE 0 END) AS total_epaa_greater_than_zero,  
            -- Total EPAA Menor a 0  
            SUM(CASE WHEN di.Valor_Titulo < 0 THEN 1 ELSE 0 END) AS total_epaa_less_than_zero,  
          
            -- ##########################  
            --          Recargos    
            -- ##########################
            -- Total Recargos pendings and payments
            SUM(COALESCE(di.Recargo, 0)) AS total_surcharges,  
            -- Total de valores pendientes Recargos  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.Recargo, 0) ELSE 0 END) AS total_surcharges_pending,  
            -- Total de valores cobrados Recargos  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.Recargo, 0) - COALESCE(di.descuento_tb, 0) ELSE 0 END) AS total_surcharges_collected,  
            -- Total Recargos con valor 0  
            SUM(CASE WHEN COALESCE(di.Recargo, 0) = 0 THEN 1 ELSE 0 END) AS total_surcharges_zero,  
            -- Total Recargos con valor NULL  
            SUM(CASE  
                WHEN di.Recargo IS NULL  
                THEN 1  
                ELSE 0  
            END) AS total_surcharges_null,  
            -- Total Recargos Mayor a 0  
            SUM(CASE WHEN di.Recargo > 0 THEN 1 ELSE 0 END) AS total_surcharges_greater_than_zero,  
            -- Total Recargos Menor a 0  
            SUM(CASE WHEN di.Recargo < 0 THEN 1 ELSE 0 END) AS total_surcharges_less_than_zero,  
          
            -- ##########################  
            --          Terceros    
            -- ##########################
            -- Total Terceros pendings and payments
            SUM(COALESCE(di.ValorTerceros, 0)) AS total_third_parties,  
            -- Total de valores pendientes Terceros  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.ValorTerceros, 0) ELSE 0 END) AS total_third_parties_pending,  
            -- Total de valores cobrados Terceros  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.ValorTerceros, 0) ELSE 0 END) AS total_third_parties_collected,  
            -- Total Terceros con valor 0  
            SUM(CASE WHEN COALESCE(di.ValorTerceros, 0) = 0 THEN 1 ELSE 0 END) AS total_third_parties_zero,  
            -- Total Terceros con valor NULL  
            SUM(CASE  
                WHEN di.ValorTerceros IS NULL  
                THEN 1  
                ELSE 0  
            END) AS total_third_parties_null,  
            -- Total Terceros Mayor a 0  
            SUM(CASE WHEN di.ValorTerceros > 0 THEN 1 ELSE 0 END) AS total_third_parties_greater_than_zero,  
            -- Total Terceros Menor a 0  
            SUM(CASE WHEN di.ValorTerceros < 0 THEN 1 ELSE 0 END) AS total_third_parties_less_than_zero,  
          
            -- ##########################  
            --          Mejoras    
            -- ##########################
            -- Total Mejoras pendings and payments
            SUM(COALESCE(di.interes_mejoras, 0)) AS total_improvements,  
            -- Total de valores pendientes Mejoras  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_improvements_pending,  
            -- Total de valores cobrados Mejoras  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_improvements_collected,  
            -- Total Mejoras con valor 0  
            SUM(CASE WHEN COALESCE(di.interes_mejoras, 0) = 0 THEN 1 ELSE 0 END) AS total_improvements_zero,  
            -- Total Mejoras con valor NULL  
            SUM(CASE  
                WHEN di.interes_mejoras IS NULL  
                THEN 1  
                ELSE 0  
            END) AS total_improvements_null,  
            -- Total Mejoras Mayor a 0  
            SUM(CASE WHEN di.interes_mejoras > 0 THEN 1 ELSE 0 END) AS total_improvements_greater_than_zero,  
            -- Total Mejoras Menor a 0  
            SUM(CASE WHEN di.interes_mejoras < 0 THEN 1 ELSE 0 END) AS total_improvements_less_than_zero,  
          
            -- ##########################  
            --          Tasa Basura    
            -- ##########################
            -- Total Tasa Basura pendings and payments
            SUM(COALESCE(di.tasa_basura, 0)) AS total_trash_rate,  
            -- Total de valores pendientes tasa basura  
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.tasa_basura, 0) ELSE 0 END) AS total_trash_rate_pending,  
            -- Total de valores cobrados tasa basura  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.tasa_basura, 0) - COALESCE(di.descuento_tb, 0) ELSE 0 END) AS total_trash_rate_collected,  
            -- Total de descuentos tasa basura  
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.descuento_tb, 0) ELSE 0 END) AS total_trash_rate_discounts,  
          
          
            -- ##########################  
            --          Count trash rate    
            -- ##########################
            -- Total de facturas con tasa basura
            SUM(CASE WHEN di.tasa_basura IS NOT NULL THEN 1 ELSE 0 END) AS count_bills_with_trash_rate,  
            -- Total de facturas con tasa basura pendientes  
            SUM(CASE WHEN di.tasa_basura IS NOT NULL AND di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS count_bills_with_trash_rate_pending,  
            -- Total de facturas con tasa basura cobradas  
            SUM(CASE WHEN di.tasa_basura IS NOT NULL AND di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS count_bills_with_trash_rate_collected,  
            -- Total Tasa Basura con valor 0  
            SUM(CASE WHEN COALESCE(di.tasa_basura, 0) = 0 THEN 1 ELSE 0 END) AS total_trash_rate_zero,  
            -- Total Tasa Basura con valor NULL  
            SUM(CASE  
                WHEN di.tasa_basura IS NULL  
                THEN 1  
                ELSE 0  
            END) AS total_trash_rate_null,  
            -- Total Tasa Basura Mayor a 0  
            SUM(CASE WHEN di.tasa_basura > 0 THEN 1 ELSE 0 END) AS total_trash_rate_greater_than_zero,  
            -- Total Tasa Basura Menor a 0  
            SUM(CASE WHEN di.tasa_basura < 0 THEN 1 ELSE 0 END) AS total_trash_rate_less_than_zero,  
          
            -- Traemos los totales del CTE (siempre será 1 fila)  
            -- Valor promedio por factura cobrada
            AVG(CASE WHEN di.Fecha_Pago IS NOT NULL THEN  
                COALESCE(di.Valor_Titulo, 0) + COALESCE(di.tasa_basura, 0)  
                ELSE NULL END) AS average_paid_bill,  
            MAX(nc.count_notes) AS count_notes,  
            MAX(nc.total_notes_amount) AS total_notes_amount  
          
        FROM Datos_ingreso di  
        CROSS JOIN (
            SELECT
                ISNULL(SUM(Valor), 0) AS total_notes_amount,
                COUNT(*) AS count_notes
            FROM AP_NotasCredito nc_in
            WHERE EXISTS (
                SELECT 1 FROM Datos_ingreso di_sub
                WHERE di_sub.ClaveCatastral = nc_in.Cuenta
                  AND (di_sub.Cod_Titulo_Datos = @code OR @code = '' OR @code IS NULL)
            )
        ) nc
        WHERE (@code = '' OR @code IS NULL OR di.Cod_Titulo_Datos = @code) AND YEAR(di.${queryDateFilter}) BETWEEN @startYear AND @endYear
        GROUP BY
            YEAR(di.${queryDateFilter}), -- Cambiado a función YEAR para agrupar por años naturales
            CASE WHEN @code = '' OR @code IS NULL THEN '1' ELSE di.Cod_Titulo_Datos END
        ORDER BY
            YEAR(di.${queryDateFilter}) DESC;
      `;

      const queryParameters: any[] = [];

      const results =
        await this.sqlServerService.query<GeneralKPIResponseSQLResult>(
          query,
          queryParameters,
        );

      const response: GeneralYearlyKPIResponse[] = results.map((row) =>
        SQLServerGeneralCollectionAdapter.toGeneralYearlyKPIResponse(row),
      );

      return response;
    } catch (error) {
      throw error; // Manejo de errores adecuado
    }
  }

  async getGeneralMonthlyCollectionKPI(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralMonthlyKPIResponse[]> {
    try {
      const referenceStartYear = params.startYear || new Date().getFullYear();
      const referenceEndYear = params.endYear || new Date().getFullYear();

      const queryDateFilter =
        params.dateFilter === 'incomeDate' ? 'Fecha_Ingreso' : 'Fecha_Pago';

      const query = `
        SET NOCOUNT ON;

        DECLARE @startYear INT;
        SET @startYear = ${referenceStartYear};
        DECLARE @endYear INT;
        SET @endYear = ${referenceEndYear};
        DECLARE @code           VARCHAR(5);
        SET @code = '${params.titleCode || ''}';

        SELECT
            MONTH(di.${queryDateFilter}) AS month,
            YEAR(di.${queryDateFilter}) AS year,
            COUNT(DISTINCT di.ClaveCatastral) AS unique_cadastral_keys,
            -- ##########################
            --          General
            -- ##########################
            COUNT(di.Cod_Ingreso) AS total_bills_issued,
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS paid_bills,
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS pending_bills,

            -- Título dinámico
            CASE
                WHEN @code = '' OR @code IS NULL THEN 'ALL'
                ELSE MAX(di.Cod_Titulo_Datos)
            END AS code_title,
            -- ##########################
            --          EPAA
            -- ##########################
            -- Total EPAA pendings and payments
            SUM(COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.interes_mejoras, 0)) AS total_epaa,
            -- Total de valores pendientes EPAA
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) +COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_epaa_pendings,
            -- Total de valores cobrados EPAA
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_epaa_collected,
            -- Total EPAA con valor 0
            SUM(CASE WHEN COALESCE(di.Valor_Titulo, 0) + COALESCE(di.ValorTerceros, 0) + COALESCE(di.Recargo, 0) + COALESCE(di.interes_mejoras, 0) = 0 THEN 1 ELSE 0 END) AS total_epaa_zero,
            -- Total EPAA con valor NULL
            SUM(CASE
                WHEN di.Valor_Titulo IS NULL
                THEN 1
                ELSE 0
            END) AS total_epaa_null,
            -- Total EPAA Mayor a 0
            SUM(CASE WHEN di.Valor_Titulo > 0 THEN 1 ELSE 0 END) AS total_epaa_greater_than_zero,
            -- Total EPAA Menor a 0
            SUM(CASE WHEN di.Valor_Titulo < 0 THEN 1 ELSE 0 END) AS total_epaa_less_than_zero,

            -- ##########################
            --          Recargos
            -- ##########################
            -- Total Recargos pendings and payments
            SUM(COALESCE(di.Recargo, 0)) AS total_surcharges,
            -- Total de valores pendientes Recargos
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.Recargo, 0) ELSE 0 END) AS total_surcharges_pending,
            -- Total de valores cobrados Recargos
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.Recargo, 0) - COALESCE(di.descuento_tb, 0) ELSE 0 END) AS total_surcharges_collected,
            -- Total Recargos con valor 0
            SUM(CASE WHEN COALESCE(di.Recargo, 0) = 0 THEN 1 ELSE 0 END) AS total_surcharges_zero,
            -- Total Recargos con valor NULL
            SUM(CASE
                WHEN di.Recargo IS NULL
                THEN 1
                ELSE 0
            END) AS total_surcharges_null,
            -- Total Recargos Mayor a 0
            SUM(CASE WHEN di.Recargo > 0 THEN 1 ELSE 0 END) AS total_surcharges_greater_than_zero,
            -- Total Recargos Menor a 0
            SUM(CASE WHEN di.Recargo < 0 THEN 1 ELSE 0 END) AS total_surcharges_less_than_zero,

            -- ##########################
            --          Terceros
            -- ##########################
            -- Total Terceros pendings and payments
            SUM(COALESCE(di.ValorTerceros, 0)) AS total_third_parties,
            -- Total de valores pendientes Terceros
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.ValorTerceros, 0) ELSE 0 END) AS total_third_parties_pending,
            -- Total de valores cobrados Terceros
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.ValorTerceros, 0) ELSE 0 END) AS total_third_parties_collected,
            -- Total Terceros con valor 0
            SUM(CASE WHEN COALESCE(di.ValorTerceros, 0) = 0 THEN 1 ELSE 0 END) AS total_third_parties_zero,
            -- Total Terceros con valor NULL
            SUM(CASE
                WHEN di.ValorTerceros IS NULL
                THEN 1
                ELSE 0
            END) AS total_third_parties_null,
            -- Total Terceros Mayor a 0
            SUM(CASE WHEN di.ValorTerceros > 0 THEN 1 ELSE 0 END) AS total_third_parties_greater_than_zero,
            -- Total Terceros Menor a 0
            SUM(CASE WHEN di.ValorTerceros < 0 THEN 1 ELSE 0 END) AS total_third_parties_less_than_zero,

            -- ##########################
            --          Mejoras
            -- ##########################
            -- Total Mejoras pendings and payments
            SUM(COALESCE(di.interes_mejoras, 0)) AS total_improvements,
            -- Total de valores pendientes Mejoras
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_improvements_pending,
            -- Total de valores cobrados Mejoras
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.interes_mejoras, 0) ELSE 0 END) AS total_improvements_collected,
            -- Total Mejoras con valor 0
            SUM(CASE WHEN COALESCE(di.interes_mejoras, 0) = 0 THEN 1 ELSE 0 END) AS total_improvements_zero,
            -- Total Mejoras con valor NULL
            SUM(CASE
                WHEN di.interes_mejoras IS NULL
                THEN 1
                ELSE 0
            END) AS total_improvements_null,
            -- Total Mejoras Mayor a 0
            SUM(CASE WHEN di.interes_mejoras > 0 THEN 1 ELSE 0 END) AS total_improvements_greater_than_zero,
            -- Total Mejoras Menor a 0
            SUM(CASE WHEN di.interes_mejoras < 0 THEN 1 ELSE 0 END) AS total_improvements_less_than_zero,

            -- ##########################
            --          Tasa Basura
            -- ##########################
            -- Total Tasa Basura pendings and payments
            SUM(COALESCE(di.tasa_basura, 0)) AS total_trash_rate,
            -- Total de valores pendientes tasa basura
            SUM(CASE WHEN di.Fecha_Pago IS NULL THEN COALESCE(di.tasa_basura, 0) ELSE 0 END) AS total_trash_rate_pending,
            -- Total de valores cobrados tasa basura
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.tasa_basura, 0) - COALESCE(di.descuento_tb, 0) ELSE 0 END) AS total_trash_rate_collected,
            -- Total de descuentos tasa basura
            SUM(CASE WHEN di.Fecha_Pago IS NOT NULL THEN COALESCE(di.descuento_tb, 0) ELSE 0 END) AS total_trash_rate_discounts,


            -- ##########################
            --          Count trash rate
            -- ##########################
            -- Total de facturas con tasa basura
            SUM(CASE WHEN di.tasa_basura IS NOT NULL THEN 1 ELSE 0 END) AS count_bills_with_trash_rate,
            -- Total de facturas con tasa basura pendientes
            SUM(CASE WHEN di.tasa_basura IS NOT NULL AND di.Fecha_Pago IS NULL THEN 1 ELSE 0 END) AS count_bills_with_trash_rate_pending,
            -- Total de facturas con tasa basura cobradas
            SUM(CASE WHEN di.tasa_basura IS NOT NULL AND di.Fecha_Pago IS NOT NULL THEN 1 ELSE 0 END) AS count_bills_with_trash_rate_collected,
            -- Total Tasa Basura con valor 0
            SUM(CASE WHEN COALESCE(di.tasa_basura, 0) = 0 THEN 1 ELSE 0 END) AS total_trash_rate_zero,
            -- Total Tasa Basura con valor NULL
            SUM(CASE
                WHEN di.tasa_basura IS NULL
                THEN 1
                ELSE 0
            END) AS total_trash_rate_null,
            -- Total Tasa Basura Mayor a 0
            SUM(CASE WHEN di.tasa_basura > 0 THEN 1 ELSE 0 END) AS total_trash_rate_greater_than_zero,
            -- Total Tasa Basura Menor a 0
            SUM(CASE WHEN di.tasa_basura < 0 THEN 1 ELSE 0 END) AS total_trash_rate_less_than_zero,

            -- Traemos los totales del CTE (siempre será 1 fila)
            -- Valor promedio por factura cobrada
            AVG(CASE WHEN di.Fecha_Pago IS NOT NULL THEN
                COALESCE(di.Valor_Titulo, 0) + COALESCE(di.tasa_basura, 0)
                ELSE NULL END) AS average_paid_bill,
            MAX(nc.count_notes) AS count_notes,
            MAX(nc.total_notes_amount) AS total_notes_amount

            FROM Datos_ingreso di
            CROSS JOIN (
                SELECT
                    ISNULL(SUM(Valor), 0) AS total_notes_amount,
                    COUNT(*) AS count_notes
                FROM AP_NotasCredito nc_in
                WHERE EXISTS (
                    SELECT 1
                    FROM Datos_ingreso di_sub
                    WHERE di_sub.ClaveCatastral = nc_in.Cuenta
                      AND YEAR(di_sub.${queryDateFilter}) BETWEEN @startYear AND @endYear
                    )
                ) nc
            WHERE YEAR(di.${queryDateFilter}) BETWEEN @startYear AND @endYear
                AND (di.Cod_Titulo_Datos = @code OR @code = '' OR @code IS NULL)
            GROUP BY
                YEAR(di.${queryDateFilter}),
                MONTH(di.${queryDateFilter})
            ORDER BY
                YEAR(di.${queryDateFilter}) DESC, MONTH(di.${queryDateFilter}) DESC;
      `;

      const queryParameters: any[] = [];

      const results =
        await this.sqlServerService.query<GeneralKPIResponseSQLResult>(
          query,
          queryParameters,
        );

      const response: GeneralMonthlyKPIResponse[] = results.map((row) =>
        SQLServerGeneralCollectionAdapter.toGeneralMonthlyKPIResponse(row),
      );

      return response;
    } catch (error) {
      throw error; // Manejo de errores adecuado
    }
  }

  async getGeneralYearlyCollectionGroupedReport(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralYearlyGroupedReportResponse[]> {
    try {
      const referenceStartYear = params.startYear || new Date().getFullYear();
      const referenceEndYear = params.endYear || new Date().getFullYear();

      const safeOffset =
        Number.isInteger(params.offset) && params.offset! >= 0
          ? params.offset!
          : 0;
      const safeLimit =
        Number.isInteger(params.limit) && params.limit! > 0
          ? params.limit!
          : 1000000;

      let queryDateFilter = '';
      if (params.dateFilter === 'paymentDate') {
        queryDateFilter = 'Fecha_Pago';
      } else if (params.dateFilter === 'incomeDate') {
        queryDateFilter = 'Fecha_Ingreso';
      } else {
        queryDateFilter = 'Fecha_Pago'; // Valor predeterminado
      }

      let titleCodeFilter = '';
      if (params.titleCode && params.titleCode.length > 0) {
        titleCodeFilter = `AND Cod_Titulo_Datos = '${params.titleCode}'`;
      }

      const query = `
        SET NOCOUNT ON;

        SELECT IDENTITY(INT, 1, 1) AS RowNum, *
        INTO #TempOrdered
        FROM (
            SELECT  
                YEAR(${queryDateFilter}) AS year,  
                CONVERT(VARCHAR(10), ${queryDateFilter}, 120)      AS date,  
                User_Cobro                                 AS collector,  
                Cod_Titulo_Datos                           AS title_code,  
                FormaDePago                                AS payment_method,  
                Estado_Ingreso                             AS status,  
                SUM(COALESCE(Valor_Titulo,  0))            AS title_value,  
                SUM(COALESCE(ValorTerceros, 0))            AS third_party_value,  
                SUM(COALESCE(Recargo,       0))            AS surcharge_value,  
                SUM(COALESCE(tasa_basura,   0))            AS trash_rate_value,  
                SUM(COALESCE(descuento_tb,  0))            AS discount_trash_rate_value,  
                SUM(  
                    COALESCE(Valor_Titulo,  0) +  
                    COALESCE(ValorTerceros, 0) +  
                    COALESCE(Recargo,       0) +  
                    COALESCE(tasa_basura,   0) -  
                    COALESCE(descuento_tb,  0)  
                )                                          AS total_value,  
                COUNT(Cod_Ingreso)                         AS record_count  
            FROM Datos_ingreso  
            WHERE YEAR(${queryDateFilter}) BETWEEN ${referenceStartYear} AND ${referenceEndYear}
              ${titleCodeFilter}  
            GROUP BY  
                YEAR(${queryDateFilter}),  
                CONVERT(VARCHAR(10), ${queryDateFilter}, 120),  
                User_Cobro,  
                Cod_Titulo_Datos,  
                FormaDePago,  
                Estado_Ingreso  
        ) i
        ORDER BY year, collector, title_code, payment_method;

        SELECT 
            year,  
            collector,  
            title_code,  
            payment_method,  
            status,  
            title_value,  
            third_party_value,  
            surcharge_value,  
            trash_rate_value,  
            discount_trash_rate_value,  
            total_value,  
            record_count  
        FROM #TempOrdered
        WHERE RowNum > ${safeOffset} AND RowNum <= ${safeOffset + safeLimit}
        ORDER BY RowNum;

        DROP TABLE #TempOrdered;
      `;

      const queryParameters: any[] = [];

      const results = await this.sqlServerService.query<any>(
        query,
        queryParameters,
      );

      const response: GeneralYearlyGroupedReportResponse[] = results.map(
        (sqlResult) =>
          SQLServerGeneralCollectionAdapter.toGeneralYearlyGroupedReportResponse(
            sqlResult,
          ),
      );

      return response;
    } catch (error) {
      throw error; // Manejo de errores adecuado
    }
  }

  async getGeneralMonthlyCollectionGroupedReport(
    params: GeneralTrendCollectionsParams,
  ): Promise<GeneralMonthlyGroupedReportResponse[]> {
    try {
      const referenceStartYear = params.startYear || new Date().getFullYear();
      const referenceEndYear = params.endYear || new Date().getFullYear();

      const safeOffset =
        Number.isInteger(params.offset) && params.offset! >= 0
          ? params.offset!
          : 0;
      const safeLimit =
        Number.isInteger(params.limit) && params.limit! > 0
          ? params.limit!
          : 1000000;

      let queryDateFilter = '';
      if (params.dateFilter === 'paymentDate') {
        queryDateFilter = 'Fecha_Pago';
      } else if (params.dateFilter === 'incomeDate') {
        queryDateFilter = 'Fecha_Ingreso';
      } else {
        queryDateFilter = 'Fecha_Pago'; // Valor predeterminado
      }

      let titleCodeFilter = '';
      if (params.titleCode && params.titleCode.length > 0) {
        titleCodeFilter = `AND Cod_Titulo_Datos = '${params.titleCode}'`;
      }

      const query = `
        SET NOCOUNT ON;

        SELECT IDENTITY(INT, 1, 1) AS RowNum, *
        INTO #TempOrdered
        FROM (
            SELECT  
                CONVERT(VARCHAR(2), ${queryDateFilter}, 101) AS month,
                YEAR(${queryDateFilter}) AS year,  
                CONVERT(VARCHAR(10), ${queryDateFilter}, 120)      AS date,  
                User_Cobro                                 AS collector,  
                Cod_Titulo_Datos                           AS title_code,  
                FormaDePago                                AS payment_method,  
                Estado_Ingreso                             AS status,  
                SUM(COALESCE(Valor_Titulo,  0))            AS title_value,  
                SUM(COALESCE(ValorTerceros, 0))            AS third_party_value,  
                SUM(COALESCE(Recargo,       0))            AS surcharge_value,  
                SUM(COALESCE(tasa_basura,   0))            AS trash_rate_value,  
                SUM(COALESCE(descuento_tb,  0))            AS discount_trash_rate_value,  
                SUM(  
                    COALESCE(Valor_Titulo,  0) +  
                    COALESCE(ValorTerceros, 0) +  
                    COALESCE(Recargo,       0) +  
                    COALESCE(tasa_basura,   0) -  
                    COALESCE(descuento_tb,  0)  
                )                                          AS total_value,  
                COUNT(Cod_Ingreso)                         AS record_count  
            FROM Datos_ingreso  
            WHERE YEAR(${queryDateFilter}) BETWEEN ${referenceStartYear} AND ${referenceEndYear}
              ${titleCodeFilter}  
            GROUP BY  
                CONVERT(VARCHAR(2), ${queryDateFilter}, 101), 
                YEAR(${queryDateFilter}),  
                CONVERT(VARCHAR(10), ${queryDateFilter}, 120),  
                User_Cobro,  
                Cod_Titulo_Datos,  
                FormaDePago,  
                Estado_Ingreso  
        ) i
        ORDER BY month, year, collector, title_code, payment_method;

        SELECT 
            month, year,  
            collector,  
            title_code,  
            payment_method,  
            status,  
            title_value,  
            third_party_value,  
            surcharge_value,  
            trash_rate_value,  
            discount_trash_rate_value,  
            total_value,  
            record_count  
        FROM #TempOrdered
        WHERE RowNum > ${safeOffset} AND RowNum <= ${safeOffset + safeLimit}
        ORDER BY RowNum;

        DROP TABLE #TempOrdered;
      `;

      const queryParameters: any[] = [];

      const results = await this.sqlServerService.query<any>(
        query,
        queryParameters,
      );

      const response: GeneralMonthlyGroupedReportResponse[] = results.map(
        (sqlResult) =>
          SQLServerGeneralCollectionAdapter.toGeneralMonthlyGroupedReportResponse(
            sqlResult,
          ),
      );

      return response;
    } catch (error) {
      throw error; // Manejo de errores adecuado
    }
  }
}
