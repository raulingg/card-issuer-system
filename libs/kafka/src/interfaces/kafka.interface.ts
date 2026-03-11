export interface IKafkaMessage<T = unknown> {
  pattern: string;
  data: T;
  metadata?: IKafkaMessageMetadata;
}

export interface IKafkaMessageMetadata {
  correlationId?: string;
  timestamp?: string;
  source?: string;
  version?: string;
}

export interface IKafkaModuleOptions {
  clientId: string;
  brokers: string[];
  groupId: string;
  ssl?: boolean;
  retries?: number;
}
