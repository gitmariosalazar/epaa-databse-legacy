import { LegacyExecutiveDashboardModel } from '../../domain/schemas/model/legacy-executive-dashboard.model';
import { LegacySectorPerformanceModel } from '../../domain/schemas/model/legacy-sector-performance.model';
import { LegacyMonthlyTrendModel } from '../../domain/schemas/model/legacy-monthly-trend.model';
import { LegacyNoveltyEconomicImpactModel } from '../../domain/schemas/model/legacy-novelty-economic-impact.model';
import { LegacyTopConsumerModel } from '../../domain/schemas/model/legacy-top-consumer.model';
import { LegacyInterannualComparisonModel } from '../../domain/schemas/model/legacy-interannual-comparison.model';
import { LegacyMonthlyConnectionGrowthModel } from '../../domain/schemas/model/legacy-monthly-connection-growth.model';

import { LegacyExecutiveDashboardResponse } from '../dtos/response/legacy-executive-dashboard.response';
import { LegacySectorPerformanceResponse } from '../dtos/response/legacy-sector-performance.response';
import { LegacyMonthlyTrendResponse } from '../dtos/response/legacy-monthly-trend.response';
import { LegacyNoveltyEconomicImpactResponse } from '../dtos/response/legacy-novelty-impact.response';
import { LegacyTopConsumerResponse } from '../dtos/response/legacy-top-consumer.response';
import { LegacyInterannualComparisonResponse } from '../dtos/response/legacy-interannual-comparison.response';
import { LegacyMonthlyConnectionGrowthResponse } from '../dtos/response/legacy-monthly-connection-growth.response';

export class LegacyAnalyticsMapper {
  static toExecutiveDashboardResponse(
    model: LegacyExecutiveDashboardModel,
  ): LegacyExecutiveDashboardResponse {
    return {
      year: model.year,
      month: model.month,
      totalReadingsTaken: model.totalReadingsTaken,
      totalSectorsCovered: model.totalSectorsCovered,
      totalActiveConnections: model.totalActiveConnections,
      totalVolumeM3: model.totalVolumeM3,
      averageConsumptionPerAccountM3: model.averageConsumptionPerAccountM3,
      minConsumptionM3: model.minConsumptionM3,
      maxConsumptionM3: model.maxConsumptionM3,
      waterBilledUsd: model.waterBilledUsd,
      sewerBilledUsd: model.sewerBilledUsd,
      totalBilledUsd: model.totalBilledUsd,
      averageTicketPerAccountUsd: model.averageTicketPerAccountUsd,
      weightedAverageEffectiveTariffUsdPerM3: model.weightedAverageEffectiveTariffUsdPerM3,
      totalReadingsWithNovelty: model.totalReadingsWithNovelty,
      operativeNoveltyPercentage: model.operativeNoveltyPercentage,
      totalTitleUsd: model.totalTitleUsd,
      totalTrashTaxUsd: model.totalTrashTaxUsd,
      totalThirdPartiesUsd: model.totalThirdPartiesUsd,
      totalInterestUsd: model.totalInterestUsd,
      totalSurchargesUsd: model.totalSurchargesUsd,
      totalBilledEpaaUsd: model.totalBilledEpaaUsd,
      totalInterestImprovementsUsd: model.totalInterestImprovementsUsd,
      totalPaidWaterUsd: model.totalPaidWaterUsd,
      totalUnpaidWaterUsd: model.totalUnpaidWaterUsd,
      totalBillsGenerated: model.totalBillsGenerated,
      paidBillsCount: model.paidBillsCount,
      unpaidBillsCount: model.unpaidBillsCount,
      overdueBillsCount: model.overdueBillsCount,
      upcomingBillsCount: model.upcomingBillsCount,
      canceledBillsCount: model.canceledBillsCount,
      totalGeneralEmissionUsd: model.totalGeneralEmissionUsd,
      totalCollectedUsd: model.totalCollectedUsd,
      totalPendingDebtUsd: model.totalPendingDebtUsd,
      totalOverdueDebtUsd: model.totalOverdueDebtUsd,
      totalUpcomingDebtUsd: model.totalUpcomingDebtUsd,
      totalCanceledUsd: model.totalCanceledUsd,
    };
  }

  static toSectorPerformanceResponseList(
    models: LegacySectorPerformanceModel[],
  ): LegacySectorPerformanceResponse[] {
    return models.map((model) => ({
      sector: model.sector,
      totalReadings: model.totalReadings,
      consumedVolumeM3: model.consumedVolumeM3,
      averageConsumptionM3: model.averageConsumptionM3,
      waterBilledUsd: model.waterBilledUsd,
      sewerBilledUsd: model.sewerBilledUsd,
      totalBilledUsd: model.totalBilledUsd,
      revenueSharePercentage: model.revenueSharePercentage,
      volumeSharePercentage: model.volumeSharePercentage,
      averageTariffUsdPerM3: model.averageTariffUsdPerM3,
      noveltiesCount: model.noveltiesCount,
      noveltyPercentage: model.noveltyPercentage,
      revenueRank: model.revenueRank,
      volumeRank: model.volumeRank,
      totalTitleUsd: model.totalTitleUsd,
      totalTrashTaxUsd: model.totalTrashTaxUsd,
      totalThirdPartiesUsd: model.totalThirdPartiesUsd,
      totalInterestUsd: model.totalInterestUsd,
      totalSurchargesUsd: model.totalSurchargesUsd,
      totalBilledEpaaUsd: model.totalBilledEpaaUsd,
      totalInterestImprovementsUsd: model.totalInterestImprovementsUsd,
      totalCollectedUsd: model.totalCollectedUsd,
      totalPendingDebtUsd: model.totalPendingDebtUsd,
      totalOverdueDebtUsd: model.totalOverdueDebtUsd,
      totalUpcomingDebtUsd: model.totalUpcomingDebtUsd,
      totalCanceledUsd: model.totalCanceledUsd,
      paidBillsCount: model.paidBillsCount,
      unpaidBillsCount: model.unpaidBillsCount,
      overdueBillsCount: model.overdueBillsCount,
    }));
  }

  static toMonthlyTrendResponseList(
    models: LegacyMonthlyTrendModel[],
  ): LegacyMonthlyTrendResponse[] {
    return models.map((model) => ({
      year: model.year,
      monthNumber: model.monthNumber,
      monthName: model.monthName,
      totalReadings: model.totalReadings,
      totalVolumeM3: model.totalVolumeM3,
      deltaVolumeM3: model.deltaVolumeM3,
      growthVolumePercentage: model.growthVolumePercentage,
      waterBilledUsd: model.waterBilledUsd,
      sewerBilledUsd: model.sewerBilledUsd,
      totalBilledUsd: model.totalBilledUsd,
      deltaRevenueUsd: model.deltaRevenueUsd,
      growthRevenuePercentage: model.growthRevenuePercentage,
      totalTitleUsd: model.totalTitleUsd,
      totalTrashTaxUsd: model.totalTrashTaxUsd,
      totalThirdPartiesUsd: model.totalThirdPartiesUsd,
      totalInterestUsd: model.totalInterestUsd,
      totalSurchargesUsd: model.totalSurchargesUsd,
      totalBilledEpaaUsd: model.totalBilledEpaaUsd,
      totalInterestImprovementsUsd: model.totalInterestImprovementsUsd,
      totalCollectedUsd: model.totalCollectedUsd,
      totalPendingDebtUsd: model.totalPendingDebtUsd,
      totalOverdueDebtUsd: model.totalOverdueDebtUsd,
      totalUpcomingDebtUsd: model.totalUpcomingDebtUsd,
      totalCanceledUsd: model.totalCanceledUsd,
      paidBillsCount: model.paidBillsCount,
      unpaidBillsCount: model.unpaidBillsCount,
      overdueBillsCount: model.overdueBillsCount,
    }));
  }

  static toNoveltyEconomicImpactResponseList(
    models: LegacyNoveltyEconomicImpactModel[],
  ): LegacyNoveltyEconomicImpactResponse[] {
    return models.map((model) => ({
      novelty: model.novelty,
      casesCount: model.casesCount,
      shareOfTotalReadingsPercentage: model.shareOfTotalReadingsPercentage,
      totalVolumeM3: model.totalVolumeM3,
      averageVolumePerCaseM3: model.averageVolumePerCaseM3,
      waterBilledUsd: model.waterBilledUsd,
      sewerBilledUsd: model.sewerBilledUsd,
      totalBilledUsd: model.totalBilledUsd,
      totalTitleUsd: model.totalTitleUsd,
      totalTrashTaxUsd: model.totalTrashTaxUsd,
      totalThirdPartiesUsd: model.totalThirdPartiesUsd,
      totalInterestUsd: model.totalInterestUsd,
      totalSurchargesUsd: model.totalSurchargesUsd,
      totalBilledEpaaUsd: model.totalBilledEpaaUsd,
      totalInterestImprovementsUsd: model.totalInterestImprovementsUsd,
      totalCollectedUsd: model.totalCollectedUsd,
      totalPendingDebtUsd: model.totalPendingDebtUsd,
      totalOverdueDebtUsd: model.totalOverdueDebtUsd,
      paidCasesCount: model.paidCasesCount,
      unpaidCasesCount: model.unpaidCasesCount,
    }));
  }

  static toTopConsumerResponseList(
    models: LegacyTopConsumerModel[],
  ): LegacyTopConsumerResponse[] {
    return models.map((model) => ({
      readingId: model.readingId,
      sector: model.sector,
      account: model.account,
      cadastralKey: model.cadastralKey,
      meterNumber: model.meterNumber,
      address: model.address,
      clientName: model.clientName,
      previousReading: model.previousReading,
      currentReading: model.currentReading,
      consumedVolumeM3: model.consumedVolumeM3,
      waterBilledUsd: model.waterBilledUsd,
      sewerBilledUsd: model.sewerBilledUsd,
      totalBilledUsd: model.totalBilledUsd,
      novelty: model.novelty,
      readingDate: model.readingDate,
      latitude: model.latitude,
      longitude: model.longitude,
      titleBilledUsd: model.titleBilledUsd,
      trashTaxBilledUsd: model.trashTaxBilledUsd,
      thirdPartiesBilledUsd: model.thirdPartiesBilledUsd,
      interestBilledUsd: model.interestBilledUsd,
      surchargesBilledUsd: model.surchargesBilledUsd,
      totalBilledEpaaUsd: model.totalBilledEpaaUsd,
      paymentDate: model.paymentDate,
      expirationDate: model.expirationDate,
      paymentStatus: model.paymentStatus,
      interestImprovementsUsd: model.interestImprovementsUsd,
      totalPaidAmountUsd: model.totalPaidAmountUsd,
      totalPendingAmountUsd: model.totalPendingAmountUsd,
    }));
  }

  static toInterannualComparisonResponseList(
    models: LegacyInterannualComparisonModel[],
  ): LegacyInterannualComparisonResponse[] {
    return models.map((model) => ({
      sector: model.sector,
      homologousAccountsCount: model.homologousAccountsCount,
      readingsBaseYear: model.readingsBaseYear,
      readingsTargetYear: model.readingsTargetYear,
      deltaReadings: model.deltaReadings,
      volumeBaseYearM3: model.volumeBaseYearM3,
      volumeTargetYearM3: model.volumeTargetYearM3,
      deltaVolumeM3: model.deltaVolumeM3,
      varianceVolumePercentage: model.varianceVolumePercentage,
      billedBaseYearUsd: model.billedBaseYearUsd,
      billedTargetYearUsd: model.billedTargetYearUsd,
      deltaBilledUsd: model.deltaBilledUsd,
      varianceBilledPercentage: model.varianceBilledPercentage,
      managementDiagnostic: model.managementDiagnostic,
      titleBaseYearUsd: model.titleBaseYearUsd,
      titleTargetYearUsd: model.titleTargetYearUsd,
      interestBaseYearUsd: model.interestBaseYearUsd,
      interestTargetYearUsd: model.interestTargetYearUsd,
      surchargesBaseYearUsd: model.surchargesBaseYearUsd,
      surchargesTargetYearUsd: model.surchargesTargetYearUsd,
      collectedBaseYearUsd: model.collectedBaseYearUsd,
      collectedTargetYearUsd: model.collectedTargetYearUsd,
      deltaCollectedUsd: model.deltaCollectedUsd,
      pendingBaseYearUsd: model.pendingBaseYearUsd,
      pendingTargetYearUsd: model.pendingTargetYearUsd,
      deltaPendingUsd: model.deltaPendingUsd,
      overdueBaseYearUsd: model.overdueBaseYearUsd,
      overdueTargetYearUsd: model.overdueTargetYearUsd,
      interestImprovementsBaseYearUsd: model.interestImprovementsBaseYearUsd,
      interestImprovementsTargetYearUsd: model.interestImprovementsTargetYearUsd,
    }));
  }

  static toMonthlyConnectionGrowthResponseList(
    models: LegacyMonthlyConnectionGrowthModel[],
  ): LegacyMonthlyConnectionGrowthResponse[] {
    return models.map((model) => ({
      monthNumber: model.monthNumber,
      monthName: model.monthName,
      connectionsBaseYear: model.connectionsBaseYear,
      increaseBaseYear: model.increaseBaseYear,
      connectionsTargetYear: model.connectionsTargetYear,
      increaseTargetYear: model.increaseTargetYear,
      differenceTargetVsBase: model.differenceTargetVsBase,
      growthPercentage: model.growthPercentage,
      statusTargetYear: model.statusTargetYear,
    }));
  }
}
