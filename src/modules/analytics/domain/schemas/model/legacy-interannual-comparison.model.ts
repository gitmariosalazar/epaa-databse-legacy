export class LegacyInterannualComparisonModel {
  constructor(
    public readonly sector: number,
    public readonly homologousAccountsCount: number,
    public readonly readingsBaseYear: number,
    public readonly readingsTargetYear: number,
    public readonly deltaReadings: number,
    public readonly volumeBaseYearM3: number,
    public readonly volumeTargetYearM3: number,
    public readonly deltaVolumeM3: number,
    public readonly varianceVolumePercentage: number,
    public readonly billedBaseYearUsd: number,
    public readonly billedTargetYearUsd: number,
    public readonly deltaBilledUsd: number,
    public readonly varianceBilledPercentage: number,
    public readonly managementDiagnostic: string,
    public readonly titleBaseYearUsd?: number,
    public readonly titleTargetYearUsd?: number,
    public readonly interestBaseYearUsd?: number,
    public readonly interestTargetYearUsd?: number,
    public readonly surchargesBaseYearUsd?: number,
    public readonly surchargesTargetYearUsd?: number,
  ) {}
}
