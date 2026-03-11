import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigModule, BaseEnvSchema, MongoEnvSchema, KafkaEnvSchema } from '@libs/config';
import { DatabaseModule } from '@libs/database';
import { KafkaModule } from '@libs/kafka';
import { NotificationsModule } from './modules/notifications/notifications.module';

const ServiceEnvSchema = BaseEnvSchema.merge(MongoEnvSchema).merge(KafkaEnvSchema);

@Module({
  imports: [
    AppConfigModule.forRoot(ServiceEnvSchema),
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI')!,
        dbName: config.get<string>('MONGO_DB_NAME')!,
      }),
    }),
    KafkaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        clientId: config.get<string>('KAFKA_CLIENT_ID')!,
        brokers: config.get<string[]>('KAFKA_BROKERS')!,
        groupId: config.get<string>('KAFKA_GROUP_ID')!,
      }),
    }),
    NotificationsModule,
  ],
})
export class AppModule {}
