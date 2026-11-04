export interface IInterestRepository {
  executeDailyInterestUpdate(): Promise<void>;
}
