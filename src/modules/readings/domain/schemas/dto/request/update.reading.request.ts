export class UpdateReadingRequest {
  sector: number
  account: number
  year: number
  month: number
  previousReading: number
  currentReading: number
  rentalIncomeCode: number | null
  novelty: string | null
  readingValue: number | null
  sewerRate: number | null
  reconnection: number | null
  //incomeCode: number | null
  readingDate: Date
  readingTime: string
  cadastralKey: string
}