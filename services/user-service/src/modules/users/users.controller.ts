import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ZodValidationPipe } from '@libs/common';
import { KafkaTopic } from '@libs/kafka';
import {
  CreateUserDto,
  CreateUserSchema,
  UpdateUserDto,
  UpdateUserSchema,
  UserIdParam,
  UserIdParamSchema,
} from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  // ─── REST endpoints ────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param(new ZodValidationPipe(UserIdParamSchema)) { id }: UserIdParam) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  update(
    @Param(new ZodValidationPipe(UserIdParamSchema)) { id }: UserIdParam,
    @Body(new ZodValidationPipe(UpdateUserSchema)) dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param(new ZodValidationPipe(UserIdParamSchema)) { id }: UserIdParam) {
    return this.usersService.remove(id);
  }

  // ─── Kafka event handlers ──────────────────────────────────────────────────

  @MessagePattern(KafkaTopic.USER_CREATED)
  handleUserCreatedEvent(@Payload() message: unknown) {
    this.logger.debug(`Received user.created event: ${JSON.stringify(message)}`);
  }

  @EventPattern(KafkaTopic.NOTIFICATION_SENT)
  handleNotificationSent(@Payload() payload: unknown) {
    this.logger.log(`Notification sent event received: ${JSON.stringify(payload)}`);
  }
}
