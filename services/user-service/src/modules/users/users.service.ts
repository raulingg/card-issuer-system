import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_CLIENT, KafkaTopic } from '@libs/kafka';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UsersRepository } from './users.repository';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const exists = await this.usersRepository.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException(`User with email ${dto.email} already exists`);
    }

    const user = await this.usersRepository.create(dto);
    this.logger.log(`User created: ${user._id}`);

    this.kafkaClient.emit(KafkaTopic.USER_CREATED, {
      pattern: KafkaTopic.USER_CREATED,
      data: { id: user._id, name: user.name, email: user.email },
      metadata: { timestamp: new Date().toISOString(), source: 'user-service' },
    });

    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    return this.usersRepository.findAll({ status: { $ne: 'banned' } });
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.usersRepository.update(id, dto);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.kafkaClient.emit(KafkaTopic.USER_UPDATED, {
      pattern: KafkaTopic.USER_UPDATED,
      data: { id: user._id, ...dto },
      metadata: { timestamp: new Date().toISOString(), source: 'user-service' },
    });

    return user;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.usersRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.kafkaClient.emit(KafkaTopic.USER_DELETED, {
      pattern: KafkaTopic.USER_DELETED,
      data: { id },
      metadata: { timestamp: new Date().toISOString(), source: 'user-service' },
    });
  }
}
