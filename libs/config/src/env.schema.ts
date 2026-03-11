import { z } from 'zod';

export const BaseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
});

export const KafkaEnvSchema = z.object({
  KAFKA_BROKERS: z
    .string()
    .default('localhost:9092')
    .transform((val) => val.split(',')),
  KAFKA_CLIENT_ID: z.string().default('nestjs-service'),
  KAFKA_GROUP_ID: z.string().default('nestjs-group'),
  KAFKA_SSL: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
});

export const MongoEnvSchema = z.object({
  MONGO_URI: z.string().url().default('mongodb://localhost:27017'),
  MONGO_DB_NAME: z.string().default('nestjs_db'),
});

export const HttpEnvSchema = z.object({
  HTTP_PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10)),
  HTTP_HOST: z.string().default('0.0.0.0'),
});

export type BaseEnv = z.infer<typeof BaseEnvSchema>;
export type KafkaEnv = z.infer<typeof KafkaEnvSchema>;
export type MongoEnv = z.infer<typeof MongoEnvSchema>;
export type HttpEnv = z.infer<typeof HttpEnvSchema>;

export function validateEnv<T extends z.ZodTypeAny>(
  schema: T,
  env: Record<string, string | undefined> = process.env,
): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    throw new Error(`Environment validation failed:\n${JSON.stringify(errors, null, 2)}`);
  }
  return result.data;
}
