import { Global, Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import type { IKafkaModuleOptions } from './interfaces/kafka.interface';

export const KAFKA_CLIENT = 'KAFKA_CLIENT';

export interface IKafkaModuleAsyncOptions {
  imports?: any[];
  useFactory: (...args: any[]) => Promise<IKafkaModuleOptions> | IKafkaModuleOptions;
  inject?: any[];
}

@Global()
@Module({})
export class KafkaModule {
  static forRoot(options: IKafkaModuleOptions): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        ClientsModule.register([
          {
            name: KAFKA_CLIENT,
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: options.clientId,
                brokers: options.brokers,
                ssl: options.ssl ?? false,
                retry: {
                  retries: options.retries ?? 5,
                  initialRetryTime: 300,
                  factor: 0.2,
                },
              },
              consumer: {
                groupId: options.groupId,
              },
              producer: {
                allowAutoTopicCreation: true,
              },
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }

  static forRootAsync(options: IKafkaModuleAsyncOptions): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name: KAFKA_CLIENT,
            imports: options.imports,
            inject: options.inject,
            useFactory: async (...args: any[]) => {
              const opts = await options.useFactory(...args);
              return {
                transport: Transport.KAFKA,
                options: {
                  client: {
                    clientId: opts.clientId,
                    brokers: opts.brokers,
                    ssl: opts.ssl ?? false,
                    retry: {
                      retries: opts.retries ?? 5,
                      initialRetryTime: 300,
                      factor: 0.2,
                    },
                  },
                  consumer: {
                    groupId: opts.groupId,
                  },
                  producer: {
                    allowAutoTopicCreation: true,
                  },
                },
              };
            },
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
