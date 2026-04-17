import { Injectable } from '@nestjs/common';
import { DatabaseServiceSQLServer2000 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2000.service';
import { InterfaceAgreementsRepository } from '../../../../domain/contracts/agreements.interface.repository';
import { AgreementsParams } from '../../../../domain/schemas/dto/request/agreements.params';
import { SqlServerAgreementsAdapter } from '../adapters/sql-server.agreements.adapter';
import { AgreementKPIsSqlResult } from '../../../interfaces/sql/agreements.sql.response';
import { AgreementKPIsResponse } from '../../../../domain/schemas/dto/response/agreements.response';

@Injectable()
export class SqlServer2000AgreementsPersistence
  implements InterfaceAgreementsRepository
{
  constructor(private readonly sqlServerService: DatabaseServiceSQLServer2000) {}

  async getAgreementsKpi(
    params: AgreementsParams,
  ): Promise<AgreementKPIsResponse[]> {
    try {
      const searchType = params.searchType?.toLocaleUpperCase() || 'MONTH';
      const startYear = params.startYear || 2015;
      const endYear = params.endYear || 2026;

      const query = `
        SET NOCOUNT ON;

        DECLARE @SearchType VARCHAR(10)
        SET @SearchType = '${searchType}'

        DECLARE @startDate DATETIME
        SET @startDate = CONVERT(DATETIME, '${startYear}-01-01 00:00:00.000', 120)

        DECLARE @endDate DATETIME
        SET @endDate = CONVERT(DATETIME, '${endYear}-12-31 23:59:59.997', 120)

        SELECT
            YEAR(fecha_emision) AS year,
            CASE WHEN @SearchType IN ('MONTH','DAY') THEN MONTH(fecha_emision) ELSE NULL END AS month,
            CASE WHEN @SearchType = 'DAY' THEN DAY(fecha_emision) ELSE NULL END AS day,

            SUM(valor_capital + valor_interes + valor_recargo) AS total_emitted,
            SUM(CASE WHEN estado_pago = 1 THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) AS total_collected,
            SUM(CASE WHEN estado_pago = 0 THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) AS total_pending,

            SUM(valor_capital)      AS total_principal,
            SUM(valor_interes)      AS total_interest,
            SUM(valor_recargo)      AS total_surcharge,

            SUM(CASE WHEN estado_pago = 1 THEN valor_capital ELSE 0 END) AS principal_collected,
            CAST(SUM(CASE WHEN estado_pago = 1 THEN valor_capital ELSE 0 END) * 100.0 /
                NULLIF(SUM(valor_capital), 0) AS DECIMAL(10,2)) AS principal_recovery_pct,

            CAST(SUM(CASE WHEN estado_pago = 1 THEN 1.0 ELSE 0.0 END) * 100.0 /
                NULLIF(COUNT(*), 0) AS DECIMAL(10,2)) AS collection_efficiency_pct,

            CAST(SUM(CASE WHEN estado_pago = 1 THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) * 100.0 /
                NULLIF(SUM(valor_capital + valor_interes + valor_recargo), 0) AS DECIMAL(10,2)) AS collection_amount_pct,

            COUNT(DISTINCT ciudadano_id)        AS total_citizens_with_agreements,
            COUNT(*)                            AS total_installments_count,
            SUM(CASE WHEN estado_pago = 0 THEN 1 ELSE 0 END ) AS total_installments_pendings,
            SUM(CASE WHEN estado_pago = 1 THEN 1 ELSE 0 END ) AS total_installments_paid,

            SUM(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE() THEN 1 ELSE 0 END) AS overdue_installments_count,
            SUM(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE() THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) AS overdue_amount,

            AVG(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE()
                    THEN DATEDIFF(day, fecha_vencimiento, GETDATE()) END) AS avg_overdue_days,

            MAX(CASE WHEN estado_pago = 0 AND fecha_vencimiento < GETDATE()
                    THEN DATEDIFF(day, fecha_vencimiento, GETDATE()) END) AS max_overdue_days,

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

            AVG(valor_capital + valor_interes + valor_recargo) AS avg_installment_value,

            AVG(CASE WHEN estado_pago = 1 THEN DATEDIFF(day, fecha_emision, fecha_pago) END) AS avg_days_to_pay

        FROM Datos_Ingreso_Convenio
        WHERE fecha_emision BETWEEN @startDate AND @endDate
        GROUP BY
            YEAR(fecha_emision),
            CASE WHEN @SearchType IN ('MONTH','DAY') THEN MONTH(fecha_emision) ELSE NULL END,
            CASE WHEN @SearchType = 'DAY' THEN DAY(fecha_emision) ELSE NULL END
        ORDER BY year DESC, month DESC, day DESC;
      `;

      const rawData: AgreementKPIsSqlResult[] =
        await this.sqlServerService.query<AgreementKPIsSqlResult>(query);

      const adaptedData =
        new SqlServerAgreementsAdapter().adaptAgreementsKpiData(rawData);

      return adaptedData;
    } catch (error) {
      console.error('Error fetching agreements KPI (SQL 2000):', error);
      throw new Error('Failed to fetch agreements KPI');
    }
  }
}
