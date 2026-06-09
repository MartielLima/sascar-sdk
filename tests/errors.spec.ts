import {
  SascarApiError,
  SascarAuthError,
  SascarConnectionError,
  SascarRateLimitError,
  SascarTimeoutError
} from '../src/errors';

describe('Error classes', () => {
  it('SascarTimeoutError herda de SascarConnectionError e expõe timeoutMs', () => {
    const err = new SascarTimeoutError('timeout reached', 5000);
    expect(err).toBeInstanceOf(SascarTimeoutError);
    expect(err).toBeInstanceOf(SascarConnectionError);
    expect(err.name).toBe('SascarTimeoutError');
    expect(err.timeoutMs).toBe(5000);
  });

  it('SascarAuthError herda de SascarApiError e expõe statusCode', () => {
    const err = new SascarAuthError('unauthorized', 401);
    expect(err).toBeInstanceOf(SascarAuthError);
    expect(err).toBeInstanceOf(SascarApiError);
    expect(err.name).toBe('SascarAuthError');
    expect(err.statusCode).toBe(401);
  });

  it('SascarRateLimitError herda de Error e tem name correto', () => {
    const err = new SascarRateLimitError('rate limit');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SascarRateLimitError');
  });
});
