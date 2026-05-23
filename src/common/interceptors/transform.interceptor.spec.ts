import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  const createContext = (statusCode: number): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({ statusCode }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('deve envelopar resposta com success, data e timestamp', async () => {
    const context = createContext(200);
    const next: CallHandler = { handle: () => of({ id: 'order-1' }) };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      success: true,
      data: { id: 'order-1' },
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });

  it('deve retornar undefined para status 204', async () => {
    const context = createContext(204);
    const next: CallHandler = { handle: () => of(undefined) };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).resolves.toBeUndefined();
  });

  it('deve retornar undefined quando data é null', async () => {
    const context = createContext(200);
    const next: CallHandler = { handle: () => of(null) };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).resolves.toBeUndefined();
  });
});
