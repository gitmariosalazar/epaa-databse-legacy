import { Injectable } from '@nestjs/common';
import { DatabaseServiceSQLServer2000 } from '../../../../../../shared/connections/database/sqlserver/sqlserver-2000.service';
import { InterfaceAgreementsRepository } from '../../../../domain/contracts/agreements.interface.repository';
import {
  AgreementsCustomerParams,
  AgreementsParams,
} from '../../../../domain/schemas/dto/request/agreements.params';
import { SqlServerAgreementsAdapter } from '../adapters/sql-server.agreements.adapter';
import {
  AgreementInstallmentSqlResult,
  AgreementKPIsCustomerSqlResult,
  AgreementKPIsSqlResult,
  CitizenSummarySqlResult,
  CollectorPerformanceSqlResult,
  DebtorSqlResult,
  MonthlyCollectionSummarySqlResult,
  PaymentMethodSummarySqlResult,
} from '../../../interfaces/sql/agreements.sql.response';
import {
  AgreementInstallmentResponse,
  AgreementKPIsCustomerResponse,
  AgreementKPIsResponse,
  CitizenSummary,
  CollectorPerformance,
  Debtor,
  MonthlyCollectionSummary,
  PaymentMethodSummary,
} from '../../../../domain/schemas/dto/response/agreements.response';
import { DateRangeParams } from '../../../../domain/schemas/dto/response/entry-data.response';

@Injectable()
export class SqlServer2000AgreementsPersistence
  implements InterfaceAgreementsRepository
{
  constructor(
    private readonly sqlServerService: DatabaseServiceSQLServer2000,
  ) {}

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

      const adaptedData: AgreementKPIsResponse[] =
        new SqlServerAgreementsAdapter().adaptAgreementsKpiData(rawData);

      return adaptedData;
    } catch (error) {
      console.error('Error fetching agreements KPI (SQL 2000):', error);
      throw new Error('Failed to fetch agreements KPI');
    }
  }

  async getAgreementsKpiCustomer(
    cardId: string,
    params: AgreementsCustomerParams,
  ): Promise<AgreementKPIsCustomerResponse[]> {
    try {
      const searchType = params.searchType?.toLocaleUpperCase() || 'MONTH';
      const startYear = params.startYear || 2015;
      const endYear = params.endYear || 2026;

      const query = `
SET NOCOUNT ON;

DECLARE @Card_Id VARCHAR(15)
SET @Card_Id = '${cardId}'

DECLARE @SearchType VARCHAR(10)
SET @SearchType = '${searchType}'

DECLARE @startDate DATETIME
SET @startDate = CONVERT(DATETIME, '${startYear}-01-01 00:00:00.000', 120)

DECLARE @endDate DATETIME
SET @endDate = CONVERT(DATETIME, '${endYear}-12-31 23:59:59.997', 120)

SELECT
    ciudadano_id AS ard_id,
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

    AVG(CASE WHEN estado_pago = 1 THEN DATEDIFF(day, fecha_emision, fecha_pago) END) AS avg_days_to_pay,  -- (si tienes columna fecha_pago)
    MIN(fecha_emision) AS first_installment_date,
    MAX(fecha_emision) AS last_installment_date,
    MIN(fecha_vencimiento) AS oldest_due_date,
    COUNT(DISTINCT id) AS total_agreements,        -- si tienes convenio_id
    SUM(CASE WHEN estado_pago = 0 AND fecha_vencimiento >= GETDATE() THEN 1 ELSE 0 END) AS pending_not_overdue
FROM Datos_Ingreso_Convenio
WHERE fecha_emision BETWEEN @startDate AND @endDate
AND ciudadano_id = @Card_Id
GROUP BY
    ciudadano_id,
    YEAR(fecha_emision),
    CASE WHEN @SearchType IN ('MONTH','DAY') THEN MONTH(fecha_emision) ELSE NULL END,
    CASE WHEN @SearchType = 'DAY' THEN DAY(fecha_emision) ELSE NULL END
ORDER BY year DESC, month DESC, day DESC;
      `;

      const rawData: AgreementKPIsCustomerSqlResult[] =
        await this.sqlServerService.query<AgreementKPIsCustomerSqlResult>(
          query,
        );

      const adaptedData: AgreementKPIsCustomerResponse[] = rawData.map((item) =>
        new SqlServerAgreementsAdapter().adaptAgreementKpiDataCustomer(item),
      );

      return adaptedData;
    } catch (error) {
      console.error(
        'Error fetching agreements KPI for customer (SQL 2000):',
        error,
      );
      throw new Error('Failed to fetch agreements KPI for customer');
    }
  }

  async getAgreementInstallmentDetails(
    cardId: string,
    params: DateRangeParams,
  ): Promise<AgreementInstallmentResponse[]> {
    try {
      const initDateTime = `${String(params.startDate)} 00:00:00.000`;
      const endDateTime = `${String(params.endDate)} 23:59:59.997`;
      const query = `
        SET NOCOUNT ON;

        DECLARE @Card_Id VARCHAR(15)
        DECLARE @startDate DATETIME
        DECLARE @endDate DATETIME

        SET @Card_Id = '${cardId}'
        SET @startDate = CONVERT(DATETIME, '${initDateTime}', 120)
        SET @endDate   = CONVERT(DATETIME, '${endDateTime}', 120)

        SELECT
            -- =============================================
            -- BASIC INSTALLMENT INFORMATION
            -- =============================================
            di.ciudadano_id AS citizen_id,
            c.NOMBRES_CIUDADANO AS first_name,
            c.APELLIDOS_CIUDADANO AS last_name,
            c.EMAIL_CIUDADANO AS email,
            c.TELEFONO_CIUDADANO AS phone,
            ISNULL(di.id, 'NO_AGREEMENT') AS agreement_id,
            di.fecha_emision AS issue_date,
            di.fecha_vencimiento AS due_date,

            CASE
                WHEN di.estado_pago = 1 THEN di.fecha_pago
                ELSE NULL
            END AS payment_date,

            -- =============================================
            -- FINANCIAL VALUES
            -- =============================================
            di.valor_capital AS principal_amount,
            di.valor_interes AS interest_amount,
            di.valor_recargo AS surcharge_amount,
            (di.valor_capital + di.valor_interes + di.valor_recargo) AS total_installment_amount,

            -- =============================================
            -- PAYMENT STATUS
            -- =============================================
            CASE
                WHEN di.estado_pago = 1 THEN 'PAID'
                WHEN di.estado_pago = 0 AND di.fecha_vencimiento < GETDATE() THEN 'OVERDUE'
                WHEN di.estado_pago = 0 AND di.fecha_vencimiento >= GETDATE() THEN 'PENDING'
                ELSE 'UNKNOWN'
            END AS installment_status,

            di.estado_pago AS payment_status,   -- 1 = Paid, 0 = Pending

            -- =============================================
            -- DAYS IN ARREARS
            -- =============================================
            CASE
                WHEN di.estado_pago = 0 AND di.fecha_vencimiento < GETDATE()
                THEN DATEDIFF(DAY, di.fecha_vencimiento, GETDATE())
                ELSE 0
            END AS days_overdue,

            -- =============================================
            -- OVERDUE CATEGORY (Aging)
            -- =============================================
            CASE
                WHEN di.estado_pago = 1 THEN 'PAID'
                WHEN di.estado_pago = 0 AND di.fecha_vencimiento >= GETDATE() THEN 'ON_TIME'
                WHEN DATEDIFF(DAY, di.fecha_vencimiento, GETDATE()) BETWEEN 1 AND 30 THEN '1-30 DAYS'
                WHEN DATEDIFF(DAY, di.fecha_vencimiento, GETDATE()) BETWEEN 31 AND 60 THEN '31-60 DAYS'
                WHEN DATEDIFF(DAY, di.fecha_vencimiento, GETDATE()) BETWEEN 61 AND 90 THEN '61-90 DAYS'
                WHEN DATEDIFF(DAY, di.fecha_vencimiento, GETDATE()) > 90 THEN 'MORE THAN 90 DAYS'
                ELSE 'NO_ARREARS'
            END AS overdue_category,

            CASE
                WHEN di.estado_pago = 0 AND di.fecha_vencimiento < DATEADD(MONTH, -3, GETDATE())
                THEN 'CRITICAL'
                ELSE 'NORMAL'
            END AS risk_level,

            di.valor_capital AS pending_principal,

            DATEDIFF(DAY, di.fecha_emision, GETDATE()) AS days_since_issue,

            CASE
                WHEN di.estado_pago = 1 THEN DATEDIFF(DAY, di.fecha_emision, di.fecha_pago)
                ELSE NULL
            END AS days_to_payment

        FROM Datos_Ingreso_Convenio di
        INNER JOIN CIUDADANO c
            ON c.CED_IDENT_CIUDADANO = di.ciudadano_id
        WHERE ciudadano_id = @Card_Id
          AND fecha_emision BETWEEN @startDate AND @endDate
        ORDER BY fecha_vencimiento DESC, fecha_emision DESC;
      `;

      const rawData: AgreementInstallmentSqlResult[] =
        await this.sqlServerService.query<AgreementInstallmentSqlResult>(query);

      const adaptedData: AgreementInstallmentResponse[] = rawData.map((item) =>
        new SqlServerAgreementsAdapter().adaptAgreementInstallmentData(item),
      );

      return adaptedData;
    } catch (error) {
      console.error(
        'Error fetching agreement installment details (SQL 2000):',
        error,
      );
      throw new Error('Failed to fetch agreement installment details');
    }
  }

  async getMonthlyCollectionSummary(
    monthsBack: number,
  ): Promise<MonthlyCollectionSummary[]> {
    try {
      const query = `
        SET NOCOUNT ON;

        DECLARE @MonthsBack INT
        SET @MonthsBack = ${monthsBack}

        SELECT
            CONVERT(VARCHAR(7), fecha_emision, 126) AS month_key,
            
            -- TOTALES FINANCIEROS
            SUM(valor_capital + valor_interes + valor_recargo) AS amount_emitted,
            SUM(CASE WHEN estado_pago = 1 THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) AS amount_collected,
            SUM(CASE WHEN estado_pago = 0 THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) AS amount_pending,

            -- EFICIENCIA DE COBRO
            CAST(
                SUM(CASE WHEN estado_pago = 1 THEN 1.0 ELSE 0.0 END) * 100.0 /
                NULLIF(COUNT(*), 0) AS DECIMAL(10,2)
            ) AS collection_efficiency_pct,

            CAST(
                SUM(CASE WHEN estado_pago = 1 THEN (valor_capital + valor_interes + valor_recargo) ELSE 0 END) * 100.0 /
                NULLIF(SUM(valor_capital + valor_interes + valor_recargo), 0) AS DECIMAL(10,2)
            ) AS collection_amount_pct,

            -- DESGLOSE
            SUM(valor_capital) AS principal_emitted,
            SUM(valor_interes) AS interest_emitted,
            SUM(valor_recargo) AS surcharge_emitted,

            -- CONTEOS
            COUNT(*) AS total_installments,
            COUNT(CASE WHEN estado_pago = 1 THEN 1 END) AS paid_installments,
            COUNT(CASE WHEN estado_pago = 0 THEN 1 END) AS pending_installments

        FROM Datos_Ingreso_Convenio
        WHERE fecha_emision >= DATEADD(MONTH, -@MonthsBack, GETDATE())
        GROUP BY CONVERT(VARCHAR(7), fecha_emision, 126)
        ORDER BY month_key DESC;
      `;

      const rawData =
        await this.sqlServerService.query<MonthlyCollectionSummarySqlResult>(
          query,
        );
      return new SqlServerAgreementsAdapter().adaptMonthlyCollectionSummary(
        rawData,
      );
    } catch (error) {
      console.error('Error fetching monthly collection summary:', error);
      throw error;
    }
  }

  async getDebtorsWithRisk(): Promise<Debtor[]> {
    try {
      const query = `
        SET NOCOUNT ON;

        SELECT
            c.CED_IDENT_CIUDADANO AS card_id,
            c.NOMBRES_CIUDADANO + ' ' + c.APELLIDOS_CIUDADANO AS full_name,
            di.clave_catastral AS cadastral_key,

            -- MÉTRICAS DE MORA
            COUNT(CASE WHEN di.estado_pago = 0 AND di.fecha_vencimiento < GETDATE() THEN 1 END) AS overdue_installments,
            SUM(CASE WHEN di.estado_pago = 0 THEN (di.valor_capital + di.valor_interes + di.valor_recargo) ELSE 0 END) AS total_debt,
            SUM(CASE WHEN di.estado_pago = 0 THEN di.valor_capital ELSE 0 END) AS pending_principal,

            -- FECHAS IMPORTANTES
            MAX(di.fecha_vencimiento) AS last_due_date,
            MIN(CASE WHEN di.estado_pago = 0 THEN di.fecha_vencimiento END) AS oldest_due_date,

            -- DÍAS PROMEDIO DE MORA
            AVG(CASE WHEN di.estado_pago = 0 AND di.fecha_vencimiento < GETDATE() 
                     THEN DATEDIFF(DAY, di.fecha_vencimiento, GETDATE()) END) AS avg_overdue_days,

            -- NIVEL DE RIESGO MEJORADO
            CASE
                WHEN COUNT(CASE WHEN di.estado_pago = 0 AND di.fecha_vencimiento < GETDATE() THEN 1 END) >= 5 THEN 'CRÍTICO'
                WHEN COUNT(CASE WHEN di.estado_pago = 0 AND di.fecha_vencimiento < GETDATE() THEN 1 END) >= 3 THEN 'ALTO'
                WHEN COUNT(CASE WHEN di.estado_pago = 0 AND di.fecha_vencimiento < GETDATE() THEN 1 END) > 0 THEN 'MEDIO'
                ELSE 'BAJO'
            END AS risk_level

        FROM Datos_Ingreso_Convenio di
        INNER JOIN CIUDADANO c 
            ON c.CED_IDENT_CIUDADANO = di.ciudadano_id
        GROUP BY 
            c.CED_IDENT_CIUDADANO, 
            c.NOMBRES_CIUDADANO, 
            c.APELLIDOS_CIUDADANO, 
            di.clave_catastral
        HAVING SUM(CASE WHEN di.estado_pago = 0 THEN 1 ELSE 0 END) > 0
        ORDER BY total_debt DESC, overdue_installments DESC;
      `;

      const rawData = await this.sqlServerService.query<DebtorSqlResult>(query);
      return new SqlServerAgreementsAdapter().adaptDebtors(rawData);
    } catch (error) {
      console.error('Error fetching debtors with risk:', error);
      throw error;
    }
  }

  async getCollectorPerformance(
    params: DateRangeParams,
  ): Promise<CollectorPerformance[]> {
    try {
      const query = `
        SET NOCOUNT ON;  
          
        DECLARE @Date_Start DATETIME  
        DECLARE @Date_End   DATETIME  
        DECLARE @Total_Global DECIMAL(18,4)  
          
        SET @Date_Start = CONVERT(DATETIME, '${params.startDate}', 120)  
        SET @Date_End   = CONVERT(DATETIME, '${params.endDate}', 120)  
          
        -- Calcular total global primero (necesario en SQL 2000)  
        SELECT @Total_Global = SUM(valor_capital + valor_interes + valor_recargo)  
        FROM Datos_Ingreso_Convenio  
        WHERE estado_pago = 1  
          AND fecha_pago BETWEEN @Date_Start AND @Date_End  
          
        SELECT  
            ISNULL(usuario_cobro, 'SISTEMA/AUTO') AS collector,  
            COUNT(*) AS total_payments,  
            SUM(valor_capital + valor_interes + valor_recargo) AS total_collected,  
            AVG(valor_capital + valor_interes + valor_recargo) AS avg_payment_amount,  
          
            -- Porcentaje de performance (reemplazo de OVER())  
            CASE  
                WHEN @Total_Global = 0 THEN 0  
                ELSE CAST(  
                    SUM(valor_capital + valor_interes + valor_recargo) * 100.0 / @Total_Global  
                    AS DECIMAL(10,2)  
                )  
            END AS performance_pct  
          
        FROM Datos_Ingreso_Convenio  
        WHERE estado_pago = 1  
          AND fecha_pago BETWEEN @Date_Start AND @Date_End  
        GROUP BY usuario_cobro  
        ORDER BY total_collected DESC;
      `;

      const rawData =
        await this.sqlServerService.query<CollectorPerformanceSqlResult>(query);
      return new SqlServerAgreementsAdapter().adaptCollectorPerformance(
        rawData,
      );
    } catch (error) {
      console.error('Error fetching collector performance:', error);
      throw error;
    }
  }

  async getPaymentMethodSummary(
    params: DateRangeParams,
  ): Promise<PaymentMethodSummary[]> {
    try {
      const query = `
        SET NOCOUNT ON;

        DECLARE @Date_Start DATETIME
        DECLARE @Date_End   DATETIME

        SET @Date_Start = CONVERT(DATETIME, '${params.startDate}', 120)
        SET @Date_End   = CONVERT(DATETIME, '${params.endDate}', 120)

        DECLARE @Total_Global DECIMAL(18,4)

        SELECT @Total_Global = SUM(valor_capital + valor_interes + valor_recargo)
        FROM Datos_Ingreso_Convenio
        WHERE estado_pago = 1
          AND fecha_pago BETWEEN @Date_Start AND @Date_End

        SELECT
            ISNULL(forma_de_pago, 'OTRO') AS payment_method,
            SUM(valor_capital + valor_interes + valor_recargo) AS method_total,
            COUNT(*) AS transaction_count,
            AVG(valor_capital + valor_interes + valor_recargo) AS avg_amount_per_transaction,

            CASE
                WHEN @Total_Global = 0 THEN 0
                ELSE CAST(SUM(valor_capital + valor_interes + valor_recargo) * 100.0 / @Total_Global AS DECIMAL(10,2))
            END AS contribution_pct

        FROM Datos_Ingreso_Convenio
        WHERE estado_pago = 1
          AND fecha_pago BETWEEN @Date_Start AND @Date_End
        GROUP BY forma_de_pago
        ORDER BY contribution_pct DESC;
      `;

      const rawData =
        await this.sqlServerService.query<PaymentMethodSummarySqlResult>(query);
      return new SqlServerAgreementsAdapter().adaptPaymentMethodSummary(
        rawData,
      );
    } catch (error) {
      console.error('Error fetching payment method summary:', error);
      throw error;
    }
  }

  async getCitizenSummary(params: DateRangeParams): Promise<CitizenSummary[]> {
    try {
      const query = `
        SET NOCOUNT ON;

        DECLARE @Date_Start DATETIME
        DECLARE @Date_End   DATETIME

        SET @Date_Start = CONVERT(DATETIME, '${params.startDate}', 120)
        SET @Date_End   = CONVERT(DATETIME, '${params.endDate}', 120)

        SELECT
            di.clave_catastral AS cadastral_key,
            c.CED_IDENT_CIUDADANO AS card_id,
            c.NOMBRES_CIUDADANO AS first_name,
            c.APELLIDOS_CIUDADANO AS last_name,

            COUNT(di.id) AS total_installments,
            COUNT(CASE WHEN di.estado_pago = 1 THEN 1 END) AS paid_installments,
            COUNT(CASE WHEN di.estado_pago = 0 THEN 1 END) AS pending_installments,

            SUM(di.valor_capital + di.valor_interes + di.valor_recargo) AS total_amount_value,
            SUM(CASE WHEN di.estado_pago = 1 THEN (di.valor_capital + di.valor_interes + di.valor_recargo) ELSE 0 END) AS collected_amount,
            SUM(CASE WHEN di.estado_pago = 0 THEN (di.valor_capital + di.valor_interes + di.valor_recargo) ELSE 0 END) AS pending_amount,

            CAST(
                COUNT(CASE WHEN di.estado_pago = 1 THEN 1 END) * 100.0 / 
                NULLIF(COUNT(*), 0) AS DECIMAL(10,2)
            ) AS collection_efficiency_pct,

            -- Formas de pago
            COUNT(CASE WHEN di.forma_de_pago = 'TransBanPI' THEN 1 END) AS transbanpi_count,
            COUNT(CASE WHEN di.forma_de_pago = 'Tarjeta' THEN 1 END) AS card_count,
            COUNT(CASE WHEN di.forma_de_pago = 'Transferencia' THEN 1 END) AS transfer_count,
            COUNT(CASE WHEN di.forma_de_pago = 'Cheque' THEN 1 END) AS check_count,
            COUNT(CASE WHEN di.forma_de_pago = 'Efectivo' THEN 1 END) AS cash_count,
            COUNT(CASE WHEN di.forma_de_pago = 'NotaDeCredito' THEN 1 END) AS credit_note_count

        FROM Datos_Ingreso_Convenio di
        INNER JOIN CIUDADANO c ON c.CED_IDENT_CIUDADANO = di.ciudadano_id
        WHERE di.fecha_emision BETWEEN @Date_Start AND @Date_End
        GROUP BY 
            c.CED_IDENT_CIUDADANO, 
            di.clave_catastral, 
            c.NOMBRES_CIUDADANO, 
            c.APELLIDOS_CIUDADANO
        ORDER BY total_amount_value DESC;
      `;

      const rawData =
        await this.sqlServerService.query<CitizenSummarySqlResult>(query);
      return new SqlServerAgreementsAdapter().adaptCitizenSummary(rawData);
    } catch (error) {
      console.error('Error fetching citizen summary:', error);
      throw error;
    }
  }
}
