import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@libs/database';
import { CARD_REQUEST_STATUSES } from './schemas/card-request-status.enum';
import { CardRequest } from './schemas/card-request.schema';
import type { CardRequestDocument } from './schemas/card-request.schema';

@Injectable()
export class CardsRepository extends BaseRepository<CardRequestDocument> {
  constructor(
    @InjectModel(CardRequest.name) private cardRequestModel: Model<CardRequestDocument>,
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
}
