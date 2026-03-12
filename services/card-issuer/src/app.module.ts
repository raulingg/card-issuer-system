import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppConfigModule,
  BaseEnvSchema,
  MongoEnvSchema,
  KafkaEnvSchema,
  HttpEnvSchema,
  KafkaEnv,
  MongoEnv,
} from '@libs/config';
import { DatabaseModule } from '@libs/database';
import { HealthModule } from './modules/health/health.module';
import { CardsModule } from './modules/cards/cards.module';
import { KafkaModule } from '@libs/kafka';

const ServiceEnvSchema = BaseEnvSchema.merge(MongoEnvSchema)
  .merge(KafkaEnvSchema)
  .merge(HttpEnvSchema);

@Module({
  imports: [
    AppConfigModule.forRoot(ServiceEnvSchema),
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<MongoEnv, true>) => ({
        uri: config.get('MONGO_URI', { infer: true }),
        dbName: config.get('MONGO_DB_NAME', { infer: true }),
      }),
    }),
    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<KafkaEnv, true>) => ({
        clientId: config.get('KAFKA_CLIENT_ID', { infer: true }),
        brokers: config.get('KAFKA_BROKERS', { infer: true }),
        groupId: config.get('KAFKA_GROUP_ID', { infer: true }),
      }),
    }),
    HealthModule,
    CardsModule,
  ],
})
export class AppModule {}
