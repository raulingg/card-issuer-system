import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KAFKA_CLIENT, KafkaTopic } from '@libs/kafka';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
  ) {}

  async sendWelcomeNotification(payload: {
    data: { id: string; email: string; name: string };
  }): Promise<void> {
    const { id, email, name } = payload.data;

    const notification = await this.notificationModel.create({
      recipientId: id,
      recipientEmail: email,
      channel: 'email',
      subject: 'Welcome to our platform!',
      body: `Hi ${name}, welcome aboard!`,
      status: 'pending',
    });

    try {
      // Placeholder: integrate with email provider (SendGrid, SES, etc.)
      this.logger.log(`Sending welcome email to ${email}`);

      await this.notificationModel.findByIdAndUpdate(notification._id, {
        status: 'sent',
        sentAt: new Date(),
      });

      this.kafkaClient.emit(KafkaTopic.NOTIFICATION_SENT, {
        pattern: KafkaTopic.NOTIFICATION_SENT,
        data: { notificationId: notification._id, recipientId: id },
        metadata: { timestamp: new Date().toISOString(), source: 'notification-service' },
      });
    } catch (error) {
      this.logger.error(`Failed to send notification to ${email}`, error);
      await this.notificationModel.findByIdAndUpdate(notification._id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async processNotification(payload: unknown): Promise<void> {
    this.logger.log(`Processing generic notification: ${JSON.stringify(payload)}`);
    // Extend this for custom notification patterns
  }
}
