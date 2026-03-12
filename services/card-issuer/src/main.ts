import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter, LoggingInterceptor } from '@libs/common';
import type { HttpEnv, MongoEnv, KafkaEnv, BaseEnv } from '@libs/config';
import { AppModule } from './app.module';

type AppConfig = HttpEnv & MongoEnv & KafkaEnv & BaseEnv;

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // HTTP server
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // The AppConfigModule in AppModule already validates the environment using Zod schemas.
  // We get the validated ConfigService here for type-safe access during bootstrap.
  const configService = app.get<ConfigService<AppConfig, true>>(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors({ origin: configService.get('CORS_ORIGIN', { infer: true }) });
  app.enableShutdownHooks();

  // Kafka microservice listener
  const kafkaBrokers = configService.get('KAFKA_BROKERS', { infer: true });
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('KAFKA_CLIENT_ID', { infer: true }),
        brokers: kafkaBrokers,
        retry: { retries: 5 },
      },
      consumer: {
        groupId: configService.get('KAFKA_GROUP_ID', { infer: true }),
        allowAutoTopicCreation: true,
      },
    },
  });

  await app.startAllMicroservices();

  const port = configService.get('HTTP_PORT', { infer: true })!;
  const host = configService.get('HTTP_HOST', { infer: true }) ?? '0.0.0.0';
  await app.listen(port, host);

  logger.log(`🚀 card-issuer service running on http://${host}:${port}/api/v1`);
  logger.log(`📨 Kafka microservice listener connected to ${kafkaBrokers.join(', ')}`);
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').fatal('Failed to start card-issuer service', err);
  process.exit(1);
});
