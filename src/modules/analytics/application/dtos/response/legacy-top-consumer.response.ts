export class LegacyTopConsumerResponse {
  readingId!: string;
  sector!: number;
  account!: number;
  cadastralKey!: string;
  meterNumber!: string;
  address!: string;
  clientName!: string;
  previousReading!: number;
  currentReading!: number;
  consumedVolumeM3!: number;
  waterBilledUsd!: number;
  sewerBilledUsd!: number;
  totalBilledUsd!: number;
  novelty!: string;
  readingDate!: string;
  latitude!: number | null;
  longitude!: number | null;
}
