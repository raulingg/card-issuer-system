import { Global, Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import type { MongooseModuleOptions } from '@nestjs/mongoose';

export interface IDatabaseModuleOptions {
  uri: string;
  dbName?: string;
  options?: MongooseModuleOptions;
}

export interface IDatabaseModuleAsyncOptions {
  imports?: any[];
  useFactory: (...args: any[]) => Promise<IDatabaseModuleOptions> | IDatabaseModuleOptions;
  inject?: any[];
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(opts: IDatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRoot(opts.uri, {
          dbName: opts.dbName,
          autoCreate: true,
          autoIndex: true,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          ...opts.options,
        }),
      ],
      exports: [MongooseModule],
    };
  }

  static forRootAsync(opts: IDatabaseModuleAsyncOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          imports: opts.imports,
          useFactory: async (...args: any[]) => {
            const options = await opts.useFactory(...args);
            return {
              uri: options.uri,
              dbName: options.dbName,
              autoCreate: true,
              autoIndex: true,
              serverSelectionTimeoutMS: 5000,
              socketTimeoutMS: 45000,
              maxPoolSize: 10,
              ...options.options,
            };
          },
          inject: opts.inject,
        }),
      ],
      exports: [MongooseModule],
    };
  }
}
