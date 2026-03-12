import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppConfigModule,
  BaseEnvSchema,
  MongoEnvSchema,
  KafkaEnvSchema,
  HttpEnvSchema,
  KafkaEnv,
} from '@libs/config';
import { KafkaModule } from '@libs/kafka';
import { CardProcessorService } from './card-processor.service';
import { CardProcessorController } from './card-processor.controller';

const ServiceEnvSchema = BaseEnvSchema.merge(MongoEnvSchema)
  .merge(KafkaEnvSchema)
  .merge(HttpEnvSchema);

@Module({
  imports: [
    AppConfigModule.forRoot(ServiceEnvSchema),
    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<KafkaEnv, true>) => ({
        clientId: config.get('KAFKA_CLIENT_ID', { infer: true }),
        brokers: config.get('KAFKA_BROKERS', { infer: true }),
        groupId: config.get('KAFKA_GROUP_ID', { infer: true }),
      }),
    }),
  ],
  controllers: [CardProcessorController],
  providers: [CardProcessorService],
})
export class AppModule {}
