export class InterestExecutionException extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'InterestExecutionException';
  }
}
