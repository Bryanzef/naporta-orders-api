import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  database: 'connected' | 'disconnected';
  timestamp: string;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  async health(): Promise<HealthStatus> {
    let database: HealthStatus['database'] = 'connected';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.warn(
        `Database health check failed: ${(error as Error).message}`,
      );
      database = 'disconnected';
    }

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      uptime: Math.round(process.uptime()),
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
