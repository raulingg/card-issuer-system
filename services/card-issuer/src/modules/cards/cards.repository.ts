import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@libs/database';
import { CARD_REQUEST_STATUSES } from './schemas/card-request-status.enum';
import { CardRequest } from './schemas/card-request.schema';
import type { CardRequestDocument } from './schemas/card-request.schema';
import type { CardIssuedEventDataDto } from '@libs/kafka';

@Injectable()
export class CardsRepository extends BaseRepository<CardRequestDocument> {
  constructor(
    @InjectModel(CardRequest.name) private readonly cardRequestModel: Model<CardRequestDocument>,
  ) {
    super(cardRequestModel);
  }

  async checkIfCustomerHasAlreadyIssuedCardOrPendingRequest(
    documentNumber: string,
  ): Promise<boolean> {
    const count = await this.cardRequestModel
      .countDocuments({
        $or: [
          { 'customer.documentNumber': documentNumber, status: CARD_REQUEST_STATUSES.ISSUED },
          { 'customer.documentNumber': documentNumber, status: CARD_REQUEST_STATUSES.PENDING },
        ],
      })
      .exec();
    return count > 0;
  }

  async markAsIssuedByRequestId(
    requestId: CardIssuedEventDataDto['requestId'],
    card: CardIssuedEventDataDto['card'],
  ): Promise<void> {
    await this.cardRequestModel
      .updateOne(
        { requestId },
        {
          $set: {
            status: CARD_REQUEST_STATUSES.ISSUED,
            card,
          },
        },
      )
      .exec();
  }

  async markAsFailedByRequestId(
    requestId: string,
    reason: string,
    attempts: number,
  ): Promise<void> {
    await this.cardRequestModel
      .updateOne(
        { requestId },
        {
          $set: {
            status: CARD_REQUEST_STATUSES.FAILED,
          },
          $push: {
            failureHistory: {
              at: new Date(),
              reason,
              attempts,
            },
          },
        },
      )
      .exec();
  }
}
