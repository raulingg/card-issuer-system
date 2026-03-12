import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CARD_REQUEST_STATUSES, CardRequestStatus } from './card-request-status.enum';

@Schema({ _id: false })
class Customer {
  @Prop({ required: true, enum: ['DNI'] })
  documentType: string;

  @Prop({ required: true })
  documentNumber: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  age: number;

  @Prop({ required: true })
  email: string;
}

@Schema({ _id: false })
class Product {
  @Prop({ required: true, enum: ['VISA'] })
  type: string;

  @Prop({ required: true, enum: ['PEN', 'USD'] })
  currency: string;
}

@Schema({ _id: false })
class IssuedCard {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  maskedNumber: string;

  @Prop({ required: true })
  expirationDate: string;
}

@Schema({ _id: false })
class FailureHistoryEntry {
  @Prop({ type: Date, required: true })
  at: Date;

  @Prop({ type: String, required: true })
  reason: string;

  @Prop({ type: Number, required: true })
  attempts: number;
}

export type CardRequestDocument = CardRequest & Document;

@Schema({ _id: false })
@Schema({ timestamps: true })
export class CardRequest {
  @Prop({ required: true, unique: true })
  requestId: string;

  @Prop({ type: Customer, required: true })
  customer: Customer;

  @Prop({ type: Product, required: true })
  product: Product;

  @Prop({ type: String, required: true, enum: Object.values(CARD_REQUEST_STATUSES) })
  status: CardRequestStatus;

  @Prop({ type: IssuedCard, required: false })
  card?: IssuedCard;

  @Prop({ type: [FailureHistoryEntry], default: [], required: false })
  failureHistory?: FailureHistoryEntry[];

  @Prop({ type: Boolean, default: false })
  forceError: boolean;
}

export const CardRequestSchema = SchemaFactory.createForClass(CardRequest);
