import { Injectable } from '@nestjs/common';
import { DatabaseServiceSQLServer2022 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2022.service';
import { InterfaceAgreementsRepository } from '../../../../domain/contracts/agreements.interface.repository';
import { AgreementsParams } from '../../../../domain/schemas/dto/request/agreements.params';
import { SqlServerAgreementsAdapter } from '../adapters/sql-server.agreements.adapter';
import { AgreementKPIsSqlResult } from '../../../interfaces/sql/agreements.sql.response';
import { AgreementKPIsResponse } from '../../../../domain/schemas/dto/response/agreements.response';

@Injectable()
export class SqlServerAgreementsPersistence
  implements InterfaceAgreementsRepository
{
  constructor(private readonly sqlServerService: DatabaseServiceSQLServer2022) {
    // Inyecta cualquier servicio necesario, como el servicio de base de datos
  }

  async getAgreementsKpi(
    params: AgreementsParams,
  ): Promise<AgreementKPIsResponse[]> {
    try {
      // Construye la consulta SQL utilizando los parámetros proporcionados

      const searchType = params.searchType?.toLocaleUpperCase() || 'MONTH'; // Valor predeterminado
      const startYear = params.startYear || 2015; // Valor predeterminado
      const endYear = params.endYear || 2026; // Valor predeterminado

      const query = `
        SET NOCOUNT ON;

        DECLARE @SearchType VARCHAR(10)
        SET @SearchType = '${searchType}'

        DECLARE @startDate DATETIME
        SET @startDate = CONVERT(DATETIME, '${startYear}-01-01 00:00:00.000', 120)

        DECLARE @endDate DATETIME
        SET @endDate = CONVERT(DATETIME, '${endYear}-12-31 23:59:59.997', 120)

        SELECT
            -- =============================================
            -- 1. DIMENSIONES TEMPORALES
            -- =============================================
            YEAR(fecha_emision) AS year,
            CASE WHEN @SearchType IN ('MONTH','DAY') THEN MONTH(fecha_emision) ELSE NULL END AS month,
            CASE WHEN @SearchType = 'DAY' THEN DAY(fecha_emision) ELSE NULL END AS day,

            -- =============================================
            -- 2. TOTALES FINANCIEROS
            -- =============================================
            SUM(valor_capital + valor_interes + valor_recargo) AS total_emitted,
            SUM(CASE WHEN estado_pago = 1 THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) AS total_collected,
            SUM(CASE WHEN estado_pago = 0 THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) AS total_pending,

            -- =============================================
            -- 3. DESGLOSE POR COMPONENTE
            -- =============================================
            SUM(valor_capital)      AS total_principal,
            SUM(valor_interes)      AS total_interest,
            SUM(valor_recargo)      AS total_surcharge,

            -- =============================================
            -- 4. NUEVOS: RECUPERACIÓN DE CAPITAL
            -- =============================================
            SUM(CASE WHEN estado_pago = 1 THEN valor_capital ELSE 0 END) AS principal_collected,
            CAST(SUM(CASE WHEN estado_pago = 1 THEN valor_capital ELSE 0 END) * 100.0 /
                NULLIF(SUM(valor_capital), 0) AS DECIMAL(10,2)) AS principal_recovery_pct,

            -- =============================================
            -- 5. EFICIENCIA DE COBRO
            -- =============================================
            CAST(SUM(CASE WHEN estado_pago = 1 THEN 1.0 ELSE 0.0 END) * 100.0 /
                NULLIF(COUNT(*), 0) AS DECIMAL(10,2)) AS collection_efficiency_pct,

            CAST(SUM(CASE WHEN estado_pago = 1 THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) * 100.0 /
                NULLIF(SUM(valor_capital + valor_interes + valor_recargo), 0) AS DECIMAL(10,2)) AS collection_amount_pct,

            -- =============================================
            -- 6. CONTEOS Y CLIENTES
            -- =============================================
            COUNT(DISTINCT ciudadano_id)        AS total_citizens_with_agreements,
            COUNT(*)                            AS total_installments_count,
            SUM(CASE WHEN estado_pago = 0 THEN 1 ELSE 0 END ) AS total_installments_pendings,
            SUM(CASE WHEN estado_pago = 1 THEN 1 ELSE 0 END ) AS total_installments_paid,

            -- =============================================
            -- 7. MÉTRICAS DE VENCIMIENTO Y RIESGO (Mejoradas)
            -- =============================================
            SUM(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE() THEN 1 ELSE 0 END) AS overdue_installments_count,
            SUM(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE() THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) AS overdue_amount,

            AVG(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE()
                    THEN DATEDIFF(day, fecha_vencimiento, GETDATE()) END) AS avg_overdue_days,

            MAX(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE()
                    THEN DATEDIFF(day, fecha_vencimiento, GETDATE()) END) AS max_overdue_days,

            -- Aging Buckets (muy útil para gestión de cobranza)
            SUM(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE()
                    AND DATEDIFF(day, fecha_vencimiento, GETDATE()) BETWEEN 1 AND 30 THEN 1 ELSE 0 END) AS overdue_1_30_days,

            SUM(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE()
                    AND DATEDIFF(day, fecha_vencimiento, GETDATE()) BETWEEN 31 AND 60 THEN 1 ELSE 0 END) AS overdue_31_60_days,

            SUM(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE()
                    AND DATEDIFF(day, fecha_vencimiento, GETDATE()) BETWEEN 61 AND 90 THEN 1 ELSE 0 END) AS overdue_61_90_days,

            SUM(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE()
                    AND DATEDIFF(day, fecha_vencimiento, GETDATE()) > 90 THEN 1 ELSE 0 END) AS overdue_more_90_days,

            SUM(CASE WHEN estado_pago = 0 AND fecha_vencimiento < DATEADD(month, -3, GETDATE()) THEN 1 ELSE 0 END) AS critical_overdue_count,

            SUM(CASE WHEN estado_pago = 0 THEN valor_capital ELSE 0 END) AS capital_balance_pending,

            -- =============================================
            -- 8. PROMEDIOS Y OTROS
            -- =============================================
            AVG(valor_capital + valor_interes + valor_recargo) AS avg_installment_value,

            AVG(CASE WHEN estado_pago = 1 THEN DATEDIFF(day, fecha_emision, fecha_pago) END) AS avg_days_to_pay   -- (si tienes columna fecha_pago)

        FROM Datos_Ingreso_Convenio
        WHERE fecha_emision BETWEEN @startDate AND @endDate
        GROUP BY
            YEAR(fecha_emision),
            CASE WHEN @SearchType IN ('MONTH','DAY') THEN MONTH(fecha_emision) ELSE NULL END,
            CASE WHEN @SearchType = 'DAY' THEN DAY(fecha_emision) ELSE NULL END
        ORDER BY year DESC, month DESC, day DESC;
      `;

      // Ejecuta la consulta utilizando el servicio de base de datos
      const rawData: AgreementKPIsSqlResult[] =
        await this.sqlServerService.query<AgreementKPIsSqlResult>(query);

      // Adapta los resultados crudos a tu formato de respuesta deseado
      const adaptedData =
        new SqlServerAgreementsAdapter().adaptAgreementsKpiData(rawData);

      return adaptedData;
    } catch (error) {
      // Maneja cualquier error que pueda ocurrir durante la consulta
      console.error('Error fetching agreements KPI:', error);
      throw new Error('Failed to fetch agreements KPI');
    }
  }
}
