import { Module, Global } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import type { ZodTypeAny } from 'zod';
import { validateEnv } from './env.schema';

@Global()
@Module({})
export class AppConfigModule {
  static forRoot(schema: ZodTypeAny): DynamicModule {
    return {
      module: AppConfigModule,
      imports: [
        NestConfigModule.forRoot({
          isGlobal: true,
          validate: (env) => validateEnv(schema, env),
        }),
      ],
      providers: [ConfigService],
      exports: [ConfigService],
    };
  }
}
