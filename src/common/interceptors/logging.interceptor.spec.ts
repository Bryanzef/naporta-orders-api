import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('deve registrar requisição concluída com sucesso', async () => {
    const logSpy = jest
      .spyOn(interceptor['logger'], 'log')
      .mockImplementation();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/health' }),
      }),
    } as ExecutionContext;
    const next: CallHandler = { handle: () => of({ ok: true }) };

    await lastValueFrom(interceptor.intercept(context, next));

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/health - \d+ms$/),
    );
    logSpy.mockRestore();
  });
});
