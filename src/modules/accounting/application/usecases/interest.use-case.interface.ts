import { InterestExecutionResult } from '../../domain/schemas/model/interest-execution-result.model';

export interface IUpdateDailyInterestsUseCase {
  execute(): Promise<InterestExecutionResult>;
}
