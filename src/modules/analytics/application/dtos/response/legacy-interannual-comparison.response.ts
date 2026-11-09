export class LegacyInterannualComparisonResponse {
  sector!: number;
  homologousAccountsCount!: number;
  readingsBaseYear!: number;
  readingsTargetYear!: number;
  deltaReadings!: number;
  volumeBaseYearM3!: number;
  volumeTargetYearM3!: number;
  deltaVolumeM3!: number;
  varianceVolumePercentage!: number;
  billedBaseYearUsd!: number;
  billedTargetYearUsd!: number;
  deltaBilledUsd!: number;
  varianceBilledPercentage!: number;
  managementDiagnostic!: string;
}
