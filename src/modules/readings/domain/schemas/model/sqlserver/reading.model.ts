export class ReadingModel {
  private sector: number
  private account: number
  private year: number
  private month: string
  private previousReading: number
  private currentReading: number
  private rentalIncomeCode: number | null
  private novelty: string | null
  private readingValue: number | null
  private sewerRate: number | null
  private reconnection: number | null
  //private incomeCode: number | null
  private readingDate: Date
  private readingTime: string
  private cadastralKey: string

  constructor(
    sector: number,
    account: number,
    year: number,
    month: string,
    previousReading: number,
    currentReading: number,
    rentalIncomeCode: number | null,
    novelty: string | null,
    readingValue: number | null,
    sewerRate: number | null,
    reconnection: number | null,
    //incomeCode: number | null,
    readingDate: Date,
    readingTime: string,
    cadastralKey: string
  ) {
    this.sector = sector
    this.account = account
    this.year = year
    this.month = month
    this.previousReading = previousReading
    this.currentReading = currentReading
    this.rentalIncomeCode = rentalIncomeCode
    this.novelty = novelty
    this.readingValue = readingValue
    this.sewerRate = sewerRate
    this.reconnection = reconnection
    //this.incomeCode = incomeCode
    this.readingDate = readingDate
    this.readingTime = readingTime
    this.cadastralKey = cadastralKey
  }

  getSector(): number {
    return this.sector
  }

  getAccount(): number {
    return this.account
  }

  getYear(): number {
    return this.year
  }

  getMonth(): string {
    return this.month
  }

  getPreviousReading(): number {
    return this.previousReading
  }

  getCurrentReading(): number {
    return this.currentReading
  }

  getRentalIncomeCode(): number | null {
    return this.rentalIncomeCode
  }

  getNovelty(): string | null {
    return this.novelty
  }

  getReadingValue(): number | null {
    return this.readingValue
  }

  getSewerRate(): number | null {
    return this.sewerRate
  }

  getReconnection(): number | null {
    return this.reconnection
  }

  /*
  getIncomeCode(): number | null {
    return this.incomeCode
  }
  */

  getReadingDate(): Date {
    return this.readingDate
  }

  getReadingTime(): string {
    return this.readingTime
  }

  getCadastralKey(): string {
    return this.cadastralKey
  }

  setReadingValue(readingValue: number | null): void {
    this.readingValue = readingValue
  }

  setSewerRate(sewerRate: number | null): void {
    this.sewerRate = sewerRate
  }

  setReconnection(reconnection: number | null): void {
    this.reconnection = reconnection
  }

  /*
  setIncomeCode(incomeCode: number | null): void {
    this.incomeCode = incomeCode
  }
  */

  setNovelty(novelty: string | null): void {
    this.novelty = novelty
  }
  setCurrentReading(currentReading: number): void {
    this.currentReading = currentReading
  }

  setPreviousReading(previousReading: number): void {
    this.previousReading = previousReading
  }

  setRentalIncomeCode(rentalIncomeCode: number | null): void {
    this.rentalIncomeCode = rentalIncomeCode
  }

  setReadingDate(readingDate: Date): void {
    this.readingDate = readingDate
  }

  setReadingTime(readingTime: string): void {
    this.readingTime = readingTime
  }

  setCadastralKey(cadastralKey: string): void {
    this.cadastralKey = cadastralKey
  }

  setMonth(month: string): void {
    this.month = month
  }

  toJSON() {
    return {
      sector: this.sector,
      account: this.account,
      year: this.year,
      month: this.month,
      previousReading: this.previousReading,
      currentReading: this.currentReading,
      rentalIncomeCode: this.rentalIncomeCode,
      novelty: this.novelty,
      readingValue: this.readingValue,
      sewerRate: this.sewerRate,
      reconnection: this.reconnection,
      //incomeCode: this.incomeCode,
      readingDate: this.readingDate,
      readingTime: this.readingTime,
      cadastralKey: this.cadastralKey
    }
  }
}