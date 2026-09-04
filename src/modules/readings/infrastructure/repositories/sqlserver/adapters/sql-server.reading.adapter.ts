import {
  DashboardKpiResponse,
  ReadingResponse,
} from '../../../../domain/schemas/dto/response/readings.response';
import {
  DashboardKpiSqlResult,
  ReadingSQLResult,
} from '../../../interfaces/reading.sql.response';

export class SQLServerReadingAdapter {
  static toDomain(data: ReadingSQLResult): ReadingResponse {
    return {
      sector: data.sector,
      account: data.account,
      year: data.year,
      month: data.month,
      previousReading: data.previousReading,
      currentReading: data.currentReading,
      rentalIncomeCode: data.rentalIncomeCode,
      novelty: data.novelty,
      readingValue: data.readingValue,
      sewerRate: data.sewerRate,
      reconnection: data.reconnection,
      incomeCode: data.incomeCode,
      readingDate: data.readingDate,
      readingTime: data.readingTime,
      cadastralKey: data.cadastralKey,
      readingId: data.readingId != null ? String(data.readingId) : '',
    };
  }

  static toDomain2000(data: ReadingSQLResult): ReadingResponse {
    return {
      sector: Number(data.sector),
      account: Number(data.account),
      year: Number(data.year),
      month: String(data.month).trim(),
      previousReading:
        data.previousReading != null ? Number(data.previousReading) : 0,
      currentReading:
        data.currentReading != null ? Number(data.currentReading) : null,
      rentalIncomeCode:
        data.rentalIncomeCode != null ? Number(data.rentalIncomeCode) : null,
      novelty: data.novelty ? String(data.novelty).trim() : null,
      readingValue:
        data.readingValue != null ? Number(data.readingValue) : null,
      sewerRate: data.sewerRate != null ? Number(data.sewerRate) : null,
      reconnection:
        data.reconnection != null ? Number(data.reconnection) : null,
      incomeCode: Number(data.incomeCode),
      readingDate: data.readingDate || null,
      readingTime: data.readingTime ? String(data.readingTime).trim() : null,
      cadastralKey: data.cadastralKey ? String(data.cadastralKey).trim() : '',
      readingId: data.readingId != null ? String(data.readingId) : '',
    };
  }

  static toDomainArray(
    dataArray: DashboardKpiSqlResult[],
  ): DashboardKpiResponse[] {
    const sanitize = (val: any) => (typeof val === 'bigint' ? Number(val) : val);

    return dataArray.map((data) => ({
      year: sanitize(data.year),
      month: data.month,
      sector: sanitize(data.sector),
      totalMetersRead: sanitize(data.total_meters_read),
      totalConsumptionM3: sanitize(data.total_consumption_m3),
      averageConsumptionM3: sanitize(data.average_consumption_m3),
      consumptionValue: sanitize(data.consumption_value),
      totalSewageValue: sanitize(data.total_sewage_value),
      totalBilledWater: sanitize(data.total_billed_water),
      totalPaidWater: sanitize(data.total_paid_water),
      totalUnpaidWater: sanitize(data.total_unpaid_water),
      totalTrashRate: sanitize(data.total_trash_rate),
      totalOldImprovementsInterest: sanitize(data.total_old_improvements_interest),
      totalSurcharge: sanitize(data.total_surcharge),
      totalBillsGenerated: sanitize(data.total_bills_generated),
      totalInterestCalculated: sanitize(data.total_interest_calculated),
      unpaidBillsCount: sanitize(data.unpaid_bills_count),
      paidBillsCount: sanitize(data.paid_bills_count),
      totalDebtAmount: sanitize(data.total_debt_amount),
    }));
  }
}
