export class ReadingNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReadingNotFoundException';
  }
}
