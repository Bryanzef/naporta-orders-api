import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('naPorta Orders API')
    .setDescription('API de gerenciamento de pedidos — naPorta Logtech')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('orders', 'Gerenciamento de pedidos')
    .addTag('health', 'Status da aplicação')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`API rodando em http://localhost:${port}/api/v1`);
  logger.log(`Swagger em  http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Erro fatal no bootstrap:', error);
  process.exit(1);
});
