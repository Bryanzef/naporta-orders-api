import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve delegar cadastro ao AuthService', async () => {
      const dto = {
        name: 'Maria',
        email: 'maria@naporta.com.br',
        password: 'senha123',
      };
      const response = {
        accessToken: 'token',
        tokenType: 'Bearer' as const,
        expiresIn: 900,
      };
      authService.register.mockResolvedValue(response);

      await expect(controller.register(dto)).resolves.toBe(response);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('deve delegar login ao AuthService', async () => {
      const dto = { email: 'maria@naporta.com.br', password: 'senha123' };
      const response = {
        accessToken: 'token',
        tokenType: 'Bearer' as const,
        expiresIn: 900,
      };
      authService.login.mockResolvedValue(response);

      await expect(controller.login(dto)).resolves.toBe(response);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });
});
