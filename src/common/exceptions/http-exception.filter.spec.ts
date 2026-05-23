import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let json: jest.Mock;
  let status: jest.Mock;

  const createHost = (request: {
    url: string;
    method: string;
  }): ArgumentsHost => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });

    return {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
  };

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('deve formatar HttpException com payload objeto', () => {
    const host = createHost({ url: '/orders', method: 'GET' });
    const exception = new NotFoundException('Pedido não encontrado');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        path: '/orders',
        method: 'GET',
        message: 'Pedido não encontrado',
        error: 'Not Found',
      }),
    );
  });

  it('deve formatar HttpException com payload string', () => {
    const host = createHost({ url: '/auth', method: 'POST' });
    const exception = new HttpException('Credenciais inválidas', 401);

    filter.catch(exception, host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Credenciais inválidas',
      }),
    );
  });

  it('deve tratar erros genéricos como 500', () => {
    const host = createHost({ url: '/orders', method: 'POST' });

    filter.catch(new Error('falha inesperada'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  });
});
