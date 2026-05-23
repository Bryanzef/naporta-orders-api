import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  const appService = {
    health: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    controller = module.get(AppController);
    jest.clearAllMocks();
  });

  it('health deve delegar ao AppService', async () => {
    const status = {
      status: 'ok' as const,
      uptime: 10,
      database: 'connected' as const,
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    appService.health.mockResolvedValue(status);

    await expect(controller.health()).resolves.toBe(status);
    expect(appService.health).toHaveBeenCalledTimes(1);
  });
});
