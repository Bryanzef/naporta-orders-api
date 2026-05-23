import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const usersService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
    jest.clearAllMocks();
  });

  it('deve lançar erro quando JWT secret não está configurado', () => {
    expect(
      () =>
        new JwtStrategy(
          { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
          usersService as unknown as UsersService,
        ),
    ).toThrow('JWT secret not configured');
  });

  it('validate deve retornar usuário autenticado', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      name: 'Maria',
    });

    await expect(
      strategy.validate({ sub: 'user-1', email: 'a@b.com' }),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'a@b.com',
      name: 'Maria',
    });
  });

  it('validate deve lançar UnauthorizedException quando usuário não existe', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'a@b.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
