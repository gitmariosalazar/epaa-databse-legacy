export class LegacyMonthlyConnectionGrowthResponse {
  monthNumber!: number;
  monthName!: string;
  connectionsBaseYear!: number;
  increaseBaseYear!: number;
  connectionsTargetYear!: number;
  increaseTargetYear!: number;
  differenceTargetVsBase!: number;
  growthPercentage!: number;
  statusTargetYear!: string;
}
