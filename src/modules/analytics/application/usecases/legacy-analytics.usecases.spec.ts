import { Test, TestingModule } from '@nestjs/testing';
import { GetLegacyExecutiveDashboardAnalyticsUseCase } from './GetLegacyExecutiveDashboardAnalyticsUseCase';
import { GetLegacySectorPerformanceAnalyticsUseCase } from './GetLegacySectorPerformanceAnalyticsUseCase';
import { GetLegacyMonthlyTrendAnalyticsUseCase } from './GetLegacyMonthlyTrendAnalyticsUseCase';
import { GetLegacyNoveltyEconomicImpactAnalyticsUseCase } from './GetLegacyNoveltyEconomicImpactAnalyticsUseCase';
import { GetLegacyTopConsumersAnalyticsUseCase } from './GetLegacyTopConsumersAnalyticsUseCase';
import { GetLegacyInterannualComparisonAnalyticsUseCase } from './GetLegacyInterannualComparisonAnalyticsUseCase';
import { GetLegacyMonthlyConnectionGrowthAnalyticsUseCase } from './GetLegacyMonthlyConnectionGrowthAnalyticsUseCase';
import { GetLegacyAnnualTrendAnalyticsUseCase } from './GetLegacyAnnualTrendAnalyticsUseCase';

import { InterfaceLegacyAnalyticsRepository } from '../../domain/contracts/legacy-analytics.interface.repository';
import { LegacyExecutiveDashboardModel } from '../../domain/schemas/model/legacy-executive-dashboard.model';
import { LegacySectorPerformanceModel } from '../../domain/schemas/model/legacy-sector-performance.model';
import { LegacyMonthlyTrendModel } from '../../domain/schemas/model/legacy-monthly-trend.model';
import { LegacyNoveltyEconomicImpactModel } from '../../domain/schemas/model/legacy-novelty-economic-impact.model';
import { LegacyTopConsumerModel } from '../../domain/schemas/model/legacy-top-consumer.model';
import { LegacyInterannualComparisonModel } from '../../domain/schemas/model/legacy-interannual-comparison.model';
import { LegacyMonthlyConnectionGrowthModel } from '../../domain/schemas/model/legacy-monthly-connection-growth.model';
import { LegacyAnnualTrendModel } from '../../domain/schemas/model/legacy-annual-trend.model';
import { LegacyAnalyticsSQLAdapter } from '../../infrastructure/adapters/legacy-analytics-sql.adapter';

describe('Legacy Analytics UseCases (SQL Server 2000 & 2022)', () => {
  let executiveDashboardUseCase: GetLegacyExecutiveDashboardAnalyticsUseCase;
  let sectorPerformanceUseCase: GetLegacySectorPerformanceAnalyticsUseCase;
  let monthlyTrendUseCase: GetLegacyMonthlyTrendAnalyticsUseCase;
  let noveltyImpactUseCase: GetLegacyNoveltyEconomicImpactAnalyticsUseCase;
  let topConsumersUseCase: GetLegacyTopConsumersAnalyticsUseCase;
  let interannualComparisonUseCase: GetLegacyInterannualComparisonAnalyticsUseCase;
  let monthlyConnectionGrowthUseCase: GetLegacyMonthlyConnectionGrowthAnalyticsUseCase;
  let annualTrendUseCase: GetLegacyAnnualTrendAnalyticsUseCase;

  const mockExecutiveDashboardModel = new LegacyExecutiveDashboardModel(
    2026,
    'OCTUBRE',
    6001,
    31,
    5993,
    266091.0,
    44.34,
    0.0,
    99984.0,
    117917.66,
    47167.06,
    165084.71,
    27.51,
    0.4431,
    2019,
    33.64,
  );

  const mockSectorPerformanceModel = new LegacySectorPerformanceModel(
    22,
    482,
    24599.0,
    51.04,
    32333.79,
    12933.52,
    45267.31,
    27.42,
    9.24,
    1.3144,
    192,
    39.83,
    1,
    1,
  );

  const mockMonthlyTrendModel = new LegacyMonthlyTrendModel(
    2026,
    10,
    'OCTUBRE',
    15939,
    328479.0,
    17496.0,
    5.63,
    166862.77,
    66748.76,
    233611.53,
    33898.5,
    16.97,
  );

  const mockNoveltyImpactModel = new LegacyNoveltyEconomicImpactModel(
    'NORMAL',
    3975,
    66.24,
    72988.0,
    18.36,
    35545.27,
    14218.1,
    49763.37,
  );

  const mockTopConsumerModel = new LegacyTopConsumerModel(
    'L-EPAA-000002523590',
    24,
    152,
    '24-152',
    '9519259',
    '1 DE AGOSTO Y SIN NOMBRE',
    'JUAN MARCELO BRAVO LOMAS',
    0.0,
    99984.0,
    99984.0,
    0.0,
    0.0,
    0.0,
    'CONSUMO EXCESIVO',
    '2026-10-15T09:42:01.000Z',
    null,
    null,
  );

  const mockInterannualModel = new LegacyInterannualComparisonModel(
    1,
    308,
    2774,
    2774,
    0,
    52528.0,
    57866.0,
    5338.0,
    10.16,
    32354.98,
    37136.45,
    4781.48,
    14.78,
    'ESTABLE / CRECIMIENTO MODERADO',
  );

  const mockMonthlyGrowthModel = new LegacyMonthlyConnectionGrowthModel(
    1,
    'ENERO',
    15255,
    0,
    15703,
    0,
    448,
    2.94,
    'CERRADO / FACTURADO',
  );

  const mockAnnualTrendModel = new LegacyAnnualTrendModel(
    2026,
    188400,
    15703,
    3845000.0,
    244.86,
    125000.0,
    3.36,
    1950000.0,
    780000.0,
    2730000.0,
    95000.0,
    3.61,
    0.5072,
    2200000.0,
    150000.0,
    20000.0,
    35000.0,
    18000.0,
    2253000.0,
    12000.0,
    2400000.0,
    330000.0,
    210000.0,
    120000.0,
    15000.0,
    165000,
    23400,
    14000,
    87.91,
  );

  const mockRepository: InterfaceLegacyAnalyticsRepository = {
    getExecutiveDashboard: jest.fn().mockResolvedValue(mockExecutiveDashboardModel),
    getSectorPerformance: jest.fn().mockResolvedValue([mockSectorPerformanceModel]),
    getMonthlyTrend: jest.fn().mockResolvedValue([mockMonthlyTrendModel]),
    getNoveltyEconomicImpact: jest.fn().mockResolvedValue([mockNoveltyImpactModel]),
    getTopConsumers: jest.fn().mockResolvedValue([mockTopConsumerModel]),
    getInterannualComparison: jest.fn().mockResolvedValue([mockInterannualModel]),
    getMonthlyConnectionGrowth: jest.fn().mockResolvedValue([mockMonthlyGrowthModel]),
    getAnnualTrend: jest.fn().mockResolvedValue([mockAnnualTrendModel]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLegacyExecutiveDashboardAnalyticsUseCase,
        GetLegacySectorPerformanceAnalyticsUseCase,
        GetLegacyMonthlyTrendAnalyticsUseCase,
        GetLegacyNoveltyEconomicImpactAnalyticsUseCase,
        GetLegacyTopConsumersAnalyticsUseCase,
        GetLegacyInterannualComparisonAnalyticsUseCase,
        GetLegacyMonthlyConnectionGrowthAnalyticsUseCase,
        GetLegacyAnnualTrendAnalyticsUseCase,
        {
          provide: 'LegacyAnalyticsRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    executiveDashboardUseCase = module.get<GetLegacyExecutiveDashboardAnalyticsUseCase>(
      GetLegacyExecutiveDashboardAnalyticsUseCase,
    );
    sectorPerformanceUseCase = module.get<GetLegacySectorPerformanceAnalyticsUseCase>(
      GetLegacySectorPerformanceAnalyticsUseCase,
    );
    monthlyTrendUseCase = module.get<GetLegacyMonthlyTrendAnalyticsUseCase>(
      GetLegacyMonthlyTrendAnalyticsUseCase,
    );
    noveltyImpactUseCase = module.get<GetLegacyNoveltyEconomicImpactAnalyticsUseCase>(
      GetLegacyNoveltyEconomicImpactAnalyticsUseCase,
    );
    topConsumersUseCase = module.get<GetLegacyTopConsumersAnalyticsUseCase>(
      GetLegacyTopConsumersAnalyticsUseCase,
    );
    interannualComparisonUseCase = module.get<GetLegacyInterannualComparisonAnalyticsUseCase>(
      GetLegacyInterannualComparisonAnalyticsUseCase,
    );
    monthlyConnectionGrowthUseCase = module.get<GetLegacyMonthlyConnectionGrowthAnalyticsUseCase>(
      GetLegacyMonthlyConnectionGrowthAnalyticsUseCase,
    );
    annualTrendUseCase = module.get<GetLegacyAnnualTrendAnalyticsUseCase>(
      GetLegacyAnnualTrendAnalyticsUseCase,
    );
  });

  it('should return executive dashboard response for legacy system', async () => {
    const result = await executiveDashboardUseCase.execute({
      year: 2026,
      month: 10,
    });
    expect(result.year).toBe(2026);
    expect(result.month).toBe('OCTUBRE');
    expect(result.totalReadingsTaken).toBe(6001);
    expect(result.totalBilledUsd).toBe(165084.71);
  });

  it('should return sector performance response list', async () => {
    const result = await sectorPerformanceUseCase.execute({
      year: 2026,
      month: 'OCTUBRE',
    });
    expect(result).toHaveLength(1);
    expect(result[0].sector).toBe(22);
    expect(result[0].consumedVolumeM3).toBe(24599.0);
  });

  it('should return monthly trend response list', async () => {
    const result = await monthlyTrendUseCase.execute({ year: 2026 });
    expect(result).toHaveLength(1);
    expect(result[0].monthName).toBe('OCTUBRE');
    expect(result[0].deltaVolumeM3).toBe(17496.0);
  });

  it('should return novelty economic impact response list', async () => {
    const result = await noveltyImpactUseCase.execute({
      year: 2026,
      month: 10,
    });
    expect(result).toHaveLength(1);
    expect(result[0].novelty).toBe('NORMAL');
    expect(result[0].casesCount).toBe(3975);
  });

  it('should return top consumers response list', async () => {
    const result = await topConsumersUseCase.execute({
      year: 2026,
      month: 10,
      limit: 10,
    });
    expect(result).toHaveLength(1);
    expect(result[0].readingId).toBe('L-EPAA-000002523590');
    expect(result[0].consumedVolumeM3).toBe(99984.0);
  });

  it('should return interannual comparison response list with zero delta readings for homologous pairs', async () => {
    const result = await interannualComparisonUseCase.execute({
      baseYear: 2025,
      targetYear: 2026,
      startMonthNumber: 1,
      endMonthNumber: 9,
    });
    expect(result).toHaveLength(1);
    expect(result[0].sector).toBe(1);
    expect(result[0].readingsBaseYear).toBe(2774);
    expect(result[0].readingsTargetYear).toBe(2774);
    expect(result[0].deltaReadings).toBe(0);
    expect(result[0].managementDiagnostic).toBe('ESTABLE / CRECIMIENTO MODERADO');
  });

  it('GetLegacyMonthlyConnectionGrowthAnalyticsUseCase should return mapped connection growth comparison list', async () => {
    const result = await monthlyConnectionGrowthUseCase.execute({
      baseYear: 2025,
      targetYear: 2026,
    });

    expect(mockRepository.getMonthlyConnectionGrowth).toHaveBeenCalledWith({
      baseYear: 2025,
      targetYear: 2026,
    });
    expect(result).toHaveLength(1);
    expect(result[0].monthName).toBe('ENERO');
    expect(result[0].connectionsBaseYear).toBe(15255);
    expect(result[0].connectionsTargetYear).toBe(15703);
    expect(result[0].differenceTargetVsBase).toBe(448);
    expect(result[0].statusTargetYear).toBe('CERRADO / FACTURADO');
  });

  it('GetLegacyAnnualTrendAnalyticsUseCase should return mapped multiannual trend list', async () => {
    const result = await annualTrendUseCase.execute({
      endYear: 2026,
      limitYears: 5,
    });

    expect(mockRepository.getAnnualTrend).toHaveBeenCalledWith({
      endYear: 2026,
      limitYears: 5,
      sector: undefined,
      startYear: undefined,
    });
    expect(result).toHaveLength(1);
    expect(result[0].year).toBe(2026);
    expect(result[0].totalReadings).toBe(188400);
    expect(result[0].totalActiveConnections).toBe(15703);
    expect(result[0].totalVolumeM3).toBe(3845000.0);
    expect(result[0].deltaVolumeM3).toBe(125000.0);
    expect(result[0].growthVolumePercentage).toBe(3.36);
    expect(result[0].waterBilledUsd).toBe(1950000.0);
    expect(result[0].sewerBilledUsd).toBe(780000.0);
    expect(result[0].totalBilledUsd).toBe(2730000.0);
    expect(result[0].deltaRevenueUsd).toBe(95000.0);
    expect(result[0].growthRevenuePercentage).toBe(3.61);
    expect(result[0].collectionEfficiencyPercentage).toBe(87.91);
  });

  it('should map SQL results correctly via LegacyAnalyticsSQLAdapter without context binding issues', () => {
    const mockSqlResult = {
      Sector: 1,
      Acometidas_Homologas: 2819,
      Lecturas_2025: 2772,
      Lecturas_2026: 2819,
      Delta_Lecturas: 47,
      M3_2025: 52482,
      M3_2026: 57976,
      Delta_M3: 5494,
      Pct_Var_M3: 10.47,
      Facturado_2025_USD: 32342.48,
      Facturado_2026_USD: 37376.90,
      Delta_USD: 5034.43,
      Pct_Var_USD: 15.57,
      Diagnostico_Gestion: 'ALTA RECUPERACIÓN (>+15%)',
    };

    const directResult = LegacyAnalyticsSQLAdapter.toInterannualComparisonModel(mockSqlResult);
    expect(directResult.sector).toBe(1);
    expect(directResult.deltaVolumeM3).toBe(5494);

    const mapResult = [mockSqlResult].map(LegacyAnalyticsSQLAdapter.toInterannualComparisonModel);
    expect(mapResult).toHaveLength(1);
    expect(mapResult[0].sector).toBe(1);
    expect(mapResult[0].billedTargetYearUsd).toBe(37376.90);
  });
});
