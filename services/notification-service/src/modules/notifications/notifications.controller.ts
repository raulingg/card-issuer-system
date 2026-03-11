import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KafkaTopic } from '@libs/kafka';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern(KafkaTopic.USER_CREATED)
  async handleUserCreated(@Payload() payload: unknown) {
    this.logger.log(`Handling user.created event: ${JSON.stringify(payload)}`);
    await this.notificationsService.sendWelcomeNotification(
      payload as { data: { id: string; email: string; name: string } },
    );
  }

  @EventPattern(KafkaTopic.NOTIFICATION_SEND)
  async handleSendNotification(@Payload() payload: unknown) {
    this.logger.log(`Handling notification.send event`);
    await this.notificationsService.processNotification(payload);
  }
}
