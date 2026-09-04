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
    return dataArray.map((data) => ({
      year: data.year,
      month: data.month,
      sector: data.sector,
      totalMetersRead: data.total_meters_read,
      totalConsumptionM3: data.total_consumption_m3,
      averageConsumptionM3: data.average_consumption_m3,
      consumptionValue: data.consumption_value,
      totalSewageValue: data.total_sewage_value,
      totalBilledWater: data.total_billed_water,
      totalPaidWater: data.total_paid_water,
      totalUnpaidWater: data.total_unpaid_water,
      totalTrashRate: data.total_trash_rate,
      totalOldImprovementsInterest: data.total_old_improvements_interest,
      totalSurcharge: data.total_surcharge,
      totalBillsGenerated: data.total_bills_generated,
      totalInterestCalculated: data.total_interest_calculated,
      unpaidBillsCount: data.unpaid_bills_count,
      paidBillsCount: data.paid_bills_count,
      totalDebtAmount: data.total_debt_amount,
    }));
  }
}
