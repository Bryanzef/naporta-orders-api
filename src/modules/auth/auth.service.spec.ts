import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { CreateUserInput } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
  };
  const configService = {
    get: jest.fn().mockReturnValue('15m'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
    configService.get.mockReturnValue('15m');
  });

  describe('register', () => {
    it('deve criar o usuário com senha hasheada e devolver token', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      let captured: CreateUserInput | undefined;
      usersService.create.mockImplementation((data: CreateUserInput) => {
        captured = data;
        return Promise.resolve({
          id: 'user-1',
          email: data.email,
          name: data.name,
          passwordHash: data.passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      const result = await service.register({
        name: 'Maria',
        email: 'maria@naporta.com.br',
        password: 'senha123',
      });

      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(captured).toBeDefined();
      expect(captured?.passwordHash).not.toBe('senha123');
      await expect(
        bcrypt.compare('senha123', captured?.passwordHash ?? ''),
      ).resolves.toBe(true);
      expect(result.accessToken).toBe('signed-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(15 * 60);
    });

    it('deve lançar ConflictException quando o e-mail já existe', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'user-1' });

      await expect(
        service.register({
          name: 'Maria',
          email: 'maria@naporta.com.br',
          password: 'senha123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('deve emitir token quando as credenciais estão corretas', async () => {
      const passwordHash = await bcrypt.hash('senha123', 4);
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'maria@naporta.com.br',
        name: 'Maria',
        passwordHash,
      });

      const result = await service.login({
        email: 'maria@naporta.com.br',
        password: 'senha123',
      });

      expect(result.accessToken).toBe('signed-token');
    });

    it('deve usar mensagem genérica quando o usuário não existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@y.com', password: 'senha123' }),
      ).rejects.toMatchObject({
        message: 'Credenciais inválidas',
      });
    });

    it('deve usar mensagem genérica quando a senha não bate', async () => {
      const passwordHash = await bcrypt.hash('senha-correta', 4);
      usersService.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'maria@naporta.com.br',
        name: 'Maria',
        passwordHash,
      });

      await expect(
        service.login({ email: 'maria@naporta.com.br', password: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('parseExpirationSeconds', () => {
    it.each([
      ['15m', 15 * 60],
      ['1h', 3600],
      ['30s', 30],
      ['2d', 2 * 86400],
      ['120', 120],
    ])('deve converter %s em %i segundos', async (raw, expected) => {
      configService.get.mockReturnValue(raw);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        name: 'Test',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register({
        name: 'Test',
        email: 'a@b.com',
        password: 'senha123',
      });

      expect(result.expiresIn).toBe(expected);
    });

    it('deve usar 900 segundos como fallback para formato inválido', async () => {
      configService.get.mockReturnValue('invalido');
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'user-1',
        email: 'a@b.com',
        name: 'Test',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register({
        name: 'Test',
        email: 'a@b.com',
        password: 'senha123',
      });

      expect(result.expiresIn).toBe(900);
    });
  });
});
