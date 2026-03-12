export interface IKafkaModuleOptions {
  clientId: string;
  brokers: string[];
  groupId: string;
  ssl?: boolean;
  retries?: number;
}
