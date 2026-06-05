export class SascarConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarConnectionError';
  }
}

export class SascarRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarRateLimitError';
  }
}

export class SascarApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SascarApiError';
  }
}
