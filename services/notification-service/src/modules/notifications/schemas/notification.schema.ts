import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({
  timestamps: true,
  collection: 'notifications',
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
    },
  },
})
export class Notification {
  @Prop({ required: true })
  recipientId: string;

  @Prop({ required: true })
  recipientEmail: string;

  @Prop({ required: true, enum: ['email', 'sms', 'push'] })
  channel: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  body: string;

  @Prop({ default: 'pending', enum: ['pending', 'sent', 'failed'] })
  status: string;

  @Prop()
  sentAt?: Date;

  @Prop()
  errorMessage?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ recipientId: 1 });
NotificationSchema.index({ status: 1 });
