import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(() => {
    guard = new JwtAuthGuard(reflector as unknown as Reflector);
    jest.clearAllMocks();
  });

  it('deve permitir rotas públicas sem autenticação', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const handler = jest.fn();
    const controllerClass = jest.fn();
    const context = {
      getHandler: () => handler,
      getClass: () => controllerClass,
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      handler,
      controllerClass,
    ]);
  });

  it('deve delegar rotas protegidas ao AuthGuard', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const parentCanActivate = jest
      .spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      )
      .mockReturnValue(true);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(parentCanActivate).toHaveBeenCalledWith(context);

    parentCanActivate.mockRestore();
  });
});
