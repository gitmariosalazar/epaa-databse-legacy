export interface ReadingSQLResult {
  sector: number
  account: number
  year: number
  month: string
  previousReading: number
  currentReading: number
  rentalIncomeCode: number | null
  novelty: string | null
  readingValue: number | null
  sewerRate: number | null
  reconnection: number | null
  incomeCode: number | null
  readingDate: Date
  readingTime: string
  cadastralKey: string
}