import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import type { BaseEnv, MongoEnv, KafkaEnv } from '@libs/config';
import { AppModule } from './app.module';

type AppConfig = BaseEnv & MongoEnv & KafkaEnv;

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create temporary app to get ConfigService
  const tempApp = await NestFactory.createApplicationContext(AppModule);
  const configService = tempApp.get<ConfigService<AppConfig>>(ConfigService);

  const kafkaBrokers = configService.get('KAFKA_BROKERS', { infer: true })!;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('KAFKA_CLIENT_ID', { infer: true })!,
        brokers: kafkaBrokers,
        retry: { retries: 5 },
      },
      consumer: {
        groupId: configService.get('KAFKA_GROUP_ID', { infer: true })!,
        allowAutoTopicCreation: true,
      },
    },
  });

  app.enableShutdownHooks();
  await app.listen();

  logger.log('🔔 Notification Service microservice is listening for Kafka events');
  logger.log(`📨 Connected to Kafka brokers: ${kafkaBrokers.join(', ')}`);

  // We can close the tempApp context now
  await tempApp.close();
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').fatal('Failed to start notification-service', err);
  process.exit(1);
});
