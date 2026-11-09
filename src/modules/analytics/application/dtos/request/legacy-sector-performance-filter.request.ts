export class LegacySectorPerformanceFilterRequest {
  year?: number;
  month?: number | string;
  sector?: number;
  sortBy?: 'revenue' | 'volume' | 'readings' | 'sector';
}
